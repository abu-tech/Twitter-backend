import { prismaClient } from "../clients/db"


export interface CreateTweetData {
    content: string,
    imageURL?: string,
    userId: string
}

class TweetService {
    public static async createTweet(payload: CreateTweetData) {
        const tweet = await prismaClient.tweet.create({
            data: {
                content: payload.content,
                imageURL: payload.imageURL,
                author: { connect: { id: payload.userId } }
            }
        })

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

        return tweets
    }
}

export default TweetService