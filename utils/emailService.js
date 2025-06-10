const nodemailer = require('nodemailer');

// Create a transporter using Gmail
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Generate a random 6-digit verification code
const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send verification email
const sendVerificationEmail = async (email, code) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Email Verification - Social Service Unit',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #008000; text-align: center;">Social Service Unit</h2>
                    <div style="background-color: #f9f9f9; padding: 20px; border-radius: 10px;">
                        <h3 style="color: #333;">Verify Your Email Address</h3>
                        <p>Thank you for signing up! Please use the verification code below to complete your registration:</p>
                        <div style="background-color: #008000; color: white; padding: 15px; text-align: center; font-size: 24px; letter-spacing: 5px; border-radius: 5px; margin: 20px 0;">
                            ${code}
                        </div>
                        <p>This code will expire in 10 minutes.</p>
                        <p style="color: #666; font-size: 14px;">If you didn't request this verification, please ignore this email.</p>
                    </div>
                    <p style="text-align: center; color: #666; font-size: 12px; margin-top: 20px;">
                        © 2024 Social Service Unit. All rights reserved.
                    </p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Error sending verification email:', error);
        return false;
    }
};

module.exports = {
    generateVerificationCode,
    sendVerificationEmail
}; 