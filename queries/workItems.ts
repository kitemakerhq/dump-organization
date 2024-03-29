import gql from 'graphql-tag';
import { actorFragment } from './fragments';

export const workItemsQuery = gql`
  query WorkItems($space: ID!, $cursor: String) {
    workItems(spaceId: $space, cursor: $cursor, count: 50) {
      workItems {
        id
        number
        title
        description
        status {
          id
        }
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
