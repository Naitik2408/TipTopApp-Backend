# Email & Notification Services Setup

This backend uses two separate services for different purposes:

1. **Brevo** - For email verification (OTP emails)
2. **Firebase Cloud Messaging** - For push notifications (order updates)

---

## 1. Brevo Email Service Setup

### Purpose
Send OTP verification emails during user registration and password reset.

### Get Your Brevo API Key

1. **Sign up for Brevo**: https://app.brevo.com/account/register
2. **Go to API Keys**: https://app.brevo.com/settings/keys/api
3. **Create a new API key** (copy it - you won't see it again)
4. **Free Tier**: 300 emails/day

### Configure Environment Variables

Add to your `.env` file:

```env
# Brevo Email Service
BREVO_API_KEY=your_brevo_api_key_here
BREVO_FROM_EMAIL=noreply@yourdomain.com
EMAIL_FROM_NAME=ThéTipTop
```

**For Render.com (Production):**

1. Go to your service dashboard: https://dashboard.render.com/
2. Navigate to **Environment** tab
3. Add these variables:
   - `BREVO_API_KEY` = your API key from Brevo
   - `BREVO_FROM_EMAIL` = your verified sender email
   - `EMAIL_FROM_NAME` = ThéTipTop

### Sender Email Configuration

**Option 1: Use Default Brevo Domain** (Quick Start)
```env
BREVO_FROM_EMAIL=no-reply@yourdomain.com
```
Note: Brevo may have restrictions on free tier sender addresses.

**Option 2: Verify Your Own Domain** (Recommended for Production)
1. Go to **Senders & IP** in Brevo dashboard
2. Add and verify your domain
3. Create a sender email like `noreply@yourdomain.com`
4. Update `BREVO_FROM_EMAIL` with your verified email

### Test Email Service

```bash
# From backend directory
node -e "require('./src/services/email.service').sendOTPEmail('test@example.com', '123456', 'Test User').then(r => console.log('Result:', r))"
```

---

## 2. Firebase Cloud Messaging (FCM) Setup

### Purpose
Send push notifications to mobile apps when:
- New orders are created
- Order status changes
- Custom notifications

### Get Firebase Credentials

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select your project** (or create a new one)
3. **Project Settings** → **Service Accounts**
4. **Generate New Private Key** → Download the JSON file

### Configure Environment Variables

**Option 1: Full Service Account JSON** (Recommended for Production)

1. Open the downloaded JSON file
2. Copy the entire JSON content
3. Minify it (remove newlines): https://www.minifier.org/
4. Add to `.env`:

```env
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"your-project-id",...}
```

**For Render.com:**
- Add environment variable `FIREBASE_SERVICE_ACCOUNT`
- Paste the minified JSON as the value

**Option 2: Individual Credentials** (Alternative)

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBg...\n-----END PRIVATE KEY-----\n
```

⚠️ **Important for `FIREBASE_PRIVATE_KEY`**:
- Keep the `\n` characters for line breaks
- In Render, paste the key exactly as shown in the JSON file

### Mobile App Integration

Your mobile app needs to:

1. **Install Firebase SDK**:
```bash
npm install @react-native-firebase/app @react-native-firebase/messaging
```

2. **Get Device Token**:
```javascript
import messaging from '@react-native-firebase/messaging';

async function getDeviceToken() {
  const token = await messaging().getToken();
  console.log('FCM Token:', token);
  return token;
}
```

3. **Send Token to Backend**:
Store the device token in your user model or a separate collection.

4. **Handle Notifications**:
```javascript
messaging().onMessage(async remoteMessage => {
  console.log('Notification received:', remoteMessage);
});
```

### Test Push Notification

```javascript
const notificationService = require('./src/services/notification.service');

// Example order object
const order = {
  _id: '507f1f77bcf86cd799439011',
  orderNumber: 'ORD-12345',
  totalAmount: 45.99,
  items: [{name: 'Pizza', quantity: 2}]
};

const deviceToken = 'user_fcm_device_token_here';

notificationService.sendOrderNotification(order, deviceToken)
  .then(result => console.log('Notification sent:', result))
  .catch(err => console.error('Failed:', err));
```

---

## 3. Usage Examples

### Sending OTP Email (Automatic in Auth Flow)

```javascript
const emailService = require('./src/services/email.service');

// Send OTP
await emailService.sendOTPEmail(
  'user@example.com',
  '123456',
  'John Doe'
);
```

### Sending Order Notification

```javascript
const notificationService = require('./src/services/notification.service');

// When new order is created
app.post('/api/orders', async (req, res) => {
  const order = await Order.create(req.body);
  
  // Get user's device token from database
  const user = await User.findById(order.customerId);
  
  if (user.fcmToken) {
    await notificationService.sendOrderNotification(order, user.fcmToken);
  }
  
  res.json(order);
});
```

### Sending Order Status Update

```javascript
// When order status changes
await notificationService.sendOrderStatusUpdate(
  order,
  'preparing',
  userDeviceToken
);
```

### Custom Notification

```javascript
await notificationService.sendCustomNotification(
  deviceToken,
  'Special Offer! 🎉',
  'Get 20% off on your next order',
  { type: 'PROMOTION', code: 'SAVE20' }
);
```

---

## 4. Render Environment Variables Summary

Add these to your Render service:

```
# Email Service (Brevo)
BREVO_API_KEY=xkeysib-xxx
BREVO_FROM_EMAIL=noreply@yourdomain.com
EMAIL_FROM_NAME=ThéTipTop

# Push Notifications (Firebase)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
```

---

## 5. Troubleshooting

### Brevo Emails Not Sending

1. **Check API Key**: Verify it's correct in environment variables
2. **Check Logs**: Look for error messages in server logs
3. **Verify Sender**: Ensure sender email is verified in Brevo
4. **Check Quota**: Free tier = 300 emails/day

### Firebase Notifications Not Working

1. **Check Credentials**: Ensure JSON is properly formatted
2. **Verify Device Token**: Must be valid FCM registration token
3. **Check App Setup**: Mobile app must have Firebase SDK configured
4. **Test Token**: Use Firebase Console → Cloud Messaging to send test notification

### Debug Logs

Both services log extensively:
```bash
# Check Render logs
# Look for:
# ✅ Email service initialized with Brevo
# ✅ Firebase Cloud Messaging initialized
# 📧 Sending OTP email to...
# ✅ Order notification sent successfully
```

---

## 6. Production Checklist

- [ ] Brevo API key configured
- [ ] Brevo sender email verified
- [ ] Firebase service account JSON added
- [ ] Mobile app has FCM device token functionality
- [ ] Device tokens stored in user model
- [ ] Order controller sends notifications on new orders
- [ ] Order status updates trigger notifications
- [ ] Tested email delivery
- [ ] Tested push notifications on iOS
- [ ] Tested push notifications on Android

---

## Support

For issues:
- **Brevo Docs**: https://developers.brevo.com/
- **Firebase FCM Docs**: https://firebase.google.com/docs/cloud-messaging
- **React Native Firebase**: https://rnfirebase.io/
