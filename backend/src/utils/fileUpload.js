const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const crypto = require('crypto');
const { uploadFile } = require('../config/storage');

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024; // 5MB default

// Multer memory storage
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
    const allowedMimes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'application/pdf',
    ];

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and PDF files are allowed.'), false);
    }
};

// Multer upload configuration
const upload = multer({
    storage,
    limits: {
        fileSize: MAX_FILE_SIZE,
    },
    fileFilter,
});

/**
 * Process and upload image
 * @param {Buffer} fileBuffer - File buffer from multer
 * @param {String} originalName - Original file name
 * @param {String} folder - Upload folder
 * @param {Object} options - Processing options (width, height, quality)
 * @returns {String} Uploaded file URL
 */
const processAndUploadImage = async (fileBuffer, originalName, folder = 'general', options = {}) => {
    try {
        const {
            width = 1200,
            height = null,
            quality = 80,
            format = 'jpeg',
        } = options;

        // Generate unique filename
        const timestamp = Date.now();
        const randomString = crypto.randomBytes(8).toString('hex');
        const ext = format === 'jpeg' ? 'jpg' : format;
        const fileName = `${timestamp}-${randomString}.${ext}`;

        // Process image with sharp
        let sharpInstance = sharp(fileBuffer);

        if (width || height) {
            sharpInstance = sharpInstance.resize(width, height, {
                fit: 'inside',
                withoutEnlargement: true,
            });
        }

        const processedBuffer = await sharpInstance
            .toFormat(format, { quality })
            .toBuffer();

        // Upload to storage
        const fileUrl = await uploadFile(processedBuffer, fileName, folder);

        return fileUrl;
    } catch (error) {
        throw new Error(`Image processing failed: ${error.message}`);
    }
};

/**
 * Upload document (PDF, etc.)
 * @param {Buffer} fileBuffer - File buffer from multer
 * @param {String} originalName - Original file name
 * @param {String} folder - Upload folder
 * @returns {String} Uploaded file URL
 */
const uploadDocument = async (fileBuffer, originalName, folder = 'documents') => {
    try {
        // Generate unique filename
        const timestamp = Date.now();
        const randomString = crypto.randomBytes(8).toString('hex');
        const ext = path.extname(originalName);
        const fileName = `${timestamp}-${randomString}${ext}`;

        // Upload to storage
        const fileUrl = await uploadFile(fileBuffer, fileName, folder);

        return fileUrl;
    } catch (error) {
        throw new Error(`Document upload failed: ${error.message}`);
    }
};

/**
 * Upload multiple images
 * @param {Array} files - Array of file buffers from multer
 * @param {String} folder - Upload folder
 * @param {Object} options - Processing options
 * @returns {Array} Array of uploaded file URLs
 */
const uploadMultipleImages = async (files, folder = 'general', options = {}) => {
    const uploadPromises = files.map(file =>
        processAndUploadImage(file.buffer, file.originalname, folder, options)
    );

    return await Promise.all(uploadPromises);
};

/**
 * Middleware for uploading single file with custom allowed types
 * @param {String} fieldName - Form field name
 * @param {Array} allowedTypes - Array of allowed MIME types
 * @returns {Function} Multer middleware
 */
const uploadSingle = (fieldName, allowedTypes = []) => {
    const customFilter = (req, file, cb) => {
        if (allowedTypes.length === 0 || allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`), false);
        }
    };

    return multer({
        storage,
        limits: { fileSize: MAX_FILE_SIZE },
        fileFilter: customFilter,
    }).single(fieldName);
};

/**
 * Middleware for uploading multiple files with custom allowed types
 * @param {String} fieldName - Form field name
 * @param {Number} maxCount - Maximum number of files
 * @param {Array} allowedTypes - Array of allowed MIME types
 * @returns {Function} Multer middleware
 */
const uploadMultiple = (fieldName, maxCount = 10, allowedTypes = []) => {
    const customFilter = (req, file, cb) => {
        if (allowedTypes.length === 0 || allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`), false);
        }
    };

    return multer({
        storage,
        limits: { fileSize: MAX_FILE_SIZE },
        fileFilter: customFilter,
    }).array(fieldName, maxCount);
};

module.exports = {
    upload,
    uploadSingle,
    uploadMultiple,
    processAndUploadImage,
    uploadDocument,
    uploadMultipleImages,
};
