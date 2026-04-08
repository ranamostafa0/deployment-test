import { Router } from 'express'
import { confirmEmail, confirmTwoFactor, enableTwoFactor, forgotPassword, login, loginWithGmail, resenConfirmEmail, resetPassword, signup, signupWithGmail, updatePassword, verifyTwoFactorLogin } from './auth.service.js';
import { successResponse } from '../../common/utils/response/success.response.js';
import { validation } from '../../middleware/validation.middleware.js';
import * as validators from "./auth.validation.js"
import { authentication } from '../../middleware/auth.middlware.js';
const router = Router();

router.post("/signup", validation(validators.signupSchema), async (req, res, next) => {
    const result = await signup(req.body)
    return successResponse({ res, status: 201, data: result })
})

router.patch("/verify-account", validation(validators.confirmEmailSchema), async (req, res, next) => {
    const result = await confirmEmail(req.body)
    return successResponse({ res, status: 201, message: "Account verified Successfully" })
})

router.patch("/resend-confirm-email", validation(validators.resendConfirmEmailSchema), async (req, res, next) => {
    const result = await resenConfirmEmail(req.body)
    return successResponse({ res, status: 201, message: "Confirmation Email resend" })
})

router.post("/login", validation(validators.loginSchema), async (req, res, next) => {
    const result = await login(req.body, `${req.protocol}://${req.host}`)
    return successResponse({ res, data: result })
})


router.post("/signup/gmail", async (req, res, next) => {
    console.log(req.body)
    const { result, status = 201 } = await signupWithGmail(req.body, `${req.protocol}://${req.host}`)
    return successResponse({ res, status, data: { result } })
})

router.post("/login/gmail", async (req, res, next) => {
    const result = await loginWithGmail(req.body, `${req.protocol}://${req.host}`)
    return successResponse({ res, status: 200, data: { result } })
})


/////////////////////////////////////////////////////////////////////////////////////////////////
// enable 2fa
router.patch("/enable-2fa", authentication(), async (req, res, next) => {
    const result = await enableTwoFactor(req.user)
    return successResponse({ res, message: "otp sent to your email, verify to enable 2FA" })
})

router.patch("/confirm-2fa", authentication(), async (req, res, next) => {
    const result = await confirmTwoFactor(req.user, req.body)
    return successResponse({ res, message: "2FA enabled successfully" })
})

router.post("/verify-2fa-login", validation(validators.confirmEmailSchema), async (req, res, next) => {
    const result = await verifyTwoFactorLogin(req.body, `${req.protocol}://${req.host}`)
    return successResponse({ res, data: result })
})



// Reset Password Using a One-Time Access Link
router.post("/forgot-password", validation(validators.forgotPasswordchema), async (req, res, next) => {
    const result = await forgotPassword(req.body)
    return successResponse({ res, data: result })
})

// why link not working because it is patch method only get works & /auth after
router.patch("/reset-password/:token", validation(validators.resetPasswordSchema), async (req, res, next) => {
    const result = await resetPassword(req.params.token, req.body.password)
    return successResponse({ res, message: "password reset successfully" })
})


// Update Password (Authenticated User)
router.patch("/update-password", authentication(), validation(validators.updatePasswordSchema), async (req, res, next) => {
    const result = await updatePassword(req.user, req.body)
    return successResponse({ res, message: "Password updated successfully" })
})

export default router