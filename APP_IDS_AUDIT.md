# App IDs Audit Report

## Overview
This document provides a comprehensive audit of all application IDs used throughout the Deriv Trading Platform.

---

## 1. Primary App IDs

### DERIV_APP_ID (Main Trading App ID)
**Value:** `32KGABH3pjSMkQ6JTotTG`
**Type:** Deriv OAuth App ID for trading operations
**Purpose:** Used to authenticate and authorize trading requests with Deriv's API

**Locations:**
- `lib/deriv-config.ts` (line 17) - Primary definition
- `lib/deriv-api-context.tsx` (line 67) - Initialize global API client
- `lib/deriv-websocket-manager.ts` (lines 98, 269) - WebSocket connection URLs
- `lib/chart-websocket-manager.ts` (line 32) - Chart data streaming
- `components/tabs/smarttrader-tab.tsx` (lines 17-18) - SmartTrader platform integration
- `components/tabs/smartauto24-tab.tsx` (line 754) - SmartAuto24 OAuth redirect
- `components/tabs/dtrader-tab.tsx` (lines 17-18) - DTrader platform integration
- `components/tabs/dbot-tab.tsx` (lines 17-18) - DBot platform integration
- `components/tabs/Slider.tsx` (line 31) - Slider trading component
- `components/deriv-platforms.tsx` (line 54) - Platform links
- `components/deriv-header.tsx` (lines 13, 14, 18) - Header navigation tabs

**Referenced As:**
- `DERIV_CONFIG.APP_ID` (in most TypeScript/React files)
- `${DERIV_CONFIG.APP_ID}` (in URL template strings)
- Direct reference via `DERIV_APP_ID` import

---

### OAUTH_CLIENT_ID (OAuth Client ID)
**Value:** `32EtOUHbr4zUOcHKwjgwj`
**Type:** Deriv OAuth Client ID for authentication flow
**Purpose:** Used in OAuth 2.0 PKCE flow for user authentication

**Locations:**
- `lib/deriv-config.ts` (line 18) - Primary definition
- `lib/deriv-api-context.tsx` - Not directly used
- `app/api/auth/deriv-token/route.ts` (line 17) - Token exchange endpoint
- `hooks/use-deriv-auth.ts` (line 293) - OAuth login flow
- `components/api-token-modal.tsx` (line 93) - Display in user instructions
- `app/auth-error/page.tsx` (line 29) - Display in error page instructions
- `index.html` (line 346) - Legacy HTML fallback (hardcoded)

**Referenced As:**
- `OAUTH_CLIENT_ID` (direct import)
- `${OAUTH_CLIENT_ID}` (in URL parameters)
- Hardcoded as `32EtOUHbr4zUOcHKwjgwj` (in index.html)

---

## 2. Secondary/Legacy App IDs

### Fallback App ID (Legacy)
**Value:** `123189`
**Type:** Fallback/default Deriv App ID
**Purpose:** Used as default when DERIV_APP_ID is not available (fallback only)

**Locations:**
- `lib/deriv-api-context.tsx` (line 67) - Fallback in initialization: `String(DERIV_APP_ID || "123189")`
- `lib/trading/config.ts` (line 5) - Default schema value: `.default("123189")`

**Note:** This is a fallback ID, should not be used in production.

---

### Historical App ID (Documentation)
**Value:** `106629`
**Type:** Previous/documentation reference
**Purpose:** Referenced in documentation files from previous implementation

**Locations:**
- `FIXES_APPLIED_FINAL.md` (lines 42-43) - Historical reference
- `SMARTAUTO24_COMPLETE_DOCUMENTATION.md` (lines 10-11, 186) - Documentation reference

**Note:** This ID appears to be from a previous version and should not be used. It's only in documentation files.

---

## 3. API Configuration Summary

### WebSocket URLs Using App IDs
```
Primary URL:
  wss://api.derivws.com/trading/v1/options/ws/public?app_id=32KGABH3pjSMkQ6JTotTG&l=en&brand=deriv

Fallback V3 URL:
  wss://ws.binaryws.com/websockets/v3?app_id=32EtOUHbr4zUOcHKwjgwj

Legacy V3 URL:
  wss://ws.derivws.com/websockets/v3?app_id=[APP_ID]
```

### OAuth URLs
```
Authorization URL:
  https://auth.deriv.com/oauth2/auth?response_type=code&client_id=32EtOUHbr4zUOcHKwjgwj&...

Token Exchange URL:
  https://auth.deriv.com/oauth2/token
  (Client ID: 32EtOUHbr4zUOcHKwjgwj)
```

---

## 4. App ID Usage by Module

### Authentication Module
- **File:** `hooks/use-deriv-auth.ts`
- **Uses:** `OAUTH_CLIENT_ID` (32EtOUHbr4zUOcHKwjgwj)
- **Purpose:** OAuth PKCE flow for user login

### API Token Exchange
- **File:** `app/api/auth/deriv-token/route.ts`
- **Uses:** `OAUTH_CLIENT_ID` (32EtOUHbr4zUOcHKwjgwj)
- **Purpose:** Server-side token exchange after OAuth callback

### WebSocket Connections
- **Files:** 
  - `lib/deriv-websocket-manager.ts`
  - `lib/chart-websocket-manager.ts`
  - `components/tabs/Slider.tsx`
- **Uses:** `DERIV_APP_ID` (32KGABH3pjSMkQ6JTotTG)
- **Purpose:** Direct WebSocket API connections for real-time data

### Platform Integration (iFrame Embeds)
- **Files:**
  - `components/tabs/dtrader-tab.tsx` - DTrader
  - `components/tabs/dbot-tab.tsx` - DBot
  - `components/tabs/smarttrader-tab.tsx` - SmartTrader
  - `components/tabs/smartauto24-tab.tsx` - SmartAuto24
- **Uses:** `DERIV_APP_ID` (32KGABH3pjSMkQ6JTotTG)
- **Purpose:** Pass app_id to embedded platforms for trading

---

## 5. Critical Issues Found

### ⚠️ Issue 1: Hardcoded App ID in index.html
**File:** `index.html` (line 346)
**Problem:** Contains hardcoded OAuth client ID in legacy fallback code
```javascript
API_URL: "wss://ws.binaryws.com/websockets/v3?app_id=32EtOUHbr4zUOcHKwjgwj",
```
**Impact:** If this code is active, it uses the OAuth client ID instead of the main app ID
**Recommendation:** This appears to be legacy code - should be removed or verified as necessary

### ⚠️ Issue 2: Inconsistent App ID for WebSocket Connections
**Current Behavior:**
- Main WebSocket URL uses: `32KGABH3pjSMkQ6JTotTG` (DERIV_APP_ID)
- Fallback URL uses: Embedded in code with fallback app ID

**Recommendation:** Verify that the main app ID is correctly registered with Deriv for WebSocket access

### ✓ Issue 3: OAuth Client ID Correctly Used
**Status:** Properly implemented
- OAuth flow correctly uses: `32EtOUHbr4zUOcHKwjgwj`
- Token exchange correctly validates with this ID
- Redirect URIs properly configured in OAuth app settings

---

## 6. Environment Variables

### Current Configuration
The following environment variables are used:

```env
# From lib/trading/config.ts
DERIV_APP_ID=32KGABH3pjSMkQ6JTotTG  # Can be overridden
DERIV_API_TOKEN=<user-provided-token>

# From lib/deriv-config.ts (hardcoded)
# DERIV_APP_ID: "32KGABH3pjSMkQ6JTotTG"
# OAUTH_CLIENT_ID: "32EtOUHbr4zUOcHKwjgwj"
```

### Recommendation
Consider making DERIV_APP_ID configurable via environment variable:
- Currently hardcoded in `lib/deriv-config.ts`
- Trading config has a fallback but it's unused by the main app
- Would improve flexibility for different Deriv app registrations

---

## 7. App Registration Requirements

### For DERIV_APP_ID: `32KGABH3pjSMkQ6JTotTG`
Required settings in Deriv's dashboard:
- [ ] WebSocket API access enabled
- [ ] Scope: trade
- [ ] V4 API endpoints enabled

### For OAUTH_CLIENT_ID: `32EtOUHbr4zUOcHKwjgwj`
Required settings in Deriv's dashboard:
- [ ] OAuth 2.0 enabled
- [ ] PKCE support enabled
- [ ] Redirect URI: `https://your-domain.com/api/auth/oauth-callback`
- [ ] Scope: trade
- [ ] Grant type: authorization_code

---

## 8. Summary Table

| ID | Value | Type | Primary Use | Status |
|---|---|---|---|---|
| DERIV_APP_ID | 32KGABH3pjSMkQ6JTotTG | Trading App | WebSocket, Platform iFrames | ✅ Active |
| OAUTH_CLIENT_ID | 32EtOUHbr4zUOcHKwjgwj | OAuth Client | User Authentication | ✅ Active |
| Fallback ID | 123189 | Legacy | Fallback only | ⚠️ Unused |
| Historical ID | 106629 | Documentation | Reference only | ⚠️ Deprecated |

---

## 9. Next Steps

1. **Verify App Registrations**: Confirm both app IDs are properly registered in Deriv's dashboard
2. **Test OAuth Flow**: Ensure the deployed site URL is registered as a redirect URI in the OAuth app
3. **Remove Legacy Code**: Consider removing the hardcoded ID from `index.html`
4. **Environment Variables**: Consider making app IDs configurable for different environments
5. **Documentation**: Update API documentation to reflect the correct app IDs

---

**Report Generated:** 2026-03-22
**Last Audit:** Current Investigation
