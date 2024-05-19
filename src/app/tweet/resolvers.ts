import { Tweet } from "@prisma/client";
import { prismaClient } from "../../clients/db";
import { graphqlContext } from "../../interfaces";
import JWTService from "../../services/jwt";

interface CreateTweetData {
    content: string,
    imageURL?: string,
}

const queries = {
    getAllTweets: async () => await prismaClient.tweet.findMany({ orderBy: { createdAt: "desc" } })
}

const mutations = {
    createTweet: async (parent: any, { payload }: { payload: CreateTweetData }, ctx: graphqlContext) => {
        if (!ctx.userToken) {
            throw new Error("You are not Authenticated!")
        }

        const USerId = JWTService.decodeToken(ctx.userToken)?.id

        const tweet = await prismaClient.tweet.create({
            data: {
                content: payload.content,
                imageURL: payload.imageURL,
                author: { connect: { id: USerId } }
            }
        })

        return tweet
    }
}

const extraResolvers = {
    Tweet: {
        author: (parent: Tweet) => prismaClient.user.findUnique({ where: { id: parent.authorId } })
    }
}

export const resolvers = { queries, mutations, extraResolvers }