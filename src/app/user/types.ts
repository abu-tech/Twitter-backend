export const types = `#graphql

    type User {
        id: ID!,
        firstName: String!,
        lastName: String,
        email: String!,
        profileImage: String,
        followers: [User],
        following: [User],
        recommendedUsers: [User],
        tweets: [Tweet]
    }
`