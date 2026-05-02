const prisma = require('../config/database');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const { uploadToStorage, deleteFromStorage } = require('../config/storage');

/**
 * Get user profile with role-based data
 * @route GET /api/v1/profile
 */
const getProfile = async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: {
                profile: true,
                farmer: true,
                landowner: true,
            },
        });

        if (!user) {
            return errorResponse(res, 404, 'User not found');
        }

        // Remove sensitive fields
        const { passwordHash, emailVerificationToken, emailVerificationExpires, passwordResetToken, passwordResetExpires, ...userWithoutSensitiveData } = user;

        return successResponse(res, 200, 'Profile retrieved successfully', userWithoutSensitiveData);
    } catch (error) {
        next(error);
    }
};

/**
 * Update user profile
 * @route PUT /api/v1/profile
 */
const updateProfile = async (req, res, next) => {
    try {
        const {
            addressLine1,
            addressLine2,
            city,
            state,
            country,
            postalCode,
            dateOfBirth,
            bio,
        } = req.body;

        // Check if profile exists
        const existingProfile = await prisma.userProfile.findUnique({
            where: { userId: req.user.id },
        });

        let profile;
        if (existingProfile) {
            // Update existing profile
            profile = await prisma.userProfile.update({
                where: { userId: req.user.id },
                data: {
                    ...(addressLine1 !== undefined && { addressLine1 }),
                    ...(addressLine2 !== undefined && { addressLine2 }),
                    ...(city && { city }),
                    ...(state && { state }),
                    ...(country && { country }),
                    ...(postalCode && { postalCode }),
                    ...(dateOfBirth && { dateOfBirth: new Date(dateOfBirth) }),
                    ...(bio !== undefined && { bio }),
                },
            });
        } else {
            // Create new profile
            profile = await prisma.userProfile.create({
                data: {
                    userId: req.user.id,
                    addressLine1,
                    addressLine2,
                    city,
                    state,
                    country,
                    postalCode,
                    dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
                    bio,
                },
            });
        }

        return successResponse(res, 200, 'Profile updated successfully', profile);
    } catch (error) {
        next(error);
    }
};

/**
 * Upload profile photo
 * @route POST /api/v1/profile/photo
 */
const uploadProfilePhoto = async (req, res, next) => {
    try {
        if (!req.file) {
            return errorResponse(res, 400, 'No file uploaded');
        }

        // Upload to storage
        const photoUrl = await uploadToStorage(req.file, 'profiles');

        // Delete old photo if exists
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { profilePhotoUrl: true },
        });

        if (user.profilePhotoUrl) {
            try {
                await deleteFromStorage(user.profilePhotoUrl);
            } catch (deleteError) {
                console.error('Failed to delete old photo:', deleteError);
            }
        }

        // Update user
        const updatedUser = await prisma.user.update({
            where: { id: req.user.id },
            data: { profilePhotoUrl: photoUrl },
            select: {
                id: true,
                email: true,
                fullName: true,
                profilePhotoUrl: true,
            },
        });

        return successResponse(res, 200, 'Profile photo uploaded successfully', updatedUser);
    } catch (error) {
        next(error);
    }
};

/**
 * Upload KYC document
 * @route POST /api/v1/profile/kyc
 */
const uploadKYCDocument = async (req, res, next) => {
    try {
        if (!req.file) {
            return errorResponse(res, 400, 'No file uploaded');
        }

        // Upload to storage
        const documentUrl = await uploadToStorage(req.file, 'kyc');

        // Update or create profile
        const existingProfile = await prisma.userProfile.findUnique({
            where: { userId: req.user.id },
        });

        let profile;
        if (existingProfile) {
            // Delete old document if exists
            if (existingProfile.kycDocumentUrl) {
                try {
                    await deleteFromStorage(existingProfile.kycDocumentUrl);
                } catch (deleteError) {
                    console.error('Failed to delete old KYC document:', deleteError);
                }
            }

            profile = await prisma.userProfile.update({
                where: { userId: req.user.id },
                data: {
                    kycDocumentUrl: documentUrl,
                    kycVerified: false, // Reset verification status
                },
            });
        } else {
            profile = await prisma.userProfile.create({
                data: {
                    userId: req.user.id,
                    kycDocumentUrl: documentUrl,
                    kycVerified: false,
                },
            });
        }

        return successResponse(res, 200, 'KYC document uploaded successfully. Pending admin verification.', profile);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getProfile,
    updateProfile,
    uploadProfilePhoto,
    uploadKYCDocument,
};
