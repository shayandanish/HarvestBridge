/**
 * Client-side image compression utility.
 * Reduces file size by resizing and compressing using the Canvas API.
 */

/**
 * Compress an image file.
 * @param {File} file - The original image file from an input[type="file"].
 * @param {Object} options - { maxWidth, maxHeight, quality, mimeType }
 * @returns {Promise<File>} - A new File object (compressed).
 */
export const compressImage = async (file, options = {}) => {
    const {
        maxWidth = 1600,
        maxHeight = 1600,
        quality = 0.8,
        mimeType = 'image/jpeg'
    } = options;

    // Skip if not an image
    if (!file.type.startsWith('image/')) return file;

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                // Calculate new dimensions while maintaining aspect ratio
                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error('Canvas toBlob failed'));
                            return;
                        }
                        // Create a new file from the blob
                        const compressedFile = new File([blob], file.name, {
                            type: mimeType,
                            lastModified: Date.now(),
                        });
                        
                        // If compressed version is somehow larger, return original
                        if (compressedFile.size > file.size) {
                            resolve(file);
                        } else {
                            resolve(compressedFile);
                        }
                    },
                    mimeType,
                    quality
                );
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
};
