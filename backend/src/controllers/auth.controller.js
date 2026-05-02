const bcrypt = require("bcryptjs");
const prisma = require("../config/database");
const { generateAccessToken, generateRefreshToken } = require("../config/jwt");
const {
  successResponse,
  errorResponse,
} = require("../utils/responseFormatter");
const { generateToken, blacklistToken } = require("../utils/tokenManager");
const {
  sendVerificationEmail,
  sendPasswordResetEmail,
} = require("../utils/emailService");

/**
 * Register new user
 * @route POST /api/v1/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { email, phone, password, fullName, role } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, ...(phone ? [{ phone }] : [])],
      },
    });

    if (existingUser) {
      return errorResponse(
        res,
        409,
        "User with this email or phone already exists",
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Generate email verification token
    const emailVerificationToken = generateToken();
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        phone,
        passwordHash,
        fullName,
        role,
        emailVerificationToken,
        emailVerificationExpires,
      },
      select: {
        id: true,
        email: true,
        phone: true,
        fullName: true,
        role: true,
        isVerified: true,
        createdAt: true,
      },
    });

    // Send verification email
    const verificationUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/verify-email?token=${emailVerificationToken}`;
    try {
      await sendVerificationEmail(email, fullName, verificationUrl);
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      // Continue registration even if email fails
    }

    // Generate tokens for immediate login after registration
    const accessToken = generateAccessToken({
      userId: user.id,
      role: user.role,
    });
    const refreshToken = generateRefreshToken({ userId: user.id });

    return successResponse(
      res,
      201,
      "User registered successfully. Please check your email to verify your account.",
      {
        user,
        accessToken,
        refreshToken,
        message: "Verification email sent",
      },
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 * @route POST /api/v1/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user (support both email and phone)
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { phone: email }, // Allow login with phone
        ],
      },
    });

    if (!user) {
      return errorResponse(res, 401, "Invalid credentials");
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return errorResponse(res, 401, "Invalid credentials");
    }

    // Check if user is active
    if (!user.isActive) {
      return errorResponse(res, 403, "Account is deactivated");
    }

    // Check if email is verified (skip in development)
    if (!user.isVerified && process.env.NODE_ENV === "production") {
      return errorResponse(
        res,
        403,
        "Please verify your email address before logging in",
      );
    }

    // Auto-verify email in development
    if (!user.isVerified && process.env.NODE_ENV !== "production") {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          isVerified: true,
          emailVerificationToken: null,
          emailVerificationExpires: null,
        },
      });
      user.isVerified = true;
    }

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      role: user.role,
    });
    const refreshToken = generateRefreshToken({ userId: user.id });

    // Remove sensitive fields from response
    const {
      passwordHash,
      emailVerificationToken,
      emailVerificationExpires,
      passwordResetToken,
      passwordResetExpires,
      ...userWithoutSensitiveData
    } = user;

    return successResponse(res, 200, "Login successful", {
      user: userWithoutSensitiveData,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 * @route GET /api/v1/auth/me
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
      return errorResponse(res, 404, "User not found");
    }

    // Remove password
    const { passwordHash, ...userWithoutPassword } = user;

    return successResponse(
      res,
      200,
      "Profile retrieved successfully",
      userWithoutPassword,
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 * @route PUT /api/v1/auth/profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const { fullName, phone, profilePhotoUrl } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(fullName && { fullName }),
        ...(phone && { phone }),
        ...(profilePhotoUrl && { profilePhotoUrl }),
      },
      select: {
        id: true,
        email: true,
        phone: true,
        fullName: true,
        role: true,
        profilePhotoUrl: true,
        isVerified: true,
        updatedAt: true,
      },
    });

    return successResponse(
      res,
      200,
      "Profile updated successfully",
      updatedUser,
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Change password
 * @route PUT /api/v1/auth/change-password
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      return errorResponse(res, 401, "Current password is incorrect");
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: req.user.id },
      data: { passwordHash: newPasswordHash },
    });

    return successResponse(res, 200, "Password changed successfully");
  } catch (error) {
    next(error);
  }
};

/**
 * Verify email
 * @route POST /api/v1/auth/verify-email
 */
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;

    // Find user with this token
    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return errorResponse(res, 400, "Invalid or expired verification token");
    }

    // Update user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
    });

    return successResponse(res, 200, "Email verified successfully");
  } catch (error) {
    next(error);
  }
};

/**
 * Forgot password
 * @route POST /api/v1/auth/forgot-password
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists
      return successResponse(
        res,
        200,
        "If an account exists with this email, a password reset link has been sent",
      );
    }

    // Generate reset token
    const passwordResetToken = generateToken();
    const passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Update user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken,
        passwordResetExpires,
      },
    });

    // Send reset email
    const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password?token=${passwordResetToken}`;
    try {
      await sendPasswordResetEmail(email, user.fullName, resetUrl);
    } catch (emailError) {
      console.error("Failed to send password reset email:", emailError);
    }

    return successResponse(
      res,
      200,
      "If an account exists with this email, a password reset link has been sent",
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password
 * @route POST /api/v1/auth/reset-password
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    // Find user with this token
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return errorResponse(res, 400, "Invalid or expired reset token");
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    return successResponse(res, 200, "Password reset successfully");
  } catch (error) {
    next(error);
  }
};

/**
 * Logout
 * @route POST /api/v1/auth/logout
 */
const logout = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      blacklistToken(token);
    }

    return successResponse(res, 200, "Logged out successfully");
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword,
  logout,
  getProfile,
  updateProfile,
  changePassword,
};
