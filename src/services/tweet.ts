import { prismaClient } from "../clients/db"
import { redisClient } from "../clients/redis"


export interface CreateTweetData {
    content: string,
    imageURL?: string,
    userId: string
}

class TweetService {
    public static async createTweet(payload: CreateTweetData) {

        if (payload.content === "") {
            throw new Error("Tweet Can't be Empty")
        }

        const rateLimitFlag = await redisClient.get(`RATE_LIMIT:TWEET:${payload.userId}`)

        if (rateLimitFlag) {
            throw new Error("Please Wait for Sometime...")
        }

        const tweet = await prismaClient.tweet.create({
            data: {
                content: payload.content,
                imageURL: payload.imageURL,
                author: { connect: { id: payload.userId } }
            }
        })

        await redisClient.setex(`RATE_LIMIT:TWEET:${payload.userId}`, 10, 1)

        return tweet
    }

    public static async getAllTweets(userId?: string) {
        const queryOptions: any = {
            orderBy: { createdAt: "desc" },
        }

        if (userId) {
            queryOptions.where = { authorId: userId }
        }

        const tweets = await prismaClient.tweet.findMany(queryOptions)

        await redisClient.setex("ALL_TWEETS", 20, tweets)

        return tweets
    }
}

export default TweetService