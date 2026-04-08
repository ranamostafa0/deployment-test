import { redisClient } from "../../DB/index.js";

// We create a base key for user tokens.
export const baseRevokeTokenKey = (userId) => {     //Ex => RevokeToken::123 => All revoked tokens for user 123
    return `RevokeToken::${userId}`
}

// This creates a specific token key    =>  So now we can store revoked tokens.
export const revokeTokenKey = ({ userId, jti }) => {
    console.log(`${baseRevokeTokenKey(userId)}`)
    return `${baseRevokeTokenKey(userId)}::${jti}`      //Ex => RevokeToken::123::abc456 => When user logs out: store token in redis => So token becomes invalid.
}

export const set = async ({ key, value, ttl } = {}) => {
    try {
        // If value is: string → store directly || object → convert to JSON
        let data = typeof value === 'string' ? value : JSON.stringify(value)
        return ttl ? await redisClient.set(key, data, { EX: ttl }) : await redisClient.set(key, data)
    } catch (error) {
        console.log(`Fail in redis set Operations ${error}`);
    }
}

// There is no update() method in Redis.
export const update = async ({ key, value, ttl } = {}) => {
    try {
        // If key doesn't exist → don't update. and stops => else call set()   --- To avoid creating new key by mistake.
        if (!await redisClient.exists(key)) return 0    // set() will create or update even if key does not exist.
        return await set({ key, value, ttl })
    } catch (error) {
        console.log(`Fail in redis  update Operations ${error}`);
    }
}

export const get = async (key) => {
    try {
        try {
            // If stored as JSON → convert back to object.  || If normal string → return string.
            return JSON.parse(await redisClient.get(key))
        } catch (error) {
            return await redisClient.get(key)
        }
    } catch (error) {
        console.log(`Fail in redis get Operations ${error}`);
    }
}

// Check remaining time.  -> 120 means 2 minutes left
export const ttl = async (key) => {
    try {
        return await redisClient.ttl(key)
    } catch (error) {
        console.log(`Fail in redis ttl Operations ${error}`);
    }
}

// Check if key exists.
export const exists = async (key) => {
    try {
        return await redisClient.exists(key)
    } catch (error) {
        console.log(`Fail in redis exists Operations ${error}`);
    }
}

// Add expiration to existing key.
export const expire = async ({ key, ttl } = {}) => {
    try {
        return await redisClient.expire(key, ttl)
    } catch (error) {
        console.log(`Fail in redis expire Operations ${error}`);
    }
}

// Get multiple keys at once
export const mGet = async (keys = []) => {
    try {
        if (!keys.length) {
            return 0
        }
        return await redisClient.mGet(keys, ttl)
    } catch (error) {
        console.log(`Fail in redis mGet Operations ${error}`);
    }
}

// Get all keys with prefix
export const keys = async (prefix) => {
    try {
        return await redisClient.keys(`${prefix}*`)
    } catch (error) {
        console.log(`Fail in redis keys Operations ${error}`);
    }
}

// Delete multiple keys  => (redisClient.del() can delete one key or multiple keys)
export const deleteKeys = async (keys) => {
    try {
        if (!keys.length) {
            return 0
        }
        return await redisClient.del(keys)
    } catch (error) {
        console.log(`Fail in redis  del Operations ${error}`);
    }
}

// Increase value by 1.
export const increment = async (key) => {
    try {
        // if (!await redisClient.exists(key)) return 0;

        return redisClient.incr(key)

    } catch (error) {
        console.log(`FAIL IN REDIS INCREMENT OPERATIONS ${error}🫠`);


    }
}
