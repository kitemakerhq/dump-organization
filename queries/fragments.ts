import gql from 'graphql-tag';

export const actorFragment = gql`
  fragment ActorFragment on Actor {
    ... on User {
      id
    }
    ... on IntegrationUser {
      id
    }
    ... on Integration {
      id
    }
    ... on Application {
      id
    }
  }
`;
