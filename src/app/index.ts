import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import express from 'express';
import { User } from './user';
import { Tweet } from './tweet'
import cors from "cors"
import { graphqlContext } from '../interfaces';

export async function initServer() {
    const app = express();

    app.use(cors())

    const server = new ApolloServer<graphqlContext>({
        //schema's
        typeDefs: `
            ${User.types}
            ${Tweet.types}

            type Query {
                ${User.queries}
                ${Tweet.queries}
            }

            type Mutation {
                ${Tweet.mutations}
            }
        `,
        resolvers: {
            Query: {
                ...User.resolvers.queries,
                ...Tweet.resolvers.queries
            },
            Mutation: {
                ...Tweet.resolvers.mutations
            },
            ...Tweet.resolvers.extraResolvers,
            ...User.resolvers.extraResolvers,
        }
    });
    // Note you must call `start()` on the `ApolloServer`
    // instance before passing the instance to `expressMiddleware`
    await server.start();

    // Specify the path where we'd like to mount our server
    app.use('/graphql', express.json(), expressMiddleware(server, {
        context: async ({ req }) => ({
            userToken: req.headers.authorization ? req.headers.authorization.split(" ")[1] : ""
        })
    }));

    return app;
}
