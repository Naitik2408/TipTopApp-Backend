# Email Notification Setup Guide

## Overview
The system sends email notifications when new orders are placed. Emails are sent to addresses configured in the Settings page of the admin panel.

## Email Service Configuration

### Option 1: Gmail (Recommended for Testing)

1. **Enable 2-Factor Authentication**:
   - Go to your Google Account settings
   - Navigate to Security → 2-Step Verification
   - Enable 2FA

2. **Generate App Password**:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Name it "TipTop Backend"
   - Copy the generated 16-character password

3. **Update Backend .env File**:
   ```env
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-16-char-app-password
   EMAIL_FROM_NAME=ThéTipTop
   ```

### Option 2: Other Email Providers

#### **Outlook/Hotmail**
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
EMAIL_FROM_NAME=ThéTipTop
```

#### **Yahoo Mail**
```env
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
EMAIL_USER=your-email@yahoo.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM_NAME=ThéTipTop
```

#### **SendGrid (Production Recommended)**
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=your-sendgrid-api-key
EMAIL_FROM_NAME=ThéTipTop
```

#### **Mailgun**
```env
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_USER=postmaster@your-domain.mailgun.org
EMAIL_PASSWORD=your-mailgun-password
EMAIL_FROM_NAME=ThéTipTop
```

## Admin Panel Configuration

1. **Login to Admin Panel**
2. **Navigate to Settings**
3. **Order Configuration Section**:
   - Click "+ Add Email" to add notification email addresses
   - Enter valid email addresses (e.g., admin@example.com)
   - You can add multiple emails
   - Click "Save Changes"

## Email Notifications

### New Order Email
When a customer places an order, configured emails receive:
- Order number and status
- Customer details (name, phone)
- Order items with quantities and prices
- Subtotal, tax, delivery charges, and total amount
- Delivery address (if applicable)
- Special instructions

### Email Template Features
- Professional HTML design
- Responsive layout
- Order details in readable format
- Restaurant branding
- Plain text fallback for email clients that don't support HTML

## Testing Email Notifications

1. **Configure Email Settings** in backend .env
2. **Restart Backend Server**
3. **Add Notification Email** in Admin Settings
4. **Place a Test Order** from customer side
5. **Check Email Inbox** (check spam folder if not received)

## Troubleshooting

### Emails Not Sending

**Check Backend Logs**:
```bash
# Look for email-related errors
tail -f logs/app.log | grep -i email
```

**Common Issues**:

1. **Authentication Failed**:
   - Verify EMAIL_USER and EMAIL_PASSWORD are correct
   - For Gmail: Ensure you're using App Password, not regular password
   - Check 2FA is enabled

2. **Connection Timeout**:
   - Check EMAIL_HOST and EMAIL_PORT
   - Verify firewall isn't blocking port 587
   - Try port 465 with `secure: true` if 587 doesn't work

3. **Emails Going to Spam**:
   - Add sender email to contacts
   - Check SPF/DKIM records (for custom domains)
   - Use reputable email service (SendGrid, Mailgun for production)

4. **Invalid Email Addresses**:
   - Settings validation checks email format
   - Ensure emails follow format: name@domain.com

### Backend Code Check

If emails still don't work, check:
```javascript
// Backend logs when order is created
logger.info(`Order notification emails sent to: ${emails.join(', ')}`);

// Or if email failed:
logger.error('Failed to send order notification email:', error);
```

## Production Recommendations

For production use, consider:

1. **Use Professional Email Service**:
   - SendGrid (free tier: 100 emails/day)
   - Mailgun (free tier: 300 emails/day for 3 months)
   - AWS SES (very cheap, pay-as-you-go)

2. **Set Up Email Domain**:
   - Use your own domain (orders@yourdomain.com)
   - Configure SPF, DKIM, DMARC records
   - Better deliverability and professionalism

3. **Monitor Email Delivery**:
   - Track bounce rates
   - Monitor spam complaints
   - Keep logs of sent emails

4. **Rate Limiting**:
   - Current implementation has no rate limits
   - Consider adding delays for bulk orders
   - Use queues (Bull/Redis) for high volume

## Cost Comparison

| Service | Free Tier | Paid Plans | Best For |
|---------|-----------|------------|----------|
| Gmail | Limited daily sends | N/A | Testing only |
| SendGrid | 100/day forever | $15/mo for 50K | Small-medium apps |
| Mailgun | 300/day (3mo) | $35/mo for 50K | Developers |
| AWS SES | 1000/month | $0.10 per 1000 | High volume |
| Postmark | 100/month | $10/mo for 10K | Transactional |

## Security Notes

⚠️ **Never commit .env file to Git**
- .env contains sensitive credentials
- Always use .env.example as template
- Add .env to .gitignore

✅ **Use App Passwords**
- Don't use your main email password
- Generate app-specific passwords
- Revoke if compromised

✅ **Validate Email Inputs**
- Backend validates email format
- Frontend shows validation errors
- Prevents injection attacks

## Support

If you encounter issues:
1. Check backend logs
2. Verify .env configuration
3. Test with simple email service (Gmail) first
4. Check firewall/network settings
5. Review error messages in console
