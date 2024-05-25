export const mutations = `#graphql
    createTweet(payload: createTweetData!) : Tweet

    deleteImageFromS3(imageKey: String!) : Boolean
`