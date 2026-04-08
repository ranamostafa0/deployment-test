import { v2 as cloudinary } from 'cloudinary'
import { API_KEY, API_SECRET, APPLICATION_NAME, CLOUD_NAME } from '../../../../config/config.service.js';

cloudinary.config({
    cloud_name: CLOUD_NAME,
    api_key: API_KEY,
    api_secret: API_SECRET
});

export const uploadFile = async ({ file, folder }) => {
    return await cloudinary.uploader.upload(file.path, {
        folder: `${APPLICATION_NAME}/${folder}`
    });
}

export const deleteFile = async (public_id) => {
    return await cloudinary.uploader.destroy(public_id)
}

export const uploadFiles = async ({ files, folder }) => {
    let attachments = []
    for (const file of files) {
        const { secure_url, public_id } = await cloudinary.uploader.upload(file.path, {
            folder: `${APPLICATION_NAME}/${folder}`
        });
        attachments.push({ secure_url, public_id })
    }
    return attachments

}

export const deleteFilesByPublicIds = async (public_ids) => {
    return await cloudinary.api.delete_resources(public_ids)
}

export const deleteFolderAssets = async (folder) => {
    return await cloudinary.api.delete_resources_by_prefix(folder)
}

export const deleteFolder = async (folder) => {
    return await cloudinary.api.delete_folder(folder)
}




export default cloudinary