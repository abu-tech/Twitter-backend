import JWTService from "../../services/jwt"
import { graphqlContext } from "../../interfaces";
import { User } from "@prisma/client";
import UserService from "../../services/user";
import TweetService from "../../services/tweet";


const queries = {
    verifyGoogleToken: async (parent: any, { token }: { token: string }) => {
        const authToken = await UserService.verifyGoogleAuthToken(token)

        return authToken
    },

    getCurrentUser: async (parent: any, args: any, ctx: graphqlContext) => {
        if (!ctx.userToken) {
            return null
        }

        const userId = JWTService.decodeToken(ctx.userToken)?.id

        if (!userId) {
            throw new Error("Undefined User")
        }

        const currentUser = await UserService.getUserById(userId)

        if (!currentUser) {
            throw new Error("No User Found!")
        }

        return currentUser
    },

    getUserById: async (parent: any, { id }: { id: string }, ctx: graphqlContext) => {

        const user = await UserService.getUserById(id)

        if (!user) {
            throw new Error("No User Found!")
        }

        return user
    },
}

const extraResolvers = {
    User: {
        tweets: async (parent: User) => await TweetService.getAllTweets(parent.id)
    }
}

export const resolvers = { queries, extraResolvers }