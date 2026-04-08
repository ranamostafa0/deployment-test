import mongoose from "mongoose";
import { genderEnum, providerEnum, roleEnum } from "../../common/enum/user.enum.js";

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        minLength: [2, "First name cannot be less than 2 characters"],
        maxLength: 25,
        trim: true,
    },

    lastName: {
        type: String,
        required: true,
        minLength: [2, "Last name cannot be less than 2 characters"],
        maxLength: 25,
        trim: true,
    },

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },

    password: {
        type: String,
        required: function () {
            console.log({ p: this.provider == providerEnum.System })
            return this.provider == providerEnum.System
        },
    },

    phone: String,

    gender: {
        type: Number,
        enum: Object.values(genderEnum),
        default: genderEnum.Male,
    },

    role: {
        type: Number,
        enum: Object.values(roleEnum),
        default: roleEnum.User
    },
    provider: {
        type: Number,
        enum: Object.values(providerEnum),
        default: providerEnum.System,
    },

    profilePicture: String,
    coverPicture: [String],
    gallery: [String],

    profileVisits: {
        type: Number,
        default: 0
    },

    twoFactorEnabled: {
        type: Boolean,
        default: false
    },

    confirmEmail: {
        type: Date,
        default: null
    },
    changeCredentialsTime: Date,
}, {
    collection: "users",
    timestamps: true,
    strict: true,
    strictQuery: true,
    optimisticConcurrency: true,
    autoIndex: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
})

userSchema.virtual("username")
    .set(function (value) {
        const [firstName, lastName] = value?.split(" ") || [];
        this.set({ firstName, lastName });
    })
    .get(function () {
        return `${this.firstName} ${this.lastName}`;
    });


// TTL index on users collection
// userSchema.index(
//     { createdAt: 1 },
//     { expireAfterSeconds: 60, partialFilterExpression: { confirmEmail: { $exists: false } } }
// )

userSchema.index(
    { createdAt: 1 },
    {
        expireAfterSeconds: 60 * 60 * 24,
        partialFilterExpression: { confirmEmail: { $type: "null" } }
    }
)

// How it works:
// Add a createdAt field (Mongoose timestamps already gives this).
// Add a TTL index that automatically deletes documents after 24 hours if confirmEmail is not set.

export const UserModel = mongoose.models.User || mongoose.model("User", userSchema)


// REDIS SOLUTION
// After signup
// await redis.set(`UNCONFIRMED_USER::${user._id}`, "1", { EX: 24 * 60 * 60 })

// // On email confirmation
// await redis.del(`UNCONFIRMED_USER::${user._id}`)