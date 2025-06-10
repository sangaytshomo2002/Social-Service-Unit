const transporter = require('../config/email');

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
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h1 style="color: #008000;">Social Service Unit</h1>
                    </div>
                    
                    <div style="background-color: #f9f9f9; padding: 20px; border-radius: 10px;">
                        <h2 style="color: #333; margin-bottom: 20px;">Verify Your Email Address</h2>
                        
                        <p style="color: #666; font-size: 16px; line-height: 1.5;">
                            Thank you for registering with Social Service Unit. To complete your registration, please use the verification code below:
                        </p>
                        
                        <div style="background-color: #008000; color: white; padding: 15px; text-align: center; font-size: 24px; letter-spacing: 5px; border-radius: 5px; margin: 20px 0;">
                            ${code}
                        </div>
                        
                        <p style="color: #666; font-size: 14px;">
                            This code will expire in 10 minutes. If you did not request this verification, please ignore this email.
                        </p>
                    </div>
                    
                    <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
                        © ${new Date().getFullYear()} Social Service Unit. All rights reserved.
                    </div>
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