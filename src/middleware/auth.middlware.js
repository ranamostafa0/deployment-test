import { TokenTypeEnum } from "../common/enum/security.enum.js"
import { BadRequestException, ForbiddenException } from "../common/utils/response/error.response.js"
import { decodeToken } from "../common/utils/security/token.security.js"

export const authentication = (tokenType = TokenTypeEnum.access) => {
    return async (req, res, next) => {
        if (!req?.headers?.authorization) {
            return BadRequestException({ message: "Missing authorization key " })
        }
        const { user, decoded } = await decodeToken({ token: req.headers?.authorization, tokenType })
        req.user = user
        req.decoded = decoded
        return next()
    }
}

export const authorization = (accessRoles = [], tokenType = TokenTypeEnum.access) => {
    return async (req, res, next) => {
        if (!req?.headers?.authorization) {
            return BadRequestException({ message: "Missing authorization key " })
        }
        const { user, decoded } = await decodeToken({ token: req.headers?.authorization, tokenType })
        req.user = user
        req.decoded = decoded
        if (!accessRoles.includes(req.user.role)) {
            return ForbiddenException({ message: "Not allowed account" })
        }
        return next()
    }
}

