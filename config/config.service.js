import { resolve } from 'node:path'
import { config } from 'dotenv'

export const NODE_ENV = process.env.NODE_ENV

const envPath = {
    development: `.env.development`,
    production: `.env.production`,
}
console.log({ en: envPath[NODE_ENV] });


config({ path: resolve(`./config/${envPath[NODE_ENV]}`) })


export const port = process.env.PORT ?? 7000
export const SALT_ROUND = parseInt(process.env.SALT_ROUND) ?? 12
export const DB_URI = process.env.DB_URI
export const REDIS_URI = process.env.REDIS_URI


export const ENC_SECRET_KEY = Buffer.from(process.env.ENC_SECRET_KEY)
export const IV_LENGTH = parseInt(process.env.IV_LENGTH) ?? 16

// TOKEN
export const USER_ACCESS_TOKEN_SIGNATURE = process.env.USER_ACCESS_TOKEN_SIGNATURE
export const USER_REFRESH_TOKEN_SIGNATURE = process.env.USER_REFRESH_TOKEN_SIGNATURE

export const SYSTEM_ACCESS_TOKEN_SIGNATURE = process.env.SYSTEM_ACCESS_TOKEN_SIGNATURE
export const SYSTEM_REFRESH_TOKEN_SIGNATURE = process.env.SYSTEM_REFRESH_TOKEN_SIGNATURE

export const ACCESS_EXPIRES_IN = parseInt(process.env.ACCESS_EXPIRES_IN)
export const REFRESH_EXPIRES_IN = parseInt(process.env.REFRESH_EXPIRES_IN)


export const CLIENT_ID = process.env.CLIENT_ID


export const CLOUD_NAME = process.env.CLOUD_NAME
export const API_KEY = process.env.API_KEY
export const API_SECRET = process.env.API_SECRET
export const APPLICATION_NAME = process.env.APPLICATION_NAME

export const APP_EMAIL = process.env.APP_EMAIL
export const APP_PASS = process.env.APP_PASS

export const FRONTEND_URL = process.env.FRONTEND_URL











