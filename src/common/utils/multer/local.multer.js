import multer from 'multer'
import { randomUUID } from 'node:crypto'
import { existsSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

export const fieldValidation = {
    image: ['image/jpeg', 'image/png', 'image/jpg', 'image/pjpeg'],
    video: ['video/mp4']
}
export const upload = (customPath = "general", validation = [], size = 5) => {


    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            let filePath = resolve(`upload/${customPath}`)
            if (!existsSync(filePath)) {
                mkdirSync(filePath, { recursive: true })
            }
            cb(null, filePath)
        },
        filename: function (req, file, cb) {
            console.log(file);
            const uniqueFileName = randomUUID() + '_' + file.originalname
            file.finalPath = `upload/${customPath}/${uniqueFileName}`
            cb(null, uniqueFileName)
        },

    })

    const fileFilter = function (req, file, cb) {

        if (!validation.includes(file.mimetype)) {
            const err = new Error(`Invalid File Format this endpoint only accept ${validation}`);
            err.status = 400;
            return cb(err, false);
        }
        cb(null, true);

    }
    return multer({ dest: './temp', fileFilter, storage, limits: { fileSize: size * 1024 * 1024 } })
}