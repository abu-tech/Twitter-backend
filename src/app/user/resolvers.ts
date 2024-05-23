import JWTService from "../../services/jwt"
import { graphqlContext } from "../../interfaces";
import { User } from "@prisma/client";
import UserService from "../../services/user";
import TweetService from "../../services/tweet";
import { prismaClient } from "../../clients/db";


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

const mutations = {
    followUser: async (parent: any, { to }: { to: string }, ctx: graphqlContext) => {
        if (!ctx.userToken) {
            throw new Error("Not Authenticated")
        }

        const userId = JWTService.decodeToken(ctx.userToken)?.id

        if (!userId) {
            throw new Error("Undefined User")
        }

        await UserService.followUser(userId, to)

        return true
    },

    unfollowUser: async (parent: any, { to }: { to: string }, ctx: graphqlContext) => {
        if (!ctx.userToken) {
            throw new Error("Not Authenticated")
        }

        const userId = JWTService.decodeToken(ctx.userToken)?.id

        if (!userId) {
            throw new Error("Undefined User")
        }

        await UserService.unfollowUser(userId, to)

        return true
    },
}

const extraResolvers = {
    User: {
        tweets: async (parent: User) => await TweetService.getAllTweets(parent.id),

        followers: async (parent: User) => await UserService.getFollowers(parent.id),

        following: async (parent: User) => await UserService.getFollowing(parent.id),

        recommendedUsers: async (parent: User, args: any, ctx: graphqlContext) => {
            if (!ctx.userToken) return []

            const res = await UserService.getRecommendations(parent.id)

            return res
        }
    }
}

export const resolvers = { queries, extraResolvers, mutations }