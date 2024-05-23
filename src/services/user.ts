import axios from "axios"
import { prismaClient } from "../clients/db";
import JWTService from "./jwt";

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

class UserService {
    public static async verifyGoogleAuthToken(token: string) {
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
    }

    public static async getUserById(userId: string) {
        const user = await prismaClient.user.findUnique({ where: { id: userId } })

        return user
    }

    public static async followUser(from: string, to: string) {
        return await prismaClient.follows.create({
            data: {
                follower: { connect: { id: from } },
                following: { connect: { id: to } }
            }
        })
    }

    public static async unfollowUser(from: string, to: string) {
        return await prismaClient.follows.delete({
            where: { followerId_followingId: { followerId: from, followingId: to } }
        })
    }

    public static async getFollowers(userId: string) {
        const result = await prismaClient.follows.findMany({
            where: { followingId: userId },
            include: { follower: true }
        })

        const followers = result.map((el) => el.follower)

        return followers
    }

    public static async getFollowing(userId: string) {
        const result = await prismaClient.follows.findMany({
            where: { followerId: userId },
            include: { following: true }
        })

        const following = result.map((el) => el.following)

        return following
    }
}

export default UserService