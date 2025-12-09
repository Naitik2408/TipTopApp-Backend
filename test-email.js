require('dotenv').config();
const emailService = require('./src/services/email.service');

async function testEmail() {
  console.log('\n🧪 Testing Email Configuration...\n');
  
  console.log('Configuration:');
  console.log('- Host:', process.env.EMAIL_HOST);
  console.log('- Port:', process.env.EMAIL_PORT);
  console.log('- User:', process.env.EMAIL_USER);
  console.log('- Password:', process.env.EMAIL_PASSWORD ? '****' + process.env.EMAIL_PASSWORD.slice(-4) : 'NOT SET');
  console.log('- From Name:', process.env.EMAIL_FROM_NAME);
  console.log('');

  if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'your-actual-email@gmail.com') {
    console.error('❌ EMAIL_USER not configured properly!');
    console.log('Please update EMAIL_USER in .env with your actual Gmail address');
    process.exit(1);
  }

  if (!process.env.EMAIL_PASSWORD) {
    console.error('❌ EMAIL_PASSWORD not set!');
    process.exit(1);
  }

  console.log('📧 Sending test email...\n');

  const testOrderDetails = {
    orderNumber: 'TEST-' + Date.now(),
    customer: {
      name: 'Test Customer',
      phone: '+33 6 12 34 56 78',
    },
    items: [
      {
        name: 'Margherita Pizza',
        quantity: 2,
        price: 12.99,
        subtotal: 25.98,
      },
      {
        name: 'Caesar Salad',
        quantity: 1,
        price: 8.99,
        subtotal: 8.99,
      },
    ],
    pricing: {
      subtotal: 34.97,
      tax: 1.75,
      deliveryCharges: 5.00,
      finalAmount: 41.72,
    },
    deliveryAddress: {
      street: '123 Test Street',
      city: 'Paris',
      postalCode: '75001',
      country: 'France',
    },
    paymentMethod: 'Card',
    status: 'pending',
    orderType: 'delivery',
    notes: 'This is a test order. Please ring doorbell.',
  };

  try {
    const result = await emailService.sendNewOrderNotification(
      testOrderDetails,
      [process.env.EMAIL_USER] // Send to yourself for testing
    );

    if (result) {
      console.log('✅ Test email sent successfully!');
      console.log(`📬 Check your inbox at: ${process.env.EMAIL_USER}`);
      console.log('   (Also check spam folder if not in inbox)');
    } else {
      console.log('❌ Failed to send test email');
      console.log('Check the logs above for error details');
    }
  } catch (error) {
    console.error('❌ Error sending test email:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Verify EMAIL_USER is correct');
    console.error('2. Ensure EMAIL_PASSWORD is the App Password from Google');
    console.error('3. Check if 2FA is enabled on your Google account');
    console.error('4. Generate new App Password: https://myaccount.google.com/apppasswords');
  }

  console.log('');
  process.exit(0);
}

testEmail();
