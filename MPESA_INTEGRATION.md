# M-Pesa Integration Guide

## Overview
This application includes a complete M-Pesa integration for processing donations using Safaricom's STK Push (Lipa na M-Pesa Online) service.

## Features Implemented

### ✅ Core M-Pesa Functionality
- **STK Push Integration**: Initiates payment requests directly to user's phone
- **Real-time Status Checking**: Monitors payment status automatically
- **Callback Handling**: Processes payment confirmations from Safaricom
- **Timeout Management**: Handles payment timeouts gracefully
- **Transaction Tracking**: Complete audit trail of all transactions
- **Phone Number Formatting**: Automatic formatting to M-Pesa standards
- **Simulation Mode**: Development mode when credentials aren't configured

### 🔧 Technical Implementation

#### Database Schema
```sql
-- Completed donations
CREATE TABLE donations (
  id INTEGER PRIMARY KEY,
  amount REAL NOT NULL,
  project_id TEXT NOT NULL,
  mpesa_code TEXT,
  phone_number TEXT,
  transaction_ref TEXT,
  transaction_date TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Pending/tracking transactions
CREATE TABLE pending_transactions (
  id INTEGER PRIMARY KEY,
  checkout_request_id TEXT UNIQUE NOT NULL,
  merchant_request_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  amount REAL NOT NULL,
  phone_number TEXT NOT NULL,
  transaction_ref TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  mpesa_receipt_number TEXT,
  failure_reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME
);
```

#### API Endpoints
- `POST /api/donate` - Initiate donation with M-Pesa STK Push
- `GET /api/mpesa?checkout_request_id=xxx` - Check payment status
- `POST /api/mpesa/callback` - Handle M-Pesa payment confirmations
- `POST /api/mpesa/timeout` - Handle payment timeouts

## Configuration

### Environment Variables
Add these to your `.env` file:

```env
# M-Pesa Configuration
MPESA_ENVIRONMENT=sandbox  # or 'production'
MPESA_CONSUMER_KEY=your_consumer_key_here
MPESA_CONSUMER_SECRET=your_consumer_secret_here
MPESA_BUSINESS_SHORT_CODE=174379
MPESA_PASSKEY=your_passkey_here
MPESA_CALLBACK_URL=https://your-domain.com/api/mpesa/callback
MPESA_TIMEOUT_URL=https://your-domain.com/api/mpesa/timeout
```

### Getting M-Pesa Credentials

#### 1. Sandbox (Development)
1. Visit [Safaricom Developer Portal](https://developer.safaricom.co.ke/)
2. Create an account and login
3. Create a new app
4. Select "Lipa na M-Pesa Online" product
5. Get your Consumer Key and Consumer Secret
6. Use test credentials:
   - Business Short Code: `174379`
   - Passkey: `bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919`

#### 2. Production
1. Complete Safaricom's onboarding process
2. Get your live Business Short Code
3. Obtain your production Passkey
4. Update environment variables

## Usage Flow

### 1. User Initiates Donation
```javascript
// Frontend sends donation request
const response = await fetch('/api/donate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    project_id: 'proj-1',
    amount: 100,
    phone_number: '0712345678'
  })
});
```

### 2. STK Push Initiated
- System formats phone number (0712345678 → 254712345678)
- Generates unique transaction reference
- Calls M-Pesa STK Push API
- Stores pending transaction in database
- Returns checkout request ID to frontend

### 3. User Completes Payment
- User receives M-Pesa prompt on phone
- Enters M-Pesa PIN to authorize payment
- M-Pesa processes the transaction

### 4. Payment Confirmation
- M-Pesa sends callback to `/api/mpesa/callback`
- System processes callback data
- Updates donation and project records
- Marks transaction as completed

### 5. Status Monitoring
- Frontend polls `/api/mpesa?checkout_request_id=xxx`
- Real-time status updates shown to user
- Automatic UI updates when payment completes

## Error Handling

### Payment Failures
- Invalid phone numbers
- Insufficient M-Pesa balance
- Network timeouts
- User cancellation
- System errors

### Graceful Degradation
- Falls back to simulation mode if credentials missing
- Comprehensive error messages
- Transaction status tracking
- Retry mechanisms

## Security Features

### Data Protection
- No sensitive M-Pesa credentials exposed to frontend
- Secure token generation and management
- Transaction reference validation
- Callback data verification

### Phone Number Validation
```javascript
// Automatic formatting and validation
formatPhoneNumber('0712345678') // → '254712345678'
formatPhoneNumber('712345678')  // → '254712345678'
formatPhoneNumber('+254712345678') // → '254712345678'
```

## Testing

### Sandbox Testing
1. Use test phone numbers: `254708374149`, `254711082300`
2. Use small amounts (1-1000 KSh)
3. Monitor logs for callback data
4. Verify database updates

### Production Testing
1. Start with small amounts
2. Test with multiple phone numbers
3. Verify SMS confirmations
4. Monitor transaction reports

## Monitoring & Logging

### Transaction Logs
- All M-Pesa requests/responses logged
- Callback data preserved
- Error tracking and debugging
- Performance monitoring

### Database Queries
```sql
-- Check pending transactions
SELECT * FROM pending_transactions WHERE status = 'pending';

-- View recent donations
SELECT d.*, p.title FROM donations d 
JOIN projects p ON d.project_id = p.id 
ORDER BY d.created_at DESC LIMIT 10;

-- Transaction success rate
SELECT 
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM pending_transactions), 2) as percentage
FROM pending_transactions 
GROUP BY status;
```

## Troubleshooting

### Common Issues

#### 1. "Invalid phone number format"
- Ensure phone number is 9 digits (after 0)
- Check network operator (Safaricom only)
- Verify number is M-Pesa registered

#### 2. "STK Push failed"
- Check M-Pesa credentials
- Verify business short code
- Ensure sufficient API limits

#### 3. "Callback not received"
- Verify callback URL is accessible
- Check firewall settings
- Monitor network connectivity

#### 4. "Transaction timeout"
- User didn't complete payment in time
- Network issues on user's side
- M-Pesa service unavailable

### Debug Mode
Enable detailed logging by setting:
```env
NODE_ENV=development
```

## Production Deployment

### Prerequisites
1. Valid SSL certificate (HTTPS required)
2. Public callback URLs
3. Production M-Pesa credentials
4. Database backups configured

### Deployment Checklist
- [ ] Update environment variables
- [ ] Configure callback URLs
- [ ] Test with small amounts
- [ ] Monitor error rates
- [ ] Set up alerting
- [ ] Document support procedures

## Support

### M-Pesa Support
- Email: apisupport@safaricom.co.ke
- Phone: +254 722 000 000
- Portal: https://developer.safaricom.co.ke/

### Integration Support
- Check application logs
- Review transaction database
- Monitor callback endpoints
- Verify environment configuration

---

**Note**: This integration is production-ready but requires proper M-Pesa credentials and configuration for live transactions.