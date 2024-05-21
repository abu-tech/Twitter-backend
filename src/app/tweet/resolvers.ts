import { Tweet } from "@prisma/client";
import { prismaClient } from "../../clients/db";
import { graphqlContext } from "../../interfaces";
import JWTService from "../../services/jwt";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

interface CreateTweetData {
    content: string,
    imageURL?: string,
}

const s3Client = new S3Client({
    region: "ap-south-1",
    credentials: { accessKeyId: process.env.AWS_S3_ACCESS_KEY || "", secretAccessKey: process.env.AWS_S3_SECRET_KEY || "" }
})

const queries = {
    getAllTweets: async () => await prismaClient.tweet.findMany({ orderBy: { createdAt: "desc" } }),

    getPresignedURL: async (parent: any, { imageType }: { imageType: string }, ctx: graphqlContext) => {
        if (!ctx.userToken) {
            throw new Error("Not Authenticated!")
        }

        if (!["jpg", "png", "jpeg", "webp"].includes(imageType)) {
            throw new Error("Unsupported Image Type")
        }

        const user = JWTService.decodeToken(ctx.userToken)

        const putObjectCommand = new PutObjectCommand({
            Bucket: "samir-twitter-app",
            Key: `uploads/${user?.id}/tweets/${Date.now().toString()}.${imageType}`
        })

        const preSignedURL = await getSignedUrl(s3Client, putObjectCommand)

        return preSignedURL
    }
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