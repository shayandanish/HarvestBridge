const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.gmail.com';
const EMAIL_PORT = parseInt(process.env.EMAIL_PORT) || 587;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@agroinvestment.com';

// Create transporter
const createTransporter = () => {
    // In development, use console logging instead of actual email
    if (process.env.NODE_ENV === 'development' && !EMAIL_USER) {
        logger.info('📧 Email service running in DEVELOPMENT mode (console logging)');
        return {
            sendMail: async (mailOptions) => {
                logger.info('📧 Email would be sent:', {
                    to: mailOptions.to,
                    subject: mailOptions.subject,
                    html: mailOptions.html?.substring(0, 100) + '...',
                });
                return { messageId: 'dev-' + Date.now() };
            },
        };
    }

    // Production email configuration
    return nodemailer.createTransport({
        host: EMAIL_HOST,
        port: EMAIL_PORT,
        secure: EMAIL_PORT === 465,
        auth: {
            user: EMAIL_USER,
            pass: EMAIL_PASSWORD,
        },
    });
};

const transporter = createTransporter();

// Verify email configuration
const verifyEmailConfig = async () => {
    if (process.env.NODE_ENV === 'development' && !EMAIL_USER) {
        return true;
    }

    try {
        await transporter.verify();
        logger.info('✅ Email service configured successfully');
        return true;
    } catch (error) {
        logger.error('❌ Email service configuration failed:', error);
        return false;
    }
};

module.exports = {
    transporter,
    verifyEmailConfig,
    EMAIL_FROM,
};
