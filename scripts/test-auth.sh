#!/bin/bash

# Test script for authentication endpoints
# Run this after starting the server with 'npm start'

BASE_URL="http://localhost:5000/api/v1"
CONTENT_TYPE="Content-Type: application/json"

echo "🧪 Testing Authentication Endpoints"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test 1: Register new user
echo -e "${BLUE}Test 1: Register New User${NC}"
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "$CONTENT_TYPE" \
  -d '{
    "name": {
      "first": "Test",
      "last": "User"
    },
    "email": "test@example.com",
    "password": "Test@1234",
    "phone": "9988776655",
    "addresses": [
      {
        "type": "home",
        "street": "789 Test Street",
        "city": "Bangalore",
        "state": "Karnataka",
        "zipCode": "560001"
      }
    ]
  }')

if echo "$REGISTER_RESPONSE" | grep -q '"status":"success"'; then
  echo -e "${GREEN}✓ Registration successful${NC}"
  ACCESS_TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
  echo "  Access Token: ${ACCESS_TOKEN:0:20}..."
else
  echo -e "${RED}✗ Registration failed${NC}"
  echo "$REGISTER_RESPONSE" | jq '.' 2>/dev/null || echo "$REGISTER_RESPONSE"
fi
echo ""

# Test 2: Login with existing user
echo -e "${BLUE}Test 2: Login${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "$CONTENT_TYPE" \
  -d '{
    "email": "rahul@example.com",
    "password": "Customer@123"
  }')

if echo "$LOGIN_RESPONSE" | grep -q '"status":"success"'; then
  echo -e "${GREEN}✓ Login successful${NC}"
  LOGIN_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
  REFRESH_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"refreshToken":"[^"]*' | cut -d'"' -f4)
  echo "  Access Token: ${LOGIN_TOKEN:0:20}..."
  echo "  Refresh Token: ${REFRESH_TOKEN:0:20}..."
else
  echo -e "${RED}✗ Login failed${NC}"
  echo "$LOGIN_RESPONSE" | jq '.' 2>/dev/null || echo "$LOGIN_RESPONSE"
fi
echo ""

# Test 3: Get current user profile (protected route)
echo -e "${BLUE}Test 3: Get Current User Profile (Protected)${NC}"
if [ -n "$LOGIN_TOKEN" ]; then
  ME_RESPONSE=$(curl -s -X GET "$BASE_URL/auth/me" \
    -H "$CONTENT_TYPE" \
    -H "Authorization: Bearer $LOGIN_TOKEN")

  if echo "$ME_RESPONSE" | grep -q '"status":"success"'; then
    echo -e "${GREEN}✓ Profile retrieved successfully${NC}"
    USER_NAME=$(echo "$ME_RESPONSE" | grep -o '"first":"[^"]*' | cut -d'"' -f4)
    USER_EMAIL=$(echo "$ME_RESPONSE" | grep -o '"address":"[^"]*' | cut -d'"' -f4 | head -1)
    echo "  User: $USER_NAME"
    echo "  Email: $USER_EMAIL"
  else
    echo -e "${RED}✗ Failed to get profile${NC}"
    echo "$ME_RESPONSE" | jq '.' 2>/dev/null || echo "$ME_RESPONSE"
  fi
else
  echo -e "${RED}✗ No token available from login${NC}"
fi
echo ""

# Test 4: Refresh token
echo -e "${BLUE}Test 4: Refresh Access Token${NC}"
if [ -n "$REFRESH_TOKEN" ]; then
  REFRESH_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/refresh-token" \
    -H "$CONTENT_TYPE" \
    -d "{
      \"refreshToken\": \"$REFRESH_TOKEN\"
    }")

  if echo "$REFRESH_RESPONSE" | grep -q '"status":"success"'; then
    echo -e "${GREEN}✓ Token refreshed successfully${NC}"
    NEW_TOKEN=$(echo "$REFRESH_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
    echo "  New Access Token: ${NEW_TOKEN:0:20}..."
  else
    echo -e "${RED}✗ Token refresh failed${NC}"
    echo "$REFRESH_RESPONSE" | jq '.' 2>/dev/null || echo "$REFRESH_RESPONSE"
  fi
else
  echo -e "${RED}✗ No refresh token available${NC}"
fi
echo ""

# Test 5: Login with wrong password
echo -e "${BLUE}Test 5: Login with Wrong Password (Should Fail)${NC}"
WRONG_LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "$CONTENT_TYPE" \
  -d '{
    "email": "rahul@example.com",
    "password": "WrongPassword123"
  }')

if echo "$WRONG_LOGIN_RESPONSE" | grep -q '"status":"fail"\|"status":"error"'; then
  echo -e "${GREEN}✓ Correctly rejected wrong password${NC}"
else
  echo -e "${RED}✗ Should have rejected wrong password${NC}"
  echo "$WRONG_LOGIN_RESPONSE" | jq '.' 2>/dev/null || echo "$WRONG_LOGIN_RESPONSE"
fi
echo ""

# Test 6: Access protected route without token
echo -e "${BLUE}Test 6: Access Protected Route Without Token (Should Fail)${NC}"
NO_TOKEN_RESPONSE=$(curl -s -X GET "$BASE_URL/auth/me" \
  -H "$CONTENT_TYPE")

if echo "$NO_TOKEN_RESPONSE" | grep -q '"status":"fail"\|"status":"error"'; then
  echo -e "${GREEN}✓ Correctly rejected unauthorized access${NC}"
else
  echo -e "${RED}✗ Should have rejected unauthorized access${NC}"
  echo "$NO_TOKEN_RESPONSE" | jq '.' 2>/dev/null || echo "$NO_TOKEN_RESPONSE"
fi
echo ""

# Test 7: Forgot password
echo -e "${BLUE}Test 7: Forgot Password${NC}"
FORGOT_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/forgot-password" \
  -H "$CONTENT_TYPE" \
  -d '{
    "email": "rahul@example.com"
  }')

if echo "$FORGOT_RESPONSE" | grep -q '"status":"success"'; then
  echo -e "${GREEN}✓ Password reset initiated${NC}"
  RESET_TOKEN=$(echo "$FORGOT_RESPONSE" | grep -o '"resetToken":"[^"]*' | cut -d'"' -f4)
  if [ -n "$RESET_TOKEN" ]; then
    echo "  Reset Token: ${RESET_TOKEN:0:20}... (DEV MODE)"
  fi
else
  echo -e "${RED}✗ Forgot password failed${NC}"
  echo "$FORGOT_RESPONSE" | jq '.' 2>/dev/null || echo "$FORGOT_RESPONSE"
fi
echo ""

# Test 8: Update profile
echo -e "${BLUE}Test 8: Update User Profile${NC}"
if [ -n "$LOGIN_TOKEN" ]; then
  UPDATE_RESPONSE=$(curl -s -X PATCH "$BASE_URL/auth/me" \
    -H "$CONTENT_TYPE" \
    -H "Authorization: Bearer $LOGIN_TOKEN" \
    -d '{
      "preferences": {
        "language": "hi",
        "notifications": {
          "promotions": true
        }
      }
    }')

  if echo "$UPDATE_RESPONSE" | grep -q '"status":"success"'; then
    echo -e "${GREEN}✓ Profile updated successfully${NC}"
  else
    echo -e "${RED}✗ Profile update failed${NC}"
    echo "$UPDATE_RESPONSE" | jq '.' 2>/dev/null || echo "$UPDATE_RESPONSE"
  fi
else
  echo -e "${RED}✗ No token available${NC}"
fi
echo ""

# Test 9: Register with validation error
echo -e "${BLUE}Test 9: Register with Weak Password (Should Fail)${NC}"
WEAK_PASSWORD_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "$CONTENT_TYPE" \
  -d '{
    "name": {
      "first": "Invalid",
      "last": "User"
    },
    "email": "invalid@example.com",
    "password": "weak",
    "phone": "1234567890"
  }')

if echo "$WEAK_PASSWORD_RESPONSE" | grep -q '"status":"fail"'; then
  echo -e "${GREEN}✓ Correctly rejected weak password${NC}"
else
  echo -e "${RED}✗ Should have rejected weak password${NC}"
  echo "$WEAK_PASSWORD_RESPONSE" | jq '.' 2>/dev/null || echo "$WEAK_PASSWORD_RESPONSE"
fi
echo ""

# Test 10: Logout
echo -e "${BLUE}Test 10: Logout${NC}"
if [ -n "$LOGIN_TOKEN" ]; then
  LOGOUT_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/logout" \
    -H "$CONTENT_TYPE" \
    -H "Authorization: Bearer $LOGIN_TOKEN")

  if echo "$LOGOUT_RESPONSE" | grep -q '"status":"success"'; then
    echo -e "${GREEN}✓ Logout successful${NC}"
  else
    echo -e "${RED}✗ Logout failed${NC}"
    echo "$LOGOUT_RESPONSE" | jq '.' 2>/dev/null || echo "$LOGOUT_RESPONSE"
  fi
else
  echo -e "${RED}✗ No token available${NC}"
fi
echo ""

echo "===================================="
echo -e "${GREEN}✅ Authentication Tests Complete${NC}"
echo "===================================="
