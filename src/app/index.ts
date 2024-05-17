import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import express from 'express';
import { User } from './user';
import cors from "cors"
import { graphqlContext } from '../interfaces';

export async function initServer() {
    const app = express();

    app.use(cors())

    const server = new ApolloServer<graphqlContext>({
        //schema's
        typeDefs: `
            ${User.types}

            type Query {
                ${User.queries}
            }
        `,
        resolvers: {
            Query: {
                ...User.resolvers.queries,
            },
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
