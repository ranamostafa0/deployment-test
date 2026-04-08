import mongoose from "mongoose"
import { DB_URI } from "../../config/config.service.js"
import { UserModel } from "./model/user.model.js"

export const authenticateDB = async () => {
    try {
        await mongoose.connect(DB_URI)
        await UserModel.syncIndexes()
        console.log("Database authenticated successfully")
        console.log( await UserModel.collection.getIndexes())
    } catch (error) {
        console.log("Database authentication Failed", error.message)
    }
}