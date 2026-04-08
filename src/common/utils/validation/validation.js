import joi from 'joi'
import { Types } from 'mongoose'
// new regExp(/^[A-Z][a-z]{2,24}\s[A-Z][a-z]{2,24}$/)
export const generalValidationFields = {
    username: joi.string().pattern(/^[A-Z][a-z]{2,24}\s[A-Z][a-z]{2,24}$/).messages({
        "string.base": "Username must be a text value.",
        "string.empty": "Username cannot be empty.",
        "string.pattern.base":
            "Username must be in the format 'Firstname Lastname' and each name must start with a capital letter."
    }),

    email: joi.string().email({
        minDomainSegments: 2,
        maxDomainSegments: 3,
        tlds: { allow: ["com", "edu", "net"] }
    }).messages({
        "string.email": "Please enter a valid email address.",
        "string.empty": "Email cannot be empty.",
        "string.base": "Email must be a string."
    }),

    otp: joi.string().pattern(/^\d{6}$/).messages({
        "string.pattern.base": "OTP must be exactly 6 digits.",
        "string.empty": "OTP cannot be empty."
    }),

    password: joi.string().pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*\W).{8,25}$/).messages({
        "string.pattern.base":
            "Password must contain at least one uppercase letter, one lowercase letter, one number, one special character, and be 8–25 characters long.",
        "string.empty": "Password cannot be empty."
    }),

    confirmPassword: (matchedPath) => {
        return joi.string().valid(joi.ref(matchedPath)).messages({
            "any.only": "Confirm password must match the password.",
            "string.empty": "Confirm password cannot be empty."
        });
    },

    phone: joi.string().trim().pattern(/^(002|02|\+2)?01[0-25]\d{8}$/).messages({
        "string.pattern.base": "Phone number must be a valid Egyptian mobile number.",
        "string.empty": "Phone number cannot be empty."
    }),

    id: joi.string().custom((value, helper) => {
        return Types.ObjectId.isValid(value)
            ? true
            : helper.message("Invalid ObjectId format.");
    }),

    file: function (mimetype = []) {
        return joi.object().keys(
            {
                fieldname: joi.string(),
                originalname: joi.string(),
                encoding: joi.string(),
                mimetype: joi.string().valid(...mimetype),
                // finalPath: joi.string().required(),
                destination: joi.string(),
                filename: joi.string(),
                path: joi.string(),
                size: joi.number().positive()
            }
        )

    }

}




// pattern
// value (test the pattern)

// /regex/

// ==> /^$/

// ?  => zero or one
// + => one or more
// * => zero or more
//  . => matches any character

// lookahead => (?= .*condition)



// username  => first(25) last(25)
// otp => 6 digit
// password  => 8:25 [at least on lower - at least one upper case - at least digit - at least special character]
// phone (002| 02 | +2)

// // At least to digit in password => lookahead on the lookahead (?=(?:.*\d){2,})


// (?= ... ) => Positive lookahead → checks a condition without consuming characters


// Capturing group =>  ( ... )              =>   دي بتعمل تجميع للـ pattern وكمان بتخزن اللي اتعمله match.
// (cat|dog) =>  


// Non-capturing group => (?: ... )         => دي برضه بتعمل grouping للـ pattern - لكن مش بتخزن الماتش. - يعني بنستخدمها بس علشان ننظم الـ regex أو نكرر جزء منه.
// (?:cat|dog)


// ( ) → Group and capture the match (it stores what was matched).

// (?: ) → Group only for organizing or repeating the pattern, but it does NOT store the match.

// | Part        | Meaning                                                                  |
// | ----------- | ------------------------------------------------------------------------ |
// | `(?= ... )` | **Positive lookahead** → checks a condition without consuming characters |
// | `(?: ... )` | **Non-capturing group**                                                  |
// | `.*`        | Any characters (0 or more)                                               |
// | `\d`        | A **digit** (0–9)                                                        |
// | `{2,}`      | **At least 2 times**                                                     |
