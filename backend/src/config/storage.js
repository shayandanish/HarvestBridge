const AWS = require('aws-sdk');
const cloudinary = require('cloudinary').v2;
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

const USE_S3 = process.env.USE_S3 === 'true';
const USE_CLOUDINARY = process.env.USE_CLOUDINARY === 'true';
const UPLOAD_PATH = process.env.UPLOAD_PATH || './uploads';

// Configure AWS S3
if (USE_S3) {
    AWS.config.update({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION || 'us-east-1',
    });
}

// Configure Cloudinary
if (USE_CLOUDINARY) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
}

const s3 = USE_S3 ? new AWS.S3() : null;

/**
 * Upload file to storage (Cloudinary, S3, or local)
 * @param {Buffer} fileBuffer - File buffer
 * @param {String} fileName - File name
 * @param {String} folder - Folder path
 * @returns {String} File URL
 */
const uploadFile = async (fileBuffer, fileName, folder = 'general') => {
    if (USE_CLOUDINARY) {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: `agro_investment/${folder}`,
                    public_id: path.parse(fileName).name.replace(/\s+/g, '-'),
                    resource_type: 'auto'
                },
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result.secure_url);
                }
            );
            uploadStream.end(fileBuffer);
        });
    } else if (USE_S3) {
        const params = {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: `${folder}/${fileName}`,
            Body: fileBuffer,
            ACL: 'public-read',
        };

        const result = await s3.upload(params).promise();
        return result.Location;
    } else {
        // Local storage
        const uploadDir = path.join(UPLOAD_PATH, folder);
        await fs.mkdir(uploadDir, { recursive: true });

        const filePath = path.join(uploadDir, fileName);
        await fs.writeFile(filePath, fileBuffer);

        return `/uploads/${folder}/${fileName}`;
    }
};

/**
 * Process and upload image with resizing
 * @param {Object} file - Multer file object
 * @param {String} folder - Folder path
 * @param {Number} width - Resized width (optional)
 * @returns {String} File URL
 */
const processAndUploadImage = async (file, folder = 'general', width = 1200) => {
    if (!file) return null;

    let buffer = file.buffer;
    
    // Local processing with sharp if not using Cloudinary
    // If using Cloudinary, we could skip this as Cloudinary handles resizing,
    // but we keep it for consistency across providers.
    if (file.mimetype.startsWith('image/')) {
        try {
            buffer = await sharp(file.buffer)
                .resize(width, null, { withoutEnlargement: true })
                .toBuffer();
        } catch (error) {
            console.error('Error resizing image:', error);
            // Fallback to original buffer
            buffer = file.buffer;
        }
    }

    const fileName = `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
    return uploadFile(buffer, fileName, folder);
};

/**
 * Delete file from storage
 */
const deleteFile = async (fileUrl) => {
    if (!fileUrl) return;

    if (USE_CLOUDINARY) {
        // Handle Cloudinary delete
        const parts = fileUrl.split('/');
        const fileNameWithExt = parts.pop();
        const publicId = fileNameWithExt.split('.')[0];
        const combinedId = `agro_investment/${fileUrl.split('/agro_investment/')[1].split('.')[0]}`;
        
        await cloudinary.uploader.destroy(combinedId);
    } else if (USE_S3) {
        const key = fileUrl.split('.com/')[1];
        const params = {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: key,
        };

        await s3.deleteObject(params).promise();
    } else {
        // Local storage
        const filePath = path.join(process.cwd(), fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`);
        if (filePath.includes('uploads')) {
            try {
                await fs.unlink(filePath);
            } catch (error) {
                // Ignore errors
            }
        }
    }
};

const getFileUrl = (filePath) => {
    if (USE_S3 || USE_CLOUDINARY || !filePath) {
        return filePath;
    } else {
        return `${process.env.BASE_URL || 'http://localhost:5000'}${filePath.startsWith('/') ? filePath : `/${filePath}`}`;
    }
};

const uploadToStorage = async (file, folder) => {
    if (!file) return null;
    return uploadFile(file.buffer, `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`, folder);
};

const deleteFromStorage = deleteFile;

module.exports = {
    uploadFile,
    processAndUploadImage,
    uploadToStorage,
    deleteFile,
    deleteFromStorage,
    getFileUrl,
    USE_S3,
    USE_CLOUDINARY,
};
