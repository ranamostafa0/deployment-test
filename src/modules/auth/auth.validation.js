import joi from 'joi'
import { generalValidationFields } from '../../common/utils/validation/validation.js'

export const loginSchema = {
    body: joi.object().keys({
        email: generalValidationFields.email.required(),
        password: generalValidationFields.password.required(),
    }).required()
}

export const signupSchema = {
    body: loginSchema.body.append({
        username: generalValidationFields.username.required(),
        confirmPassword: generalValidationFields.confirmPassword('password').required(),
        phone: generalValidationFields.phone.required(),
        gender: joi.number()
    }).required()
}

export const confirmEmailSchema = {
    body: joi.object().keys({
        email: generalValidationFields.email.required(),
        otp: generalValidationFields.otp.required()
    }).required()
}

export const resendConfirmEmailSchema = {
    body: joi.object().keys({
        email: generalValidationFields.email.required(),
    }).required()
}


export const googleSignupSchema = {
    body: joi.object().keys({
        idToken: joi.string().required()
    }).required()
}


export const googleLoginSchema = {
    body: joi.object().keys({
        idToken: joi.string().required()
    }).required()
};


// ////////////////////////////////////////////////////
export const forgotPasswordchema = {
    body: joi.object().keys({
        email: generalValidationFields.email.required(),
    }).required()
}

export const resetPasswordSchema = {
    params: joi.object().keys({
        token: joi.string().length(64).hex().required()
    }).required(),

    body: joi.object().keys({
        password: generalValidationFields.password.required(),
        confirmPassword: generalValidationFields.confirmPassword('password').required(),
    }).required()
}


export const updatePasswordSchema = {
    body: joi.object({
        currentPassword: generalValidationFields.password.required(),
        newPassword: generalValidationFields.password.required(),
        confirmPassword: generalValidationFields.confirmPassword('newPassword').required()
    }).required()
}