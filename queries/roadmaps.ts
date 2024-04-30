import gql from 'graphql-tag';

export const roadmapsQuery = gql`
  query Roadmaps {
    roadmaps {
      roadmaps {
        id
        name
        color
        columns {
          id
          name
          columnType
          createdAt
          updatedAt
        }
        createdAt
        updatedAt
      }
    }
  }
`;
