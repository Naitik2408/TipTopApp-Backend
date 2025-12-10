/**
 * Test Email Connection Script
 * Run this to verify email configuration works
 */

require('dotenv').config();
const nodemailer = require('nodemailer');

const config = {
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
    minVersion: 'TLSv1.2'
  }
};

console.log('\n🔍 Testing Email Configuration...\n');
console.log('Configuration:', {
  host: config.host,
  port: config.port,
  secure: config.secure,
  user: config.auth.user ? `${config.auth.user.substring(0, 3)}***` : 'NOT SET',
  pass: config.auth.pass ? '***SET***' : 'NOT SET'
});

if (!config.auth.user || !config.auth.pass) {
  console.error('\n❌ ERROR: EMAIL_USER or EMAIL_PASSWORD not set in environment variables\n');
  process.exit(1);
}

const transporter = nodemailer.createTransport(config);

console.log('\n📡 Verifying SMTP connection...\n');

transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('\nFull error:', error);
    console.error('\n🔧 Troubleshooting tips:');
    console.error('1. Make sure you\'re using an App Password (not your Gmail password)');
    console.error('2. Enable 2-Step Verification in your Google Account');
    console.error('3. Generate an App Password: https://myaccount.google.com/apppasswords');
    console.error('4. Check if SMTP access is enabled in your Gmail settings');
    console.error('5. Try using port 465 with secure: true\n');
    process.exit(1);
  } else {
    console.log('✅ SMTP connection verified successfully!');
    console.log('\n📧 Sending test email...\n');
    
    transporter.sendMail({
      from: `"TipTop Test" <${config.auth.user}>`,
      to: config.auth.user, // Send to yourself
      subject: 'Test Email from TipTop Backend',
      text: 'If you receive this email, your email configuration is working correctly!',
      html: '<h1>✅ Success!</h1><p>Your email configuration is working correctly!</p>'
    }, (error, info) => {
      if (error) {
        console.error('❌ Failed to send test email:', error.message);
        process.exit(1);
      } else {
        console.log('✅ Test email sent successfully!');
        console.log('Message ID:', info.messageId);
        console.log('\n🎉 Email configuration is working perfectly!\n');
        process.exit(0);
      }
    });
  }
});
