import gql from 'graphql-tag';

export const organizationQuery = gql`
  query Organization {
    organization {
      id
      name
      createdAt
      updatedAt

      users {
        id
        username
        name
        guest
        deactivated
        createdAt
        updatedAt
      }

      integrations {
        id
        type
        createdAt
        updatedAt
      }

      integrationUsers {
        id
        type
        externalId
        externalName
        createdAt
        updatedAt
      }

      applications {
        id
        name
        createdAt
        updatedAt
      }

      spaces {
        id
        key
        name
        private
        members {
          id
        }
        createdAt
        updatedAt

        statuses {
          id
          name
          type
          createdAt
          updatedAt
        }

        labels {
          id
          name
          color
          createdAt
          updatedAt
        }
      }
    }
  }
`;
