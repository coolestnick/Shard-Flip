# Shard Flip API Documentation

Backend API for the Shard Flip gaming dApp with MongoDB integration.

## Environment Setup

1. Create `.env` file in the `/api` directory:
```bash
MONGODB_URI=your_mongodb_connection_string
API_SECRET_KEY=your_super_secret_key_here
FRONTEND_URL=https://shard-flip.vercel.app
```

## API Endpoints

### POST Routes (Protected - Require API Key)

#### Register Wallet
- **URL:** `POST /api/register-wallet`
- **Headers:** `x-api-key: your_secret_key`
- **Body:** 
```json
{
  "walletAddress": "0x1234567890abcdef..."
}
```

#### Update Game Result
- **URL:** `POST /api/update-game`  
- **Headers:** `x-api-key: your_secret_key`
- **Body:**
```json
{
  "walletAddress": "0x1234567890abcdef...",
  "gameResult": "win|loss",
  "amountWagered": 1.5,
  "amountWon": 3.0
}
```

### GET Routes (Public)

#### Get All Users
- **URL:** `GET /api/users?page=1&limit=50&sortBy=registeredAt&order=desc`
- **Response:** Paginated list of all users

#### Get User by Wallet
- **URL:** `GET /api/user/{walletAddress}`
- **Response:** Single user details

#### Get Leaderboard  
- **URL:** `GET /api/leaderboard?type=wins&limit=20`
- **Types:** `wins`, `games`, `winnings`
- **Response:** Top players ranked by selected metric

#### Get Platform Statistics
- **URL:** `GET /api/stats`
- **Response:** Overall platform statistics

#### Health Check
- **URL:** `GET /api/health`
- **Response:** API status

## Deployment Steps

1. **Install dependencies:**
```bash
cd api && npm install
```

2. **Set environment variables in Vercel:**
   - `MONGODB_URI`: Your MongoDB connection string
   - `API_SECRET_KEY`: Generate a secure random key
   - `FRONTEND_URL`: Your frontend domain

3. **Deploy to Vercel:**
```bash
vercel --prod
```

## Local Development

```bash
cd api
npm install
npm run dev
```

Server runs on `http://localhost:3001`