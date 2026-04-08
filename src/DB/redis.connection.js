import { createClient } from "redis";
import { REDIS_URI } from "../../config/config.service.js";

export const redisClient = createClient({
    url: REDIS_URI
})

export const connectRedis = async () => {
    try {
        await redisClient.connect()
        console.log("redis connected successfully")
    } catch (error) {
        console.log("redis failed to connect", error)
    }
}