import mongoose from "mongoose"
import { DB_URI } from "../../config/config.service.js"
import { UserModel } from "./model/user.model.js"

// export const authenticateDB = async () => {
//     try {
//         await mongoose.connect(DB_URI)
//         await UserModel.syncIndexes()
//         console.log("Database authenticated successfully")
//         console.log( await UserModel.collection.getIndexes())
//     } catch (error) {
//         console.log("Database authentication Failed", error.message)
//     }
// }

let isConnected = false; // ✅ cache flag

export const authenticateDB = async () => {
    if (isConnected) return; // ✅ reuse existing connection, skip reconnecting

    try {
        await mongoose.connect(DB_URI, {
            serverSelectionTimeoutMS: 30000, // ✅ increased timeout
            socketTimeoutMS: 45000,
        })

        await UserModel.syncIndexes()
        isConnected = true; // ✅ mark as connected
        console.log("Database authenticated successfully")
        console.log(await UserModel.collection.getIndexes())
    } catch (error) {
        isConnected = false; // ✅ reset on failure so next request retries
        console.log("Database authentication Failed", error.message)
        throw error; // ✅ throw so the middleware catches it
    }
}