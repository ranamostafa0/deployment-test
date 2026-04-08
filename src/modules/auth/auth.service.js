import { OAuth2Client } from 'google-auth-library'
import { CLIENT_ID, FRONTEND_URL } from "../../../config/config.service.js"
import { providerEnum } from "../../common/enum/user.enum.js"
import { deleteKeys, expire, get, increment, set, ttl } from "../../common/services/redis.service.js"
import { sendEmail } from "../../common/utils/email/send.email.js"
import { BadRequestException, ConflictException, NotFoundException } from "../../common/utils/response/error.response.js"
import { generateEncrypt } from "../../common/utils/security/encrypt.security.js"
import { compareHash, generateHash } from "../../common/utils/security/hash.security.js"
import { createOtp } from "../../common/utils/security/otp.security.js"
import { createLoginCredentials } from "../../common/utils/security/token.security.js"
import * as dbService from "../../DB/db.repository.js"
import { UserModel } from "../../DB/model/user.model.js"
import crypto from "crypto"
import { successResponse } from '../../common/utils/response/success.response.js'


export const signup = async (inputs) => {
    const { username, email, password, phone } = inputs

    const emailExists = await dbService.findOne({
        model: UserModel,
        filter: { email }
    })
    if (emailExists) {
        return ConflictException({ message: "Email already exists" })
    }

    const user = await dbService.createOne(
        {
            model: UserModel,
            data: {
                username,
                email,
                password: await generateHash({ plaintext: password }),
                phone: await generateEncrypt(phone)
            }
        }
    )
    const otp = await createOtp()
    console.log({ otp })
    await set({
        key: `OTP::USER::${email}`,
        value: await generateHash({ plaintext: `${otp}` }),
        ttl: 300                //5 min
    })
    await sendEmail({ to: email, subject: "Email-Confirmation", html: `<h1>otp: ${otp}<h1>` })
    return user
}


export const resenConfirmEmail = async (inputs) => {
    const { email } = inputs

    const account = await dbService.findOne({
        model: UserModel,
        filter: {
            email,
            confirmEmail: { $exists: false },
            provider: providerEnum.System

        }
    })
    if (!account) {
        return NotFoundException({ message: "Account not found or already verified" })
    }

    const otpTTL = await ttl(`OTP::USER::${email}`)
    if (otpTTL > 0) {
        return ConflictException({ message: "You cannot request new otp until the old one expires" })
    }

    const otp = await createOtp()
    console.log({ otp })
    await set({
        key: `OTP::USER::${email}`,
        value: await generateHash({ plaintext: `${otp}` }),
        ttl: 300                //5 min
    })
    await sendEmail({ to: email, subject: "Email-Confirmation", html: `<h1>otp: ${otp}<h1>` })
    return;
}

export const confirmEmail = async (inputs) => {
    const { otp, email } = inputs

    // check account exists - not confirmed yet - his provider is system
    const account = await dbService.findOne({
        model: UserModel,
        filter: {
            email,
            confirmEmail: { $exists: false },
            provider: providerEnum.System
        }
    })
    if (!account) {
        return NotFoundException({ message: "Account not found or already verified" })
    }

    // get the hashed otp from redis or it is expired
    const hashedOtp = await get(`OTP::USER::${email}`)
    if (!hashedOtp) {
        return NotFoundException({ message: "Expired otp!" })
    }
    console.log({ hashedOtp })

    // compare hashed otp with input otp
    if (!await compareHash({ plaintext: otp, cipherText: hashedOtp })) {
        return BadRequestException({ message: "Invalid otp!" })
    }

    // confirm email
    account.confirmEmail = new Date()
    return await account.save()
}

// If NOT enabled  =>  Login normally.
// If enabled  => generate OTP  => store in Redis  => send email   => return temporary response
export const login = async (inputs, issuer) => {
    const { email, password } = inputs

    const attempstKey = `LOGIN_FAIL::${email}`

    // check if user blocked
    const attempts = await get(attempstKey)
    if (attempts && attempts >= 5) {
        const remaining = await ttl(attempstKey)
        return BadRequestException({
            message: `Account locked. Try again in ${remaining} seconds`
        })
    }

    const user = await dbService.findOne({
        model: UserModel,
        filter: { email, confirmEmail: { $exists: true } }
    })
    if (!user) {
        return NotFoundException({ message: "In-valid email not verified yet" })
    }

    const match = await compareHash({ plaintext: password, cipherText: user.password })
    // if (!match) {
    //     return NotFoundException({ message: "In-valid password" })
    // }
    if (!match) {
        const count = await increment(attempstKey)    //set + increment
        console.log({ count })


        // If the user waits 5 minutes, Redis deletes the key → attempts reset. => This enforces "5 consecutive attempts within 5 minutes" (key first has no expiration so it is saved what if 5 times not consecutive the 5th was alone but banned)
        if (count === 1) {
            await expire({ key: attempstKey, ttl: 300 })
        }

        // ** If you reset when count === 5 => Then the attacker can immediately try again. => So the ban disappears immediately, which defeats the purpose.
        if (count >= 5) {
            return BadRequestException({
                message: "Too many failed attempts. Account locked for 5 minutes"
            })
        }

        return BadRequestException({
            message: `Invalid password. Attempt ${count}/5`
        })
    }

    // success login -> reset counter
    await deleteKeys([attempstKey])

    if (user.twoFactorEnabled) {
        const otp = await createOtp()

        await set({
            key: `2FA::LOGIN::${user.email}`,
            value: await generateHash({ plaintext: `${otp}` }),
            ttl: 300
        })
        await sendEmail({
            to: user.email,
            subject: "Login verification",
            html: `<h1>OTP: ${otp}</h1>`
        })

        return { message: "OTP sent to your email" }
    }
    const credentials = await createLoginCredentials(user, issuer)
    return credentials
}


export const signupWithGmail = async ({ idToken }, issuer) => {
    const client = new OAuth2Client();
    const ticket = await client.verifyIdToken({
        idToken,
        audience: CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload?.email_verified) {
        return BadRequestException({ message: "Google account verification failed" })
    }

    // As any signup need to check if this user already exists
    const userExists = await dbService.findOne({
        model: UserModel,
        filter: {
            email: payload.email
        }
    })
    // 3 options =>
    // 1- Email already exists (provider: system) => throw error
    // 2- Email already exists (provider: google) => redirect to login with gmail (return tokens)
    // 3- Email not exist => signup with google
    if (userExists) {
        if (userExists.provider == providerEnum.System) {
            return ConflictException({ message: "Account already Exists with different provider" })
        }


        const result = await loginWithGmail({ idToken }, issuer)
        return { result, status: 200 }
    }

    // create user
    const user = await dbService.createOne({
        model: UserModel,
        data: {
            username: payload.name,
            email: payload.email,
            provider: providerEnum.Google,
            profilePicture: payload.picture,
            confirmEmail: new Date()
        }
    })
    console.log({ user })

    const credentials = await createLoginCredentials(user, issuer)
    console.log({ credentials })
    return { result: credentials }
}


export const loginWithGmail = async ({ idToken }, issuer) => {
    console.log({ idToken })
    const client = new OAuth2Client();
    const ticket = await client.verifyIdToken({
        idToken,
        audience: CLIENT_ID,
    });
    const payload = ticket.getPayload();
    console.log({ payload })

    if (!payload?.email_verified) {
        return BadRequestException({ message: "Google account verification failed" })
    }

    const user = await dbService.findOne({
        model: UserModel,
        filter: {
            email: payload.email,
            provider: providerEnum.Google
        }
    })

    if (!user) {
        return NotFoundException({ message: "Account not Exists or exists with different provider" })
    }

    console.log({ user })

    const credentials = await createLoginCredentials(user, issuer)
    console.log({ credentials })
    return credentials
}


///////////////////////////////////////////////////////////TWO STEP VERIFICATION////////////////////////////////////////
export const enableTwoFactor = async (user) => {
    const otp = await createOtp()
    const FAKey = `2FA::ENABLE::${user._id}`

    await set({
        key: FAKey,
        value: await generateHash({ plaintext: `${otp}` }),
        ttl: 300
    })

    await sendEmail({
        to: user.email,
        subject: "Enable Two Factor Verification",
        html: `<h1>Your OTP: ${otp}</h1>`
    })
    return;
}

export const confirmTwoFactor = async (user, inputs) => {
    const { otp } = inputs
    const FAKey = `2FA::ENABLE::${user._id}`
    console.log({ FAKey, otp })

    const hashedOtp = await get(FAKey)
    console.log({ hashedOtp })

    if (!hashedOtp) {
        return BadRequestException({ message: "OTP expired" })
    }

    const match = await compareHash({
        plaintext: otp,
        cipherText: hashedOtp
    })

    if (!match) {
        return BadRequestException({ message: "Invalid OTP" })
    }

    user.twoFactorEnabled = true
    await user.save()
    return;
}

export const verifyTwoFactorLogin = async (inputs, issuer) => {
    const { email, otp } = inputs
    const key = `2FA::LOGIN::${email}`

    const hashedOtp = await get(key)
    if (!hashedOtp) {
        return BadRequestException({ message: "OTP expired" })
    }

    const match = await compareHash({
        plaintext: otp,
        cipherText: hashedOtp
    })
    if (!match) {
        return BadRequestException({ message: "Invalid OTP" })
    }

    const user = await dbService.findOne({
        model: UserModel,
        filter: { email }
    })

    // delete OTP so it cannot be reused
    await deleteKeys([key])
    const credentials = await createLoginCredentials(user, issuer)
    return credentials
}



// Reset Password Using a One-Time Access Link
// Flow => User requests password reset (forgot password) -> System sends a link containing a token 
// -> Token must be usable only once ->Token must expire

// POST /auth/forgot-password
//         │
// generate reset token
//         │
// store token in Redis (TTL)
//         │
// send reset link via email
//         │
// user clicks link
//         │
// PATCH /auth/reset-password
//         │
// verify token
//         │
// update password
//         │
// delete token (one-time)

export const forgotPassword = async ({ email }) => {
    const user = await dbService.findOne({
        model: UserModel,
        filter: { email }
    })

    if (!user) {
        return NotFoundException({ message: "Account not found" })
    }

    // why token this way not jwt => Truly one-time -- Can be revoked instantly -- Easy to delete after use -- Server controls validity
    // generates 32 random bytes => Hexadecimal uses 2 characters per byte => 64-char token
    const token = crypto.randomBytes(32).toString("hex")

    // token in key itself => Because it allows: token → direct Redis lookup
    const key = `RESET_PASS::${token}`
    await set({
        key,
        value: user._id.toString(),
        ttl: 600     // 10 minutes
    })

    const resetLink = `${FRONTEND_URL}/reset-password/${token}`

    await sendEmail({
        to: email,
        subject: "Reset Password",
        html: `Click here to reset password <br> <a href="${resetLink}" target="_blank">Reset Password</a>`
    })

    return {
        message: "Password reset link sent to your email"
    }
}


// Reset Password Endpoint
// User clicks link → sends token → backend verifies token → resets password → deletes Redis key (one-time use).
// token in URL is more common for reset links

export const resetPassword = async (token, password) => {

    const key = `RESET_PASS::${token}`

    const userId = await get(key)
    if (!userId) {
        return BadRequestException({ message: "Invalid or expired reset link" })
    }

    const user = await dbService.findById({
        model: UserModel,
        id: userId
    })
    if (!user) {
        return NotFoundException({ message: "User not found" })
    }

    user.password = await generateHash({ plaintext: password })
    user.changeCredentialsTime = new Date()

    await user.save()

    // delete token -> one time access link
    await deleteKeys([key])

    return;
}



export const updatePassword = async (user, inputs) => {
    const { currentPassword, newPassword } = inputs

    // Verify current password
    const isMatch = await compareHash({ plaintext: currentPassword, cipherText: user.password })
    if (!isMatch) {
        return BadRequestException({ message: "Current password is incorrect" })
    }

    // Update to new password
    user.password = await generateHash({ plaintext: newPassword })
    user.changeCredentialsTime = new Date()
    await user.save()
    return;
}