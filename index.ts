import { InMemoryCache, IntrospectionFragmentMatcher } from 'apollo-cache-inmemory';
import { ApolloClient } from 'apollo-client';
import { setContext } from 'apollo-link-context';
import { HttpLink } from 'apollo-link-http';
import commandLineArgs from 'command-line-args';
import 'cross-fetch/polyfill';
import { keyBy } from 'lodash';
import { organizationQuery } from './queries/organization';
import { workItemsQuery } from './queries/workItems';
import { writeToString } from '@fast-csv/format';
import { roadmapsQuery } from './queries/roadmaps';
import { initiativesQuery } from './queries/initiatives';

if (!process.env.KITEMAKER_TOKEN) {
  console.error(
    'Could not find Kitemaker token. Make sure the KITEMAKER_TOKEN environment variable is set.'
  );
  process.exit(-1);
}

const host = process.env.KITEMAKER_HOST ?? 'https://toil.kitemaker.co';

const opts = commandLineArgs([
  { name: 'output', alias: 'o', defaultValue: 'json', type: String },
  { name: 'space', alias: 's', type: String, multiple: true },
  { name: 'no-description', alias: 'n', type: Boolean, defaultValue: false },
]);

if (!['json', 'csv'].includes(opts.output.toLowerCase())) {
  console.error('Invalid output format');
  process.exit(-1);
}

const filteredSpaces: string[] = (opts.space ?? []).map((s: string) => s.toLowerCase());
const noDescription: boolean = opts['no-description'];

const httpLink = new HttpLink({
  uri: `${host}/developers/graphql`,
});
const authLink = setContext((_, { headers }) => {
  return {
    headers: {
      ...headers,
      authorization: `Bearer ${process.env.KITEMAKER_TOKEN}`,
    },
  };
});

const fragmentMatcher = new IntrospectionFragmentMatcher({
  introspectionQueryResultData: {
    __schema: {
      types: [
        {
          kind: 'UNION',
          name: 'Actor',
          possibleTypes: [
            { name: 'User' },
            { name: 'Application' },
            { name: 'Integration' },
            { name: 'IntegrationUser' },
          ],
        },
      ],
    },
  },
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache({ fragmentMatcher }),
});

async function fetchWorkItems(space: string): Promise<any[]> {
  const workItems: any[] = [];
  let hasMore = true;
  let cursor: string | null = null;

  while (hasMore) {
    const result: any = await client.query({
      query: workItemsQuery,
      variables: {
        space,
        cursor,
      },
    });

    if (result.errors) {
      console.error('Unable to dump work items', JSON.stringify(result.errors, null, '  '));
      process.exit(-1);
    }

    cursor = result.data.workItems.cursor;
    hasMore = result.data.workItems.hasMore;
    for (const workItem of result.data.workItems.workItems) {
      workItems.push(workItem);
    }
  }

  return workItems;
}

async function fetchInitiatives(): Promise<any[]> {
  const initiatives: any[] = [];
  let hasMore = true;
  let cursor: string | null = null;

  while (hasMore) {
    const result: any = await client.query({
      query: initiativesQuery,
      variables: {
        cursor,
      },
    });

    if (result.errors) {
      console.error('Unable to dump work initiatives', JSON.stringify(result.errors, null, '  '));
      process.exit(-1);
    }

    cursor = result.data.initiatives.cursor;
    hasMore = result.data.initiatives.hasMore;
    for (const initiative of result.data.initiatives.initiatives) {
      initiatives.push(initiative);
    }
  }
  return initiatives;
}

async function fetchSpace(spaceId: string) {
  const workItems = await fetchWorkItems(spaceId);

  return {
    id: spaceId,
    workItems,
  };
}

async function fetchRoadmaps() {
  const result: any = await client.query({
    query: roadmapsQuery,
  });

  if (result.errors) {
    console.error('Unable to dump roadmaps', JSON.stringify(result.errors, null, '  '));
    process.exit(-1);
  }

  return result.data.roadmaps.roadmaps;
}
async function toCSV(organization: any): Promise<string> {
  const membersById = keyBy(organization.users, 'id');

  const rows = organization.spaces.flatMap((space: any) => {
    const labelsById = keyBy(space.labels, 'id');
    const statusesById = keyBy(space.statuses, 'id');

    return [
      ...space.workItems.map((workItem: any) => ({
        id: workItem.id,
        type: 'workItem',
        space: space.key,
        number: workItem.number,
        status: statusesById[workItem.status.id].name,
        title: workItem.title,
        description: noDescription ? undefined : workItem.description,
        members: (workItem.members ?? []).map((member: any) => membersById[member.id].username),
        labels: (workItem.labels ?? []).map((label: any) => labelsById[label.id].name),
        impact: workItem.impact,
        effort: workItem.effort,
        createdAt: workItem.createdAt,
        updatedAt: workItem.updatedAt,
      })),
    ];
  });

  return writeToString(rows, { headers: true });
}

async function dump() {
  try {
    const result = await client.query({ query: organizationQuery });
    if (result.errors) {
      console.error('Unable to dump organization', JSON.stringify(result.errors, null, '  '));
      process.exit(-1);
    }

    const roadmaps = await fetchRoadmaps();
    const initiatives = await fetchInitiatives();

    const org = {
      ...result.data.organization,
      roadmaps,
      initiatives,
      spaces: result.data.organization.spaces.filter(
        (s: any) => !filteredSpaces.length || filteredSpaces.includes(s.key.toLowerCase())
      ),
    };

    const spaceData: any[] = await Promise.all(org.spaces.map((s: any) => fetchSpace(s.id)));

    for (const spaceWorkItems of spaceData) {
      const space = org.spaces.find((s: any) => s.id === spaceWorkItems.id);
      space.workItems = spaceWorkItems.workItems;
    }

    if (opts.output === 'json') {
      console.log(JSON.stringify(org, null, '  '));
    } else {
      console.log(await toCSV(org));
    }
  } catch (e: any) {
    console.error('Error dumping organization', e.message, JSON.stringify(e, null, '  '));
  }
}

dump();
