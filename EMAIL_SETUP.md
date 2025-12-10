# Email Service Setup Guide

## ⚡ Recommended: Resend (Best Option)

### Why Resend?
- ✅ **FREE**: 100 emails/day (3,000/month)
- ✅ **2-minute setup**: Just one API key
- ✅ **Works everywhere**: No SMTP, no IP blocks
- ✅ **Modern API**: Simple, fast, reliable
- ✅ **No verification**: Instant activation

---

## 🚀 Quick Setup (Resend)

### 1. Create Resend Account (1 minute)
1. Go to: https://resend.com/signup
2. Sign up (free, no credit card)
3. Verify your email

### 2. Get API Key (30 seconds)
1. Go to: https://resend.com/api-keys
2. Click: **Create API Key**
3. Name it: "TipTop Backend"
4. **Copy** the key (starts with `re_...`)

### 3. Update Render Environment (1 minute)
Go to Render Dashboard → Environment tab:

```bash
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=onboarding@resend.dev
```

**Note**: With free plan, you can only send from `onboarding@resend.dev`. To use your own domain (like `noreply@tiptop.com`), you need to verify your domain (also free).

### 4. Done! 🎉
- Save changes in Render
- Auto-deploys in 2 minutes
- Test registration → OTP arrives instantly!

---

## Alternative Options

### Option 2: Brevo (Good for High Volume)
### Option 2: Brevo (Good for High Volume)

**Free Limit**: 300 emails/day

1. Sign up: https://app.brevo.com/account/register
2. Get SMTP key: Settings → SMTP & API → Create SMTP key
3. Update Render:
```bash
EMAIL_HOST=smtp-relay.brevo.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=xkeysib-your-smtp-key
EMAIL_FROM_NAME=TipTop Restaurant
```

### Option 3: SendGrid

**Free Limit**: 100 emails/day

1. Sign up: https://signup.sendgrid.com/
2. Get API key: Settings → API Keys
3. Update Render:
```bash
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=SG.your-api-key
EMAIL_FROM_NAME=TipTop Restaurant
```

---

## Don't Use Gmail (Not Recommended)

Gmail SMTP **will not work** on Render/Heroku/AWS due to IP blocking.
You'll get `ETIMEDOUT` errors.

---

## How It Works

The backend automatically detects which provider you've configured:

1. **Resend** (if `RESEND_API_KEY` is set) ← Best option
2. **SMTP** (if `EMAIL_USER` + `EMAIL_PASSWORD` set) ← Fallback
3. **Disabled** (if nothing configured)

---

## Troubleshooting

### Check Render Logs

**Success (Resend)**:
```json
{"message":"✅ Email service initialized with Resend (API-based)"}
{"message":"✅ Email sent successfully via Resend. ID: xxx"}
```

**Success (SMTP)**:
```json
{"message":"✅ SMTP transporter verified and ready"}
{"message":"✅ Email sent successfully via SMTP"}
```

**Failed**:
```json
{"message":"❌ Email service not configured"}
```

### Common Issues

**"Email service not configured"**
- Solution: Set `RESEND_API_KEY` in Render environment

**"ETIMEDOUT" with SMTP**
- Gmail/SMTP is blocked by cloud provider
- Solution: Switch to Resend

**"Invalid API key" with Resend**
- Double-check the API key in Render
- Make sure it starts with `re_`

---

## Quick Comparison

| Provider | Free Limit | Setup | Works on Render | Recommended |
|----------|-----------|-------|-----------------|-------------|
| **Resend** | 100/day | 2 min | ✅ Always | ⭐ YES |
| **Brevo** | 300/day | 5 min | ✅ Usually | Good |
| **SendGrid** | 100/day | 5 min | ✅ Usually | Good |
| **Gmail** | Unlimited | 2 min | ❌ Blocked | Never |

**Bottom line: Use Resend! 🚀**
