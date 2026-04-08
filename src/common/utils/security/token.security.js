import jwt from 'jsonwebtoken'
import { ACCESS_EXPIRES_IN, REFRESH_EXPIRES_IN, SYSTEM_ACCESS_TOKEN_SIGNATURE, SYSTEM_REFRESH_TOKEN_SIGNATURE, USER_ACCESS_TOKEN_SIGNATURE, USER_REFRESH_TOKEN_SIGNATURE } from '../../../../config/config.service.js'
import { AudienceEnum, TokenTypeEnum } from '../../enum/security.enum.js'
import { roleEnum } from '../../enum/user.enum.js'
import { UserModel } from '../../../DB/model/user.model.js'
import { BadRequestException, UnauthorizedException } from '../response/error.response.js'
import { findOne } from '../../../DB/db.repository.js'
import { randomUUID } from 'crypto'
import { get, revokeTokenKey } from '../../services/redis.service.js'

export const generateToken = async ({ payload = {}, secretKey = USER_ACCESS_TOKEN_SIGNATURE, options = {} }) => {
    return jwt.sign(payload, secretKey, options)
}

export const verifyToken = async ({ token, secretKey = USER_ACCESS_TOKEN_SIGNATURE } = {}) => {
    return jwt.verify(token, secretKey)
}
export const getTokenSignature = async (role) => {
    let accessSignature = undefined
    let refreshSignature = undefined
    let audience = AudienceEnum.User
    switch (role) {
        case roleEnum.Admin:
            accessSignature = SYSTEM_ACCESS_TOKEN_SIGNATURE
            refreshSignature = SYSTEM_REFRESH_TOKEN_SIGNATURE
            audience = AudienceEnum.System
            break;
        default:
            accessSignature = USER_ACCESS_TOKEN_SIGNATURE
            refreshSignature = USER_REFRESH_TOKEN_SIGNATURE
            audience = AudienceEnum.User
            break;
    }
    return { accessSignature, refreshSignature, audience }

}

export const getTokenSignatureLevel = async (audienceType) => {
    let signatureLevel = roleEnum.User
    switch (audienceType) {
        case AudienceEnum.System:
            signatureLevel = roleEnum.Admin
            break;
        default:
            signatureLevel = roleEnum.User
            break;
    }
    return signatureLevel

}

export const createLoginCredentials = async (user, issuer) => {
    const { accessSignature, refreshSignature, audience } = await getTokenSignature(user.role)
    const jwtId = randomUUID()

    const access_token = await generateToken({
        payload: { sub: user._id.toString() },
        secretKey: accessSignature,
        options: {
            issuer,
            audience: [TokenTypeEnum.access, audience],
            expiresIn: ACCESS_EXPIRES_IN,
            jwtid: jwtId
        }

    })
    const refresh_token = await generateToken({
        payload: { sub: user._id.toString() },
        secretKey: refreshSignature,
        options: {
            issuer,
            audience: [TokenTypeEnum.refresh, audience],
            expiresIn: REFRESH_EXPIRES_IN,
            jwtid: jwtId
        }

    })
    return { access_token, refresh_token }
}


export const decodeToken = async ({ token, tokenType = TokenTypeEnum.access } = {}) => {
    const decoded = jwt.decode(token)
    console.log({ decoded })
    if (!decoded?.aud?.length) {
        return BadRequestException({ message: "Fail to decode this token aud is required" })
    }
    if (decoded.jti && await get(revokeTokenKey({ userId: decoded.sub, jti: decoded.jti }))) {
        throw UnauthorizedException({ message: "Invalid Login Session" })
    }
    const [decodeTokenType, audienceType] = decoded.aud
    if (decodeTokenType !== tokenType) {
        return BadRequestException({ message: `Invalid Token Type ${decodeTokenType}  cannot access api while expected token of ${tokenType}` })
    }
    const signatureLevel = await getTokenSignatureLevel(audienceType)
    console.log({ signatureLevel})

    const { accessSignature, refreshSignature } = await getTokenSignature(signatureLevel)
    console.log({ accessSignature, refreshSignature })


    const verifiedData = await verifyToken({
        token,
        secretKey: tokenType == TokenTypeEnum.refresh ? refreshSignature : accessSignature
    })
    console.log({ verifiedData })

    const user = await findOne({ model: UserModel, filter: { _id: verifiedData.sub } })
    console.log({ user })

    if (!user) {
        return UnauthorizedException({ message: "Not Register Account!" })
    }
    if (user.changeCredentialsTime && user.changeCredentialsTime?.getTime() > decoded.iat * 1000) {
        throw UnauthorizedException({ message: "Invalid Login Session" })
    }
    return { user, decoded }
}




