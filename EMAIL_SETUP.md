# Email Service Setup Guide

## Problem
Gmail SMTP is blocked by most cloud providers (Render, Heroku, AWS, etc.) due to security restrictions. You'll get `ETIMEDOUT` errors.

## Solution: Use Brevo (Sendinblue)

### Why Brevo?
- ✅ **FREE**: 300 emails/day (perfect for your app)
- ✅ **Fast**: Works instantly, no verification delays
- ✅ **Reliable**: Designed for transactional emails
- ✅ **Easy**: 5-minute setup

---

## Setup Instructions

### 1. Create Brevo Account
1. Go to: https://app.brevo.com/account/register
2. Sign up with your email
3. Verify your email address

### 2. Get SMTP Credentials
1. Login to Brevo dashboard
2. Go to: **Settings** → **SMTP & API**
3. Click: **Create a new SMTP key**
4. Name it: "TipTop Backend"
5. Copy the credentials:
   - **Login**: (your email)
   - **Password**: (16-character key like `xkeysib-abc123...`)

### 3. Update Render Environment Variables
1. Go to Render Dashboard → Your Service
2. Go to **Environment** tab
3. Update these variables:

```
EMAIL_HOST=smtp-relay.brevo.com
EMAIL_PORT=587
EMAIL_USER=your-brevo-email@gmail.com
EMAIL_PASSWORD=xkeysib-your-smtp-key-here
EMAIL_FROM_NAME=ThéTipTop Restaurant
```

4. Click **Save Changes**
5. Render will automatically redeploy

### 4. Test
- Register a new user in your app
- You should receive OTP email within seconds!

---

## Alternative: SendGrid (if you prefer)

### SendGrid Setup
1. Sign up: https://signup.sendgrid.com/
2. Free tier: **100 emails/day**
3. Get API Key from Settings → API Keys
4. Update Render environment:

```
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=SG.your-api-key-here
```

---

## Keep Using Gmail? (Not Recommended)

If you really want to use Gmail (will likely fail on Render):

1. Enable 2-Step Verification: https://myaccount.google.com/security
2. Create App Password: https://myaccount.google.com/apppasswords
3. Use these in Render:
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
```

**Note**: Gmail may still block Render's IP addresses.

---

## Troubleshooting

### Check Render Logs
After deployment, look for:
```json
{"message":"✅ Email transporter verified and ready to send emails"}
```

### Common Errors

**ETIMEDOUT**: Server can't connect
- Solution: Use Brevo/SendGrid instead of Gmail

**Invalid login**: Wrong credentials
- Solution: Double-check EMAIL_USER and EMAIL_PASSWORD

**Missing env vars**: 
```json
{"message":"Email credentials not configured"}
```
- Solution: Set EMAIL_USER and EMAIL_PASSWORD in Render

---

## Quick Comparison

| Service | Free Limit | Setup Time | Render Compatible |
|---------|-----------|------------|-------------------|
| **Brevo** | 300/day | 5 min | ✅ Yes |
| **SendGrid** | 100/day | 5 min | ✅ Yes |
| **Gmail** | Unlimited | 2 min | ❌ Usually blocked |

**Recommendation**: Use Brevo for production, it's free and just works! 🚀
