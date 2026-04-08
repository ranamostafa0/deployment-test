import joi from "joi"
import { fieldValidation } from "../../common/utils/multer/local.multer.js"
import { generalValidationFields } from "../../common/utils/validation/validation.js"

export const shareProfile = {
    params: joi.object().keys({
        userId: generalValidationFields.id.required()

    }).required()
}


export const profilePicture = {
    file: generalValidationFields.file(fieldValidation.image).required()
}


export const coverPicture = {
    files: joi.array().items(generalValidationFields.file(fieldValidation.image).required()).min(1).max(2).required()
}

