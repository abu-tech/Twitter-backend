import axios from "axios"
import { prismaClient } from "../../clients/db"
import JWTService from "../../services/jwt"
import { graphqlContext } from "../../interfaces";
import { User } from "@prisma/client";

interface GoogleTokenResult {
    iss?: string;
    nbf?: string;
    aud?: string;
    sub?: string;
    email: string;
    email_verified: string;
    azp?: string;
    name?: string;
    picture?: string;
    given_name: string;
    family_name?: string;
    iat?: string;
    exp?: string;
    jti?: string;
    alg?: string;
    kid?: string;
    typ?: string;
}


const queries = {
    verifyGoogleToken: async (parent: any, { token }: { token: string }) => {
        const googleOauthUrl = new URL("https://oauth2.googleapis.com/tokeninfo")
        googleOauthUrl.searchParams.set("id_token", token)

        const { data } = await axios.get<GoogleTokenResult>(googleOauthUrl.toString(), { responseType: "json" })

        let user = await prismaClient.user.findUnique({
            where: { email: data.email }
        })

        //save the user in the database
        if (!user) {
            user = await prismaClient.user.create({
                data: {
                    firstName: data.given_name,
                    lastName: data.family_name,
                    email: data.email,
                    profileImage: data.picture
                },
            })
        }

        //create the jwt for the user
        const authToken = JWTService.generateTokenForUser(user)

        return authToken
    },

    getCurrentUser: async (parent: any, args: any, ctx: graphqlContext) => {
        if (!ctx.userToken) {
            return null
        }

        const id = JWTService.decodeToken(ctx.userToken)?.id
        const currentUser = await prismaClient.user.findUnique({ where: { id } })

        return currentUser
    },
}

const extraResolvers = {
    User: {
        tweets: (parent: User) => prismaClient.tweet.findMany({ where: { authorId: parent.id } })
    }
}

export const resolvers = { queries, extraResolvers }