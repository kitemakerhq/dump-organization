import gql from 'graphql-tag';
import { actorFragment } from './fragments';

export const initiativesQuery = gql`
  query Initiatives($cursor: String) {
    initiatives(cursor: $cursor, count: 50) {
      initiatives {
        id
        number
        title
        description
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
        impact
        effort
        roadmapColumns {
          id
        }
        updatedAt
        createdAt
      }
      cursor
      hasMore
    }
  }
  ${actorFragment}
`;
