# Deriv OAuth2 + OTP -> WebSocket Trading Flow

## Overview

This guide explains the new Deriv API flow for Options Trading using OAuth2 + OTP authentication:

1. **OAuth2 Login** - User authenticates with Deriv
2. **Get OTP** - Use access token to get One-Time Password URL  
3. **WebSocket Connection** - Connect to trading WebSocket with OTP authentication
4. **Trading** - Send proposal, buy, and contract subscription requests

Reference: https://developers.deriv.com/docs/

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  User Clicks "Login with Deriv" Button                      │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  OAuth2 PKCE Flow (with Deriv)                              │
│  - generateCodeVerifier() -> code                           │
│  - generateCodeChallenge(code) -> challenge                 │
│  - Redirect to auth.deriv.com with challenge               │
│  - User logs in, approves, gets authorization code         │
│  - POST to /api/auth/oauth-callback with code              │
│  - Exchange code for access_token (server-side)            │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼ access_token
┌─────────────────────────────────────────────────────────────┐
│  OTP Handler (derivOtpHandler)                              │
│  - GET /trading/v1/options/accounts/{accountId}/otp        │
│  - Headers: Authorization: Bearer {access_token}           │
│  - Response: { data: { url: "wss://...?otp=..." } }       │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼ otpUrl
┌─────────────────────────────────────────────────────────────┐
│  WebSocket Connection                                       │
│  - connectWithOtp(otpUrl)                                   │
│  - WebSocket automatically authenticated via OTP token     │
│  - Ready to send trading requests                          │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  Trading API Calls                                          │
│  - Send proposal request                                    │
│  - Send buy request                                         │
│  - Subscribe to contract updates                           │
│  - Handle live P&L updates                                 │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Details

### 1. OAuth2 + OTP Types (`deriv-otp-types.ts`)

Defines TypeScript interfaces for:
- `OtpResponse` - Response from OTP endpoint
- `ProposalMsg` - Proposal request/response
- `BuyMsg` - Buy request/confirmation
- `ProposalOpenContractMsg` - Live contract updates
- `ActiveSymbolsMsg`, `TickMsg` - Market data
- `ProposalRequest`, `BuyRequest` - Request types

### 2. OTP Handler (`deriv-otp-handler.ts`)

Manages the OAuth2 -> OTP flow:

```typescript
// Get OTP URL using access token
const otpUrl = await derivOtpHandler.getOtpUrl(accessToken, accountId)

// Validates all prerequisites
if (!derivOtpHandler.validateOtpPrerequisites(accessToken, accountId)) {
  throw new Error("Missing required auth data")
}
```

### 3. WebSocket Manager Updates

New method `connectWithOtp(otpUrl)`:

```typescript
// In your component or hook
const manager = DerivWebSocketManager.getInstance()
await manager.connectWithOtp(otpUrl)

// Now ready to send trading requests
manager.send({ proposal: 1, amount: 10, ... })
```

### 4. Auth Hook Integration

New `connectWithOauth` method in `useDerivAuth`:

```typescript
const { connectWithOauth, oauthAccessToken, accountId } = useDerivAuth()

// After OAuth login and getting account ID
await connectWithOauth(accessToken, accountId)
```

## Usage Example

### Basic Trading Flow

```typescript
import { useDerivAuth } from '@/hooks/use-deriv-auth'
import { DerivWebSocketManager } from '@/lib/deriv-websocket-manager'

export function MyTradingComponent() {
  const auth = useDerivAuth()
  const manager = DerivWebSocketManager.getInstance()

  // 1. User completes OAuth login
  // 2. Connect with OAuth2 + OTP
  const handleConnect = async () => {
    await auth.connectWithOauth(auth.oauthAccessToken, auth.accountId)
  }

  // 3. Get a proposal
  const handleProposal = () => {
    manager.send({
      proposal: 1,
      amount: 10,
      basis: 'stake',
      contract_type: 'CALL',
      currency: 'USD',
      duration: 5,
      duration_unit: 't',
      underlying_symbol: '1HZ100V',
      req_id: manager.getNextReqId()
    })
  }

  // 4. Buy the proposal
  const handleBuy = (proposalId: string, price: number) => {
    manager.send({
      buy: proposalId,
      price: price,
      req_id: manager.getNextReqId()
    })
  }

  // 5. Subscribe to contract updates
  const handleSubscribe = (contractId: number) => {
    manager.send({
      proposal_open_contract: 1,
      contract_id: contractId,
      subscribe: 1,
      req_id: manager.getNextReqId()
    })
  }

  return (
    <div>
      <button onClick={handleConnect}>Connect</button>
      <button onClick={handleProposal}>Get Proposal</button>
      {/* ... */}
    </div>
  )
}
```

### Message Handling

Listen to WebSocket messages:

```typescript
useEffect(() => {
  const handleMessage = (data: any) => {
    if (data.msg_type === 'proposal') {
      console.log('Got proposal:', data.proposal)
      // Store proposal ID to buy later
    }
    
    if (data.msg_type === 'buy') {
      console.log('Contract bought:', data.buy.contract_id)
      // Subscribe to contract updates
    }
    
    if (data.msg_type === 'proposal_open_contract') {
      console.log('Contract update:', {
        profit: data.proposal_open_contract.profit,
        bid: data.proposal_open_contract.bid_price
      })
    }
  }

  manager.on('message', handleMessage)
  return () => manager.off('message', handleMessage)
}, [manager])
```

## Key Differences from Old API

| Old API | New API (OAuth2 + OTP) |
|---------|----------------------|
| Direct API token | OAuth2 access token |
| Direct WebSocket connection | OTP-authenticated WebSocket |
| Single authorization | Two-step: OAuth2 + OTP |
| No refresh mechanism | OAuth2 token refresh available |
| Limited security | Bearer token + OTP |

## Deriv App Configuration

Your Deriv App ID (32KGABH3pjSMkQ6JTotTG) needs:

1. **OAuth Credentials Registered**
   - Client ID: 32EtOUHbr4zUOcHKwjgwj
   - Redirect URI: `{your-app}/api/auth/oauth-callback`

2. **Required Scopes**
   - `trade` - For trading operations

3. **Account Type**
   - Options Trading enabled (DOT account)

## Environment Variables

```bash
# In .env.local or Vercel Secrets
NEXT_PUBLIC_DERIV_APP_ID=32KGABH3pjSMkQ6JTotTG
DERIV_OAUTH_CLIENT_ID=32EtOUHbr4zUOcHKwjgwj
```

## Troubleshooting

### "Invalid redirect_uri"
- Make sure your callback URL is registered in Deriv OAuth settings
- Format: `https://yourdomain.com/api/auth/oauth-callback`

### "Invalid account ID"
- Account ID must be in format: `DOT90004580` or similar
- Get from OAuth response or user profile

### "OTP request failed"
- Check access token is still valid
- Verify account ID exists and is active
- Check app has trading permissions

### "WebSocket connection failed"
- OTP URL is time-limited (typically 5-10 minutes)
- Get fresh OTP URL if token expired
- Check network connectivity

## Testing

Use the provided `TradingExampleOAuth2` component:

```typescript
import { TradingExampleOAuth2 } from '@/components/trading-example-oauth2'

export default function Page() {
  return <TradingExampleOAuth2 />
}
```

This component demonstrates the complete flow with logging and UI controls.

## Next Steps

1. Register callback URL in Deriv OAuth settings
2. Test OAuth login flow
3. Test OTP generation
4. Test WebSocket connection
5. Test proposal/buy/subscribe flow
6. Monitor live P&L updates

## API Reference

For complete API documentation, see:
https://developers.deriv.com/docs/websocket/
https://developers.deriv.com/docs/trading/
