# Validation Test Suite

This directory contains test files to ensure frontend and backend validation rules are consistent and working correctly.

## Test Files

### 1. `test-address-validation.js`
Tests address validation rules to ensure frontend (AddAddressScreen.tsx) and backend (order.validator.js, address.validator.js) validate addresses identically.

**Coverage:**
- Street address (5-200 characters, required)
- Apartment (max 100 characters, optional)
- City (2-50 characters, letters only, required)
- State (2-50 characters, letters only, required)
- Zip Code (exactly 6 digits, required)
- Landmark (max 100 characters, optional)
- Label (max 50 characters, optional)

**Test Cases:** 25 tests covering valid inputs, invalid inputs, and edge cases

### 2. `test-order-validation.js`
Tests order placement validation to ensure orders with various inputs are validated correctly.

**Coverage:**
- Order items (menu IDs, quantity 1-50, special instructions max 200 chars)
- Delivery address (same rules as address validation)
- Payment method (ONLINE, COD, CARD, UPI)
- Contact phone (optional)

**Test Cases:** 17 tests covering valid orders, invalid items, invalid addresses, and payment methods

## Running Tests

### Run All Tests
```bash
cd /home/naitik2408/Contribution/Backend
node test-address-validation.js && node test-order-validation.js
```

### Run Individual Tests
```bash
# Address validation only
node test-address-validation.js

# Order validation only
node test-order-validation.js
```

## Test Output

✅ **Pass:** All validation rules match between frontend and backend
❌ **Fail:** Validation mismatch detected - fix immediately

## Validation Rules Summary

### Required Fields
- **Street:** 5-200 characters
- **City:** 2-50 characters, letters and spaces only
- **State:** 2-50 characters, letters and spaces only
- **Zip Code:** Exactly 6 digits

### Optional Fields
- **Apartment:** Max 100 characters
- **Landmark:** Max 100 characters
- **Label:** Max 50 characters
- **Contact Phone:** Any format

### Order Specific
- **Quantity:** 1-50 per item
- **Special Instructions:** Max 200 characters
- **Payment Method:** Must be one of: ONLINE, COD, CARD, UPI

## Adding New Test Cases

When adding new validation rules:

1. Update frontend validation in `TiptopApp/src/screens/customer/main/AddAddressScreen.tsx`
2. Update backend validators:
   - `Backend/src/validators/address.validator.js` (for address API)
   - `Backend/src/validators/order.validator.js` (for order placement)
3. Add test cases to `test-address-validation.js` or `test-order-validation.js`
4. Run tests to verify consistency
5. Update this README

## Common Validation Errors

### Frontend Errors
```
City name should only contain letters
Zip code must be exactly 6 digits
Street address must be at least 5 characters
```

### Backend Errors (API)
```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": [
    "City name should only contain letters",
    "Zip code must be exactly 6 digits"
  ]
}
```

## Integration with Backend

The address validator is integrated into the address routes:
- `POST /api/v1/addresses` - Uses `validateAddAddress`
- `PATCH /api/v1/addresses/:addressId` - Uses `validateUpdateAddress`

The order validator is integrated into the order routes:
- `POST /api/v1/orders` - Uses order validation middleware

## Troubleshooting

### "City name should only contain letters" error
- **Cause:** City contains numbers or special characters
- **Fix:** Use only letters and spaces (e.g., "New Mumbai" not "Mumbai123")

### "Zip code must be exactly 6 digits" error
- **Cause:** Zip code is not exactly 6 digits
- **Fix:** Provide 6-digit Indian PIN code (e.g., "400001")

### "Street address must be at least 5 characters" error
- **Cause:** Street is too short
- **Fix:** Provide complete street address with at least 5 characters

## CI/CD Integration

These tests can be integrated into your CI/CD pipeline:

```bash
# Add to package.json scripts
"test:validation": "node test-address-validation.js && node test-order-validation.js"

# Run in CI
npm run test:validation
```

## Last Updated
January 4, 2026
