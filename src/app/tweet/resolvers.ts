import { Tweet } from "@prisma/client";
import { graphqlContext } from "../../interfaces";
import JWTService from "../../services/jwt";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import UserService from "../../services/user";
import TweetService, { CreateTweetData } from "../../services/tweet";

const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: { accessKeyId: process.env.AWS_S3_ACCESS_KEY || "", secretAccessKey: process.env.AWS_S3_SECRET_KEY || "" }
})

const queries = {
    getAllTweets: async () => await TweetService.getAllTweets(),

    getPresignedURL: async (parent: any, { imageType }: { imageType: string }, ctx: graphqlContext) => {
        if (!ctx.userToken) {
            throw new Error("Not Authenticated!")
        }

        if (!["jpg", "png", "jpeg", "webp"].includes(imageType)) {
            throw new Error("Unsupported Image Type")
        }

        const user = JWTService.decodeToken(ctx.userToken)

        const putObjectCommand = new PutObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET,
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

        const userId = JWTService.decodeToken(ctx.userToken)?.id

        if (!userId) {
            throw new Error("Undefined User")
        }

        payload.userId = userId
        const tweet = await TweetService.createTweet(payload)

        return tweet
    }
}

const extraResolvers = {
    Tweet: {
        author: async (parent: Tweet) => await UserService.getUserById(parent.authorId)
    }
}

export const resolvers = { queries, mutations, extraResolvers }