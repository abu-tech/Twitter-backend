import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import express from 'express';
import { prismaClient } from '../clients/db';
import { User } from './user';

export async function initServer() {
    const app = express();

    const server = new ApolloServer({
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
        },
    });
    // Note you must call `start()` on the `ApolloServer`
    // instance before passing the instance to `expressMiddleware`
    await server.start();

    // Specify the path where we'd like to mount our server
    app.use('/graphql', express.json(), expressMiddleware(server));

    return app;
}
