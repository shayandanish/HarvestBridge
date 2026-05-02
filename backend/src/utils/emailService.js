const { transporter, EMAIL_FROM } = require('../config/email');
const logger = require('./logger');
const fs = require('fs/promises');
const path = require('path');

/**
 * Send email
 * @param {String} to - Recipient email
 * @param {String} subject - Email subject
 * @param {String} html - HTML content
 */
const sendEmail = async (to, subject, html) => {
    try {
        const mailOptions = {
            from: EMAIL_FROM,
            to,
            subject,
            html,
        };

        const info = await transporter.sendMail(mailOptions);
        logger.info(`📧 Email sent to ${to}: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        logger.error('Email sending failed:', error);
        throw new Error('Failed to send email');
    }
};

/**
 * Load email template
 * @param {String} templateName - Template file name
 * @param {Object} variables - Variables to replace in template
 */
const loadTemplate = async (templateName, variables = {}) => {
    try {
        const templatePath = path.join(__dirname, '../templates', `${templateName}.html`);
        let template = await fs.readFile(templatePath, 'utf-8');

        // Replace variables
        Object.keys(variables).forEach((key) => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            template = template.replace(regex, variables[key]);
        });

        return template;
    } catch (error) {
        logger.error(`Failed to load template ${templateName}:`, error);
        throw new Error('Failed to load email template');
    }
};

/**
 * Send welcome email
 */
const sendWelcomeEmail = async (to, name) => {
    const html = await loadTemplate('welcome', { name });
    return sendEmail(to, 'Welcome to Agro Investment Platform', html);
};

/**
 * Send email verification
 */
const sendVerificationEmail = async (to, name, verificationUrl) => {
    const html = await loadTemplate('verifyEmail', { name, verificationUrl });
    return sendEmail(to, 'Verify Your Email Address', html);
};

/**
 * Send password reset email
 */
const sendPasswordResetEmail = async (to, name, resetUrl) => {
    const html = await loadTemplate('resetPassword', { name, resetUrl });
    return sendEmail(to, 'Reset Your Password', html);
};

/**
 * Send land approval email
 */
const sendLandApprovalEmail = async (to, name, landName) => {
    const html = await loadTemplate('landApproved', { name, landName });
    return sendEmail(to, 'Land Verification Approved', html);
};

/**
 * Send land rejection email
 */
const sendLandRejectionEmail = async (to, name, landName, reason) => {
    const html = await loadTemplate('landRejected', { name, landName, reason });
    return sendEmail(to, 'Land Verification Rejected', html);
};

/**
 * Send farm approval email
 */
const sendFarmApprovalEmail = async (to, name, farmName) => {
    const html = await loadTemplate('farmApproved', { name, farmName });
    return sendEmail(to, 'Farm Approved', html);
};

/**
 * Send farm rejection email
 */
const sendFarmRejectionEmail = async (to, name, farmName, reason) => {
    const html = await loadTemplate('farmRejected', { name, farmName, reason });
    return sendEmail(to, 'Farm Rejected', html);
};

/**
 * Send booking confirmation to investor
 */
const sendBookingConfirmationEmail = async (to, name, bookingDetails) => {
    const html = await loadTemplate('bookingConfirmation', { name, ...bookingDetails });
    return sendEmail(to, 'Booking Confirmation - Farm Visit', html);
};

/**
 * Send booking notification to farmer
 */
const sendFarmerBookingNotification = async (to, farmerName, bookingDetails) => {
    const html = await loadTemplate('farmerBookingNotification', { name: farmerName, ...bookingDetails });
    return sendEmail(to, 'New Farm Visit Booking', html);
};

/**
 * Send booking cancellation notification
 */
const sendBookingCancellationNotification = async (to, name, bookingDetails, reason) => {
    const html = await loadTemplate('bookingCancelled', { name, ...bookingDetails, reason });
    return sendEmail(to, 'Booking Cancelled', html);
};

/**
 * Send booking rescheduled notification
 */
const sendBookingRescheduledNotification = async (to, name, bookingDetails) => {
    const html = await loadTemplate('bookingRescheduled', { name, ...bookingDetails });
    return sendEmail(to, 'Booking Rescheduled', html);
};

/**
 * Send harvest ready notification
 */
const sendHarvestReadyNotification = async (to, name, harvestDetails) => {
    const html = await loadTemplate('harvestReady', { name, ...harvestDetails });
    return sendEmail(to, 'Good News! Your Produce is Harvested!', html);
};

/**
 * Send delivery status update
 */
const sendDeliveryStatusUpdate = async (to, name, deliveryDetails) => {
    const html = await loadTemplate('deliveryUpdate', { name, ...deliveryDetails });
    return sendEmail(to, `Delivery Update: ${deliveryDetails.status}`, html);
};

/**
 * Send harvest review request
 */
const sendHarvestReviewRequest = async (to, name, harvestDetails) => {
    const html = await loadTemplate('harvestReviewRequest', { name, ...harvestDetails });
    return sendEmail(to, 'How was your harvest? Share your feedback!', html);
};

module.exports = {
    sendEmail,
    loadTemplate,
    sendWelcomeEmail,
    sendVerificationEmail,
    sendPasswordResetEmail,
    sendLandApprovalEmail,
    sendLandRejectionEmail,
    sendFarmApprovalEmail,
    sendFarmRejectionEmail,
    sendBookingConfirmationEmail,
    sendFarmerBookingNotification,
    sendBookingCancellationNotification,
    sendBookingRescheduledNotification,
    sendHarvestReadyNotification,
    sendDeliveryStatusUpdate,
    sendHarvestReviewRequest,
};
