import crypto from "node:crypto"
import { ENC_SECRET_KEY, IV_LENGTH } from "../../../../config/config.service.js";


// console.log(crypto.randomBytes(IV_LENGTH).toString("hex"))         //generate random 32-byte encrypt secret key

const algorithm = 'aes-256-cbc'

// const key = ENC_SECRET_KEY;



export const generateEncrypt = async (plainText) => {
    const iv = crypto.randomBytes(IV_LENGTH);     //Initialized vector for each plaintext -> 16 byte as buffer
    console.log({ iv })

    const cipherIv = crypto.createCipheriv(algorithm, ENC_SECRET_KEY, iv);     //create cipher vector 
    let encrypted = cipherIv.update(plainText, "utf8", "hex");   //empty string
    console.log({ iv, cipherIv, encrypted })

    encrypted += cipherIv.final("hex");                          //final encrpted cipher text => empty string + the cipheriv
    console.log({ finalEncryption: encrypted })

    return `${iv.toString("hex")}:${encrypted}`;                  //save both in db iv : encryption
};

export const generateDecrypt = async (cipherText) => {
    const [iv, encryptedData] = cipherText.split(":") || [];
    const ivBuffer = Buffer.from(iv, 'hex');
    const decipher = crypto.createDecipheriv(algorithm, ENC_SECRET_KEY, ivBuffer);
    let plainText = decipher.update(encryptedData, "hex", "utf8");
    plainText += decipher.final("utf8");
    return plainText;
};

// const algorithm = 'aes-256-cbc';
// const key = crypto.randomBytes(32);
// const iv = crypto.randomBytes(16);

// export const encrypt = (text) => {
//     const cipher = crypto.createCipheriv(algorithm, key, iv);
//     let encrypted = cipher.update(text, 'utf8', 'hex');
//     encrypted += cipher.final('hex');
//     return encrypted;
// };

// export const decrypt = (encrypted) => {
//     const decipher = crypto.createDecipheriv(algorithm, key, iv);
//     let decrypted = decipher.update(encrypted, 'hex', 'utf8');
//     decrypted += decipher.final('utf8');
//     return decrypted;
// };

// const message = "Hello World";
// const encrypted = encrypt(message);
// const decrypted = decrypt(encrypted);

// console.log({ encrypted, decrypted });



