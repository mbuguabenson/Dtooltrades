# Legacy API Migration Complete

## Changes Made

### 1. Landing Page Removal
- **File**: `/app/page.tsx`
- **Change**: Replaced entire landing page with immediate redirect to dashboard
- **Result**: Users now go directly to the trading dashboard (with loading spinner)
- **Redirect Target**: Redirects to `/?dashboard=true` for immediate dashboard access

### 2. Legacy API Endpoints Restored
- **File**: `/lib/deriv-config.ts`
- **WebSocket Endpoint**: Changed from new API to legacy API
  - **Old**: `wss://api.derivws.com/trading/v1/options/ws/public`
  - **New**: `wss://legacy-api.deriv.com/websockets/v3`
- **REST Endpoint**: 
  - **Old**: `https://api.derivws.com`
  - **New**: `https://legacy-api.deriv.com`

### 3. App ID Updated
- **File**: `/lib/deriv-config.ts` and `/lib/trading/config.ts`
- **Old App ID**: `32KGABH3pjSMkQ6JTotTG`
- **New App ID**: `113831`
- **Applied To**:
  - Main DERIV_APP_ID constant
  - Trading config defaults
  - WebSocket connection strings via query parameter

### 4. Implementation Details

#### WebSocket Manager
- Files affected: `lib/deriv-websocket-manager.ts` and `lib/chart-websocket-manager.ts`
- Both managers use `DERIV_API.WEBSOCKET` which now points to legacy endpoint
- App ID injected via URL parameter: `?app_id=113831&l=en&brand=deriv`

#### OAuth Configuration
- OAuth endpoints remain at `auth.deriv.com`
- Token exchange uses local backend at `/api/auth/deriv-token`
- State and PKCE verifier validation remains intact

#### Legacy API Reference
- Documentation: https://legacy-docs.deriv.com/docs/getting-started
- V3 WebSocket Protocol maintained
- Compatible with all existing trading signals and analysis tools

## Files Modified
1. `/app/page.tsx` - Landing page → Dashboard redirect
2. `/lib/deriv-config.ts` - API endpoints and app ID
3. `/lib/trading/config.ts` - Trading config defaults

## Files Using These Settings (No changes needed)
- `/lib/deriv-websocket-manager.ts` - Uses DERIV_API.WEBSOCKET
- `/lib/chart-websocket-manager.ts` - Uses DERIV_API.WEBSOCKET
- `/hooks/use-deriv-auth.ts` - Uses DERIV_CONFIG and DERIV_API
- All trading tabs and components - Use centralized config

## Testing Checklist
- [ ] Direct landing page access redirects to dashboard
- [ ] WebSocket connects to legacy API endpoint
- [ ] App ID 113831 is sent with all connections
- [ ] OAuth login flow works (still uses auth.deriv.com)
- [ ] All trading signals and data streams function normally
- [ ] Market selection and symbol data load correctly

## Legacy API Features
The legacy API (v3) maintains full support for:
- Real-time tick data streaming
- Synthetic indices (R_100, JUMP10, etc.)
- Trade execution
- Account information
- Balance queries
- Historical data retrieval
