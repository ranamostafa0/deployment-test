import { resolve } from 'path'
import { BadRequestException, ConflictException, NotFoundException } from '../../common/utils/response/error.response.js'
import { generateDecrypt } from '../../common/utils/security/encrypt.security.js'
import { createLoginCredentials } from '../../common/utils/security/token.security.js'
import { deleteOne, findOne, updateOne } from '../../DB/db.repository.js'
import { UserModel } from '../../DB/model/user.model.js'
import fs from "fs"
import cloudinary, { deleteFile, deleteFilesByPublicIds, deleteFolder, deleteFolderAssets, uploadFile, uploadFiles } from '../../common/utils/multer/cloudinary.js'
import { ACCESS_EXPIRES_IN, APPLICATION_NAME, REFRESH_EXPIRES_IN } from '../../../config/config.service.js'
import { baseRevokeTokenKey, deleteKeys, get, keys, revokeTokenKey, set } from '../../common/services/redis.service.js'
import { LogoutEnum } from '../../common/enum/security.enum.js'
import { roleEnum } from '../../common/enum/user.enum.js'
import { sendEmail } from '../../common/utils/email/send.email.js'
import { createOtp } from '../../common/utils/security/otp.security.js'
import { compareHash, generateHash } from '../../common/utils/security/hash.security.js'


export const profile = async (user) => {
    if (user.phone) {
        user.phone = await generateDecrypt(user.phone)
    }
    if (user.role !== roleEnum.Admin) {
        user.profileVisits = undefined
    }
    return user
}

export const deleteProfile = async (user) => {
    const folder = `${APPLICATION_NAME}/users/${user._id}`
    await deleteFolderAssets(folder)
    await deleteFolder(folder)
    return await deleteOne({
        model: UserModel,
        filter: { _id: user._id }
    })
}

// export const rotateToken = async (user, issuer) => {
//     return await createLoginCredentials(user, issuer)
// }


export const sharedProfile = async (userId, loggedInUser) => {

    const user = await findOne({
        model: UserModel,
        filter: { _id: userId },
        select: "firstName lastName username email phone profilePicture profileVisits"

    })
    if (!user) {
        return NotFoundException({ message: "User not found" })
    }
    if (user.phone) {
        user.phone = await generateDecrypt(user.phone)
    }

    await updateOne({
        model: UserModel,
        filter: {
            _id: userId,
        },
        update: {
            $inc: { profileVisits: 1 }
        }
    })

    if (!loggedInUser || loggedInUser.role !== roleEnum.Admin) {
        user.profileVisits = undefined
    }

    return user      //user returned with the last visit views becuse we return user before increment --- we can save updated user & return it
}


// Application-name/users/userId
// export const profilePicture = async (file, user) => {
//     if (user.profilePicture?.public_id) {
//         await deleteFile(user.profilePicture.public_id)
//     }
//     const { secure_url, public_id } = await uploadFile({ file, folder: `users/${user._id}` })
//     user.profilePicture = { secure_url, public_id }
//     await user.save()
//     return user
// }


// export const coverPicture = async (files, user) => {
//     if (user.coverPicture?.length) {
//         await deleteFilesByPublicIds(user.coverPicture.map((picture) => picture.public_id))   //[public_ids]
//     }
//     user.coverPicture = await uploadFiles({ files, folder: `users/${user._id}/coverPictures` })
//     await user.save()
//     return user
// }


// EROFS: read - only file system
//  — Vercel's serverless functions run in a read-only filesystem. You cannot write files to disk at all. Only /tmp is writable,
//   but it's limited to 50MB and is wiped between invocations.

export const profilePicture = async (file, user) => {
    // if (user.profilePicture) {
    //     const oldPath = resolve(user.profilePicture);
    //     if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    // }

    // move old image to gallery
    if (user.profilePicture) {
        user.gallery.push(user.profilePicture);
    }

    // save the new one as current profile picture
    user.profilePicture = file.finalPath
    await user.save();
    return user;
}

export const removeProfilePicture = async (user) => {

    if (!user.profilePicture)
        throw NotFoundException({ message: "Profile picture not found" });

    const oldPath = resolve(user.profilePicture);
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);

    user.profilePicture = null;
    await user.save();

    return user;
}

// export const coverPicture = async (files, user) => {
//     if (files.length) {
//         user.coverPicture = files.map(file => file.finalPath)
//     }
//     await user.save()
//     return user
// }

export const coverPicture = async (files, user) => {
    console.log({ files })
    if (!files || !files.length)
        throw BadRequestException({ message: "Files are required" });

    const existingCovers = user.coverPicture?.length || 0;
    const newCovers = files.length;
    console.log({ existingCovers })
    console.log({ newCovers })


    const total = existingCovers + newCovers;

    if (total !== 2) {
        throw BadRequestException({ message: "Total cover pictures must be exactly 2" });
    }


    const newPaths = files.map(file => file.finalPath);

    user.coverPicture = [
        ...(user.coverPicture || []),
        ...newPaths
    ];

    await user.save();
    return user;
}

export const createRevokeToken = async ({ userId, jti, ttl }) => {
    return await set({
        key: revokeTokenKey({ userId, jti }),
        value: jti,
        ttl
    })
}

export const rotateToken = async (user, { iat, jti, subject }, issuer) => {
    if ((iat + ACCESS_EXPIRES_IN) * 1000 >= Date.now() + (30000)) {
        throw ConflictException({ message: "Current access token still valid" })
    }
    await createRevokeToken({ userId: subject, jti, ttl: iat + REFRESH_EXPIRES_IN })
    return await createLoginCredentials(user, issuer)
}

export const logout = async ({ flag }, user, { jti, iat, sub }) => {
    let status = 200
    switch (flag) {
        case LogoutEnum.All:
            user.changeCredentialsTime = new Date(Date.now())
            await user.save()

            console.log({ keys: await keys(baseRevokeTokenKey(sub)) })
            await deleteKeys(await keys(baseRevokeTokenKey(sub)))
            break;

        default:
            await createRevokeToken({ userId: sub, jti, ttl: iat + REFRESH_EXPIRES_IN })
            status = 201
            break;
    }
    return status
}


