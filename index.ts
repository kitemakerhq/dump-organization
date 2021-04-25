import { InMemoryCache, IntrospectionFragmentMatcher } from 'apollo-cache-inmemory';
import { ApolloClient } from 'apollo-client';
import { setContext } from 'apollo-link-context';
import { HttpLink } from 'apollo-link-http';
import 'cross-fetch/polyfill';
import { organizationQuery } from './queries/organization';
import { themesQuery } from './queries/themes';
import { workItemsQuery } from './queries/workItems';

if (!process.env.KITEMAKER_TOKEN) {
  console.error(
    'Could not find Kitemaker token. Make sure the KITEMAKER_TOKEN environment variable is set.'
  );
  process.exit(-1);
}

if (process.argv.length !== 3) {
  console.error('Usage: yarn run <organization-id>');
  process.exit(-1);
}

const host = process.env.KITEMAKER_HOST ?? 'https://toil.kitemaker.co';

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
  introspectionQueryResultData: { __schema: { types: [] } },
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

async function fetchThemes(space: string): Promise<any[]> {
  const themes: any[] = [];
  let hasMore = true;
  let cursor: string | null = null;

  while (hasMore) {
    const result: any = await client.query({
      query: themesQuery,
      variables: {
        space,
        cursor,
      },
    });

    if (result.errors) {
      console.error('Unable to dump work themes', JSON.stringify(result.errors, null, '  '));
      process.exit(-1);
    }

    cursor = result.data.themes.cursor;
    hasMore = result.data.themes.hasMore;
    for (const theme of result.data.themes.themes) {
      themes.push(theme);
    }
  }
  return themes;
}

async function fetchSpace(spaceId: string) {
  const workItems = await fetchWorkItems(spaceId);
  const themes = await fetchThemes(spaceId);

  return {
    id: spaceId,
    workItems,
    themes,
  };
}

async function dump() {
  try {
    const result = await client.query({ query: organizationQuery });
    if (result.errors) {
      console.error('Unable to dump organization', JSON.stringify(result.errors, null, '  '));
      process.exit(-1);
    }

    const org = result.data.organization;
    const spaceData: any[] = await Promise.all(org.spaces.map((s: any) => fetchSpace(s.id)));

    for (const spaceWorkItemsAndThemes of spaceData) {
      const space = org.spaces.find((s: any) => s.id === spaceWorkItemsAndThemes.id);
      space.workItems = spaceWorkItemsAndThemes.workItems;
      space.themes = spaceWorkItemsAndThemes.themes;
    }

    console.log(JSON.stringify(org, null, '  '));
  } catch (e) {
    console.error('Error dumping organization', e.message, JSON.stringify(e, null, '  '));
  }
}

dump();
