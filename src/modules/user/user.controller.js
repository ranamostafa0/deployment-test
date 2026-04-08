import { Router } from "express";
import {  coverPicture, deleteProfile, logout, profile, profilePicture, removeProfilePicture, rotateToken, sharedProfile } from "./user.service.js";
import { successResponse } from "../../common/utils/response/success.response.js";
import { authentication, authorization } from "../../middleware/auth.middlware.js";
import { TokenTypeEnum } from "../../common/enum/security.enum.js";
import { roleEnum } from "../../common/enum/user.enum.js";
import { fieldValidation, upload } from "../../common/utils/multer/local.multer.js";
import { validation } from "../../middleware/validation.middleware.js";
import * as validators from "./user.validation.js"
import { cloudUpload } from "../../common/utils/multer/cloud.multer.js";
import { BadRequestException } from "../../common/utils/response/error.response.js";
import { decodeToken } from "../../common/utils/security/token.security.js";
const router = Router()

// if all are allowed just use authentication middleware
router.get("/", authorization([roleEnum.Admin, roleEnum.User]), async (req, res, next) => {
    const result = await profile(req.user)
    return successResponse({ res, data: result })
})

router.delete("/", authentication(), async (req, res, next) => {
    const result = await deleteProfile(req.user)
    return successResponse({ res, data: result })
})

router.get("/rotate-token", authentication(TokenTypeEnum.refresh), async (req, res, next) => {
    const result = await rotateToken(req.user, req.decoded, `${req.protocol}://${req.host}`)
    return successResponse({ res, data: result })
})

router.get('/:userId/shared-profile', async (req, res, next) => {
    if (req.headers.authorization) {
        const { user, decoded } = await decodeToken({ token: req.headers?.authorization, tokenType: TokenTypeEnum.access })
        req.user = user
        req.decoded = decoded
    }
    return next()
},
    validation(validators.shareProfile), async (req, res, next) => {
        const result = await sharedProfile(req.params.userId, req.user)
        return successResponse({ res, data: result })
    })

// router.patch('/profile-picture', authentication(), cloudUpload([...fieldValidation.image], 10).single("attachment"),
//     validation(validators.profilePicture)
//     , async (req, res, next) => {
//         const account = await profilePicture(req.file, req.user)
//         return successResponse({ res, data: { account } })
//     })

// router.patch('/cover-picture', authentication(), cloudUpload([...fieldValidation.image], 10).array("coverPicture", 2),
//     validation(validators.coverPicture)
//     , async (req, res, next) => {
//         const account = await coverPicture(req.files, req.user)
//         return successResponse({ res, data: { account } })
//     })

router.patch('/profile-picture', authentication(), upload("user/image", [...fieldValidation.image], 10).single("attachment"),
    validation(validators.profilePicture)
    , async (req, res, next) => {
        console.log({ file: req.file })
        const account = await profilePicture(req.file, req.user)
        return successResponse({ res, data: { account } })
    })

router.delete('/profile-picture', authentication(), async (req, res, next) => {
    const account = await removeProfilePicture(req.user);
    return successResponse({ res, message: "Profile picture removed", data: { account } });
})

router.patch('/cover-picture', authentication(), upload("user/cover", [...fieldValidation.image], 10).array("coverPicture", 2),
    validation(validators.coverPicture)
    , async (req, res, next) => {
        const account = await coverPicture(req.files, req.user)
        return successResponse({ res, data: { account } })
    })


router.post('/logout', authentication(), async (req, res, next) => {
    const status = await logout(req.body, req.user, req.decoded)
    return successResponse({ res, status })

})


export default router