import multer from 'multer'

export const fieldValidation = {
    image: ['image/jpeg', 'image/png', 'image/jpg', 'image/pjpeg'],
    video: ['video/mp4']
}
export const cloudUpload = (validation = [], size = 5) => {


    const storage = multer.diskStorage({

    })

    const fileFilter = function (req, file, cb) {

        if (!validation.includes(file.mimetype)) {
            const err = new Error(`Invalid File Format this endpoint only accept ${validation}`);
            err.status = 400;
            return cb(err, false);
        }
        cb(null, true);

    }
    return multer({ fileFilter, storage, limits: { fileSize: size * 1024 * 1024 } })
}