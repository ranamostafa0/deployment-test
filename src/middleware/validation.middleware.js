import { BadRequestException } from "../common/utils/response/error.response.js"

export const validation = (schema) => {
    return (req, res, next) => {
        const keys = Object.keys(schema) || []
        const errors = []
        for (const key of keys) {
            const validationResult = schema[key].validate(req[key], { abortEarly: false })
            if (validationResult.error) {
                errors.push({
                    key, details: validationResult.error.details?.map(ele => {
                        return { message: ele.message, path: ele.path }
                    })
                })
            }
        }
        if (errors.length) {
            return BadRequestException({ message: "Validation Error ", extra: { errors } })
        }
        next()
    }
}