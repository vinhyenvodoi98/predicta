# Yellow Network Backend Implementation

## Overview

This is a **production-ready, security-first** backend implementation for integrating Yellow Network's state channel technology into a prediction market application.

## Architecture

```
┌─────────────┐
│   User      │ (signs transactions client-side)
└─────┬───────┘
      │
      ▼
┌─────────────────────────────────────────────────────┐
│              Next.js Backend (this)                 │
│                                                     │
│  ┌──────────────┐  ┌─────────────┐  ┌───────────┐ │
│  │  Channel     │  │  Balance    │  │  Session  │ │
│  │  Manager     │  │  Manager    │  │  Manager  │ │
│  └──────────────┘  └─────────────┘  └───────────┘ │
│                                                     │
│  ┌──────────────┐  ┌─────────────────────────────┐ │
│  │  Session Key │  │  App Session Manager        │ │
│  │  Manager     │  │  (Prediction Markets)       │ │
│  └──────────────┘  └─────────────────────────────┘ │
└─────────────┬───────────────────────────────────────┘
              │
              ▼
        ┌─────────────┐
        │  Nitro Node │
        │  (Clearnode)│
        └─────────────┘
              │
              ▼
        ┌─────────────┐
        │  Blockchain │
        │  (Sepolia)  │
        └─────────────┘
```

## Core Principles

### 🔒 Security First

1. **Backend NEVER stores or uses private keys**
2. **Backend NEVER signs transactions on behalf of users**
3. All signatures provided by client
4. Backend validates, coordinates, and relays
5. All state transitions require explicit user authorization

### 📊 State Channel Architecture

#### Balance Channels (User ↔ Clearnode)
- Funded on-chain
- Operated off-chain
- User's total liquidity across all chains
- Managed by `ChannelManager`

#### App Sessions (Prediction Markets)
- Off-chain state channels
- Each market = one app session
- State transitions: OPERATE → LOCK → RESOLVE → FINALIZE
- Managed by `AppSessionManager`

## Project Structure

```
src/
├── lib/yellow/
│   ├── types.ts       # TypeScript definitions
│   ├── client.ts      # Nitro RPC client wrapper
│   ├── channels.ts    # Balance channel management
│   ├── balance.ts     # Unified balance aggregation
│   ├── security.ts    # Session key verification
│   └── sessions.ts    # App session management
│
└── app/api/yellow/
    ├── channel/
    │   ├── status/route.ts    # GET channel status
    │   └── init/route.ts      # POST prepare channel init
    ├── balance/route.ts       # GET unified balance
    └── market/
        ├── create/route.ts    # POST create market
        ├── bet/route.ts       # POST place bet
        ├── lock/route.ts      # POST lock market
        └── resolve/route.ts   # POST resolve market
```

## Components

### 1. Nitro Client (`client.ts`)

Wraps WebSocket communication with the Nitro node (clearnode).

**Key Methods:**
- `connect()` - Connect to Nitro node
- `getChannel(channelId)` - Query channel state
- `getChannelsByParticipant(address)` - Get all user channels
- `proposeChannel(params)` - Propose new channel (user signs)
- `updateChannel(params)` - Update channel state (user signs)
- `closeChannel(params)` - Close channel (user signs)

**Configuration:**
```typescript
// .env.local
CLEARNODE_WS_URL=wss://clearnet-sandbox.yellow.com/ws
CLEARNODE_ADDRESS=0x...
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/...
SEPOLIA_ADJUDICATOR=0x...
```

### 2. Channel Manager (`channels.ts`)

Manages balance channels between users and clearnode.

**Key Methods:**
- `hasActiveChannel(user, chainId)` - Check if channel exists
- `getChannelStatus(user, chainId?)` - Get channel info
- `prepareChannelInit(user, chainId, token, amount)` - Prepare init TX
- `syncChannelState(channelId)` - Sync with Nitro node
- `updateChannelBalance(channelId, newBalances, signature)` - Update balance

**Security:**
- Backend NEVER creates channels autonomously
- Only prepares transaction data for user to sign
- Validates conservation of funds on every update

### 3. Balance Manager (`balance.ts`)

Calculates unified balance across all chains.

**Key Methods:**
- `getUnifiedBalance(user)` - Total balance across all chains
- `getBalanceOnChain(user, chainId)` - Balance on specific chain
- `hasSufficientBalance(user, amount, chainId?)` - Validate balance
- `reserveBalance(user, amount, purpose)` - Create reservation
- `verifyAllocations(allocations)` - Ensure no overspending

**Unified Balance:**
```typescript
{
  user: "0x...",
  total: "1000000000000000000", // 1 ETH across all chains
  breakdown: [
    {
      chainId: 11155111, // Sepolia
      token: "0x0000...",
      tokenSymbol: "ETH",
      amount: "500000000000000000", // 0.5 ETH
      channelId: "0x...",
      status: "OPEN"
    },
    // ... more chains
  ]
}
```

### 4. Session Key Manager (`security.ts`)

Manages session keys for limited operations without main wallet.

**Session Key Properties:**
- `address` - Session key public address
- `owner` - Main wallet that authorized it
- `expiry` - Unix timestamp
- `spendingLimit` - Maximum amount
- `scope` - Allowed operations (BET, WITHDRAW, RESOLVE, ADMIN)
- `signature` - Owner's authorization signature

**Key Methods:**
- `registerSessionKey(...)` - Register new session key
- `verifySessionKey(sessionKey, scope, amount, signature)` - Verify operation
- `consumeLimit(sessionKey, amount)` - Track spending
- `revokeSessionKey(sessionKey, ownerSignature)` - Revoke key

**Security:**
- Session keys created client-side
- Backend only verifies and tracks usage
- Enforces expiry, limits, and scope
- Rate limiting included

### 5. App Session Manager (`sessions.ts`)

Manages prediction market sessions (app sessions).

**State Flow:**
```
OPERATE → LOCK → RESOLVE → FINALIZE
   ↓        ↓        ↓         ↓
 Bets    No more   Oracle    Payouts
 open     bets    decides    released
```

**Key Methods:**
- `createMarket(...)` - Initialize new market
- `placeBet(user, sessionId, option, amount, signature)` - Place bet
- `lockMarket(sessionId, signature)` - Lock betting
- `resolveMarket(sessionId, outcome, oracleSignature)` - Set winner
- `finalizeMarket(sessionId)` - Release payouts

**Invariants Enforced:**
1. Version strictly increases
2. Allocations never exceed unified balance
3. Only oracle can RESOLVE
4. No bets after LOCK
5. Dispute window respected
6. Conservation of funds

## API Endpoints

### Channel Management

#### GET `/api/yellow/channel/status`
Get channel status for a user.

**Query Params:**
- `user` - User address (required)
- `chainId` - Filter by chain (optional)

**Response:**
```json
{
  "channels": [
    {
      "channelId": "0x...",
      "chainId": 11155111,
      "participants": ["0xuser...", "0xclearnode..."],
      "balances": ["1000000000000000000", "0"],
      "status": "OPEN"
    }
  ],
  "hasActiveChannel": true
}
```

#### POST `/api/yellow/channel/init`
Prepare channel initialization (user must sign and submit).

**Request Body:**
```json
{
  "user": "0x...",
  "chainId": 11155111,
  "token": "0x0000000000000000000000000000000000000000",
  "amount": "1000000000000000000"
}
```

**Response:**
```json
{
  "initData": {
    "participants": ["0xuser...", "0xclearnode..."],
    "adjudicator": "0x...",
    "challengePeriod": 86400,
    "token": "0x...",
    "initialDeposit": "1000000000000000000",
    "nonce": "123456789",
    "chainId": 11155111
  },
  "txData": {
    "to": "0x...",
    "data": "0x...",
    "value": "1000000000000000000"
  }
}
```

### Balance

#### GET `/api/yellow/balance`
Get unified balance across all chains.

**Query Params:**
- `user` - User address (required)

**Response:**
```json
{
  "unifiedBalance": {
    "user": "0x...",
    "total": "1000000000000000000",
    "breakdown": [
      {
        "chainId": 11155111,
        "token": "0x...",
        "tokenSymbol": "ETH",
        "amount": "1000000000000000000",
        "channelId": "0x...",
        "status": "OPEN"
      }
    ],
    "lastUpdated": 1234567890
  }
}
```

### Market Operations

#### POST `/api/yellow/market/create`
Create new prediction market.

**Request Body:**
```json
{
  "creator": "0x...",
  "question": "Will BTC reach $100k by 2025?",
  "options": ["Yes", "No"],
  "lockTime": 1735689600,
  "resolveTime": 1735776000,
  "oracleAddress": "0x...",
  "sessionKeySignature": "0x..."
}
```

**Response:**
```json
{
  "sessionId": "session_0x..._1234567890",
  "marketId": "0x..."
}
```

#### POST `/api/yellow/market/bet`
Place bet in market.

**Request Body:**
```json
{
  "user": "0x...",
  "sessionId": "session_0x..._1234567890",
  "option": 0,
  "amount": "100000000000000000",
  "sessionKeySignature": "0x..."
}
```

**Response:**
```json
{
  "success": true,
  "newVersion": "5",
  "allocation": {
    "participant": "0x...",
    "amount": "100000000000000000"
  }
}
```

#### POST `/api/yellow/market/lock`
Lock market (no more bets).

**Request Body:**
```json
{
  "sessionId": "session_0x..._1234567890",
  "signature": "0x..."
}
```

**Response:**
```json
{
  "success": true,
  "lockedAt": 1234567890
}
```

#### POST `/api/yellow/market/resolve`
Resolve market with outcome.

**Request Body:**
```json
{
  "sessionId": "session_0x..._1234567890",
  "outcome": 0,
  "oracleSignature": "0x..."
}
```

**Response:**
```json
{
  "success": true,
  "outcome": 0,
  "payouts": [
    {
      "participant": "0x...",
      "amount": "190000000000000000"
    }
  ]
}
```

## Usage Example

### Frontend Flow

```typescript
// 1. Check if user has balance channel
const channelStatus = await fetch(
  `/api/yellow/channel/status?user=${userAddress}`
).then(r => r.json());

if (!channelStatus.hasActiveChannel) {
  // 2. Prepare channel init
  const initData = await fetch('/api/yellow/channel/init', {
    method: 'POST',
    body: JSON.stringify({
      user: userAddress,
      chainId: 11155111,
      token: '0x0000000000000000000000000000000000000000',
      amount: '1000000000000000000'
    })
  }).then(r => r.json());

  // 3. User signs and submits transaction (using wagmi/viem)
  const hash = await walletClient.sendTransaction({
    to: initData.txData.to,
    data: initData.txData.data,
    value: BigInt(initData.txData.value)
  });

  await waitForTransaction({ hash });
}

// 4. Get unified balance
const balance = await fetch(
  `/api/yellow/balance?user=${userAddress}`
).then(r => r.json());

console.log('Total balance:', balance.unifiedBalance.total);

// 5. Create session key (client-side)
const sessionKeyPair = generateKeyPair(); // Your implementation
const authMessage = buildSessionKeyAuthMessage({
  sessionKey: sessionKeyPair.address,
  owner: userAddress,
  expiry: Date.now() / 1000 + 86400, // 24 hours
  spendingLimit: parseEther('1'),
  scope: ['BET']
});
const authSignature = await walletClient.signMessage({
  message: authMessage
});

// 6. Create market
const market = await fetch('/api/yellow/market/create', {
  method: 'POST',
  body: JSON.stringify({
    creator: userAddress,
    question: 'Will ETH reach $5k?',
    options: ['Yes', 'No'],
    lockTime: Math.floor(Date.now() / 1000) + 86400,
    resolveTime: Math.floor(Date.now() / 1000) + 172800,
    oracleAddress: oracleAddress,
    sessionKeySignature: authSignature
  })
}).then(r => r.json());

// 7. Place bet using session key
const betSignature = await sessionKeyWallet.signMessage({
  message: buildBetMessage(...)
});

const bet = await fetch('/api/yellow/market/bet', {
  method: 'POST',
  body: JSON.stringify({
    user: userAddress,
    sessionId: market.sessionId,
    option: 0,
    amount: '100000000000000000',
    sessionKeySignature: betSignature
  })
}).then(r => r.json());

console.log('Bet placed! New version:', bet.newVersion);
```

## Security Considerations

### ✅ What Backend DOES

- Validates session keys and signatures
- Tracks channel state
- Calculates unified balance
- Coordinates state transitions
- Enforces invariants (conservation, limits, etc.)
- Relays signed messages to Nitro node

### ❌ What Backend NEVER DOES

- Store private keys
- Sign transactions
- Create channels without user authorization
- Move funds autonomously
- Modify user balances without signatures

### 🔐 Key Security Features

1. **Session Keys**: Limited lifetime, spending limits, scoped permissions
2. **Signature Verification**: All operations require valid signatures
3. **Balance Invariants**: Sum of allocations never exceeds available balance
4. **Version Monotonicity**: State versions strictly increase
5. **Role-Based Access**: Only oracle can resolve, only users can bet
6. **Rate Limiting**: Prevents abuse of session keys

## Production Deployment

### Environment Variables

```bash
# Clearnode configuration
CLEARNODE_WS_URL=wss://clearnet.yellow.com/ws
CLEARNODE_ADDRESS=0x...

# Sepolia configuration
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
SEPOLIA_ADJUDICATOR=0x...

# WalletConnect (for frontend)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

### Database Migration

Current implementation uses in-memory storage. For production:

1. **Replace ChannelStore** with PostgreSQL:
   ```sql
   CREATE TABLE channels (
     channel_id VARCHAR(66) PRIMARY KEY,
     chain_id INTEGER NOT NULL,
     user_address VARCHAR(42) NOT NULL,
     clearnode_address VARCHAR(42) NOT NULL,
     token_address VARCHAR(42) NOT NULL,
     user_balance NUMERIC(78, 0) NOT NULL,
     clearnode_balance NUMERIC(78, 0) NOT NULL,
     version BIGINT NOT NULL,
     status VARCHAR(20) NOT NULL,
     created_at TIMESTAMP NOT NULL,
     updated_at TIMESTAMP NOT NULL,
     INDEX idx_user_chain (user_address, chain_id),
     INDEX idx_status (status)
   );
   ```

2. **Replace AppSessionStore** with PostgreSQL:
   ```sql
   CREATE TABLE app_sessions (
     session_id VARCHAR(100) PRIMARY KEY,
     market_id VARCHAR(66) NOT NULL,
     intent VARCHAR(20) NOT NULL,
     version BIGINT NOT NULL,
     market_state JSONB NOT NULL,
     allocations JSONB NOT NULL,
     created_at TIMESTAMP NOT NULL,
     updated_at TIMESTAMP NOT NULL,
     locked_at TIMESTAMP,
     resolved_at TIMESTAMP,
     finalized_at TIMESTAMP,
     INDEX idx_market_id (market_id),
     INDEX idx_intent (intent)
   );
   ```

3. **Use Redis** for SessionKeyStore (with TTL support)

### Monitoring

Add monitoring for:
- Channel creation rate
- Bet volume
- Session key usage
- State transition errors
- Balance discrepancies

### Event Listeners

Implement event listeners for on-chain channel events:
- `ChannelCreated` - Mark channel as funded
- `ChannelUpdated` - Sync state
- `ChannelClosed` - Update status
- `ChallengeStarted` - Alert system

## Testing

```bash
# Run type checks
pnpm tsc --noEmit

# Test API endpoints
curl http://localhost:3000/api/yellow/channel/status?user=0x...
curl -X POST http://localhost:3000/api/yellow/market/create \
  -H "Content-Type: application/json" \
  -d '{"creator":"0x...","question":"Test?","options":["Yes","No"],...}'
```

## Future Enhancements

1. **Multi-Token Support**: Add USD stablecoins, other ERC20s
2. **Cross-Chain Routing**: Optimize allocations across chains
3. **Dispute Resolution**: Implement challenge/response protocol
4. **Market Maker Integration**: Auto-liquidity provision
5. **Advanced Market Types**: Categorical, scalar, combinatorial
6. **Analytics**: Historical data, user statistics

## References

- [Yellow Network Documentation](https://docs.yellow.com)
- [Nitro Protocol](https://docs.statechannels.org/)
- [State Channels Whitepaper](https://statechannels.org)

## License

This is example code for educational purposes. Adapt as needed for your production use case.

## Support

For issues or questions about this implementation, refer to the inline documentation in each file.
