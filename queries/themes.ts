import gql from 'graphql-tag';
import { actorFragment } from './fragments';

export const themesQuery = gql`
  query Themes($space: ID!, $cursor: String) {
    themes(spaceId: $space, cursor: $cursor, count: 50) {
      themes {
        id
        number
        title
        description
        horizon
        comments {
          id
          body
          threadId
          actor {
            ...ActorFragment
          }
          updatedAt
          createdAt
        }
        workItems {
          id
        }
        actor {
          ...ActorFragment
        }
        watchers {
          id
        }
        members {
          id
        }
        labels {
          id
        }
        impact
        effort
        updatedAt
        createdAt
      }
      cursor
      hasMore
    }
  }
  ${actorFragment}
`;
