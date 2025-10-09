#!/bin/bash

# Shard Flip Backend Data Viewer
# Usage: ./check-backend.sh [option]

API_URL="http://localhost:3001/api"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}╔════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   SHARD FLIP BACKEND DATA VIEWER          ║${NC}"
echo -e "${CYAN}╔════════════════════════════════════════════╗${NC}"
echo ""

# Function to pretty print JSON
pretty_print() {
    if command -v jq &> /dev/null; then
        echo "$1" | jq .
    elif command -v python3 &> /dev/null; then
        echo "$1" | python3 -m json.tool
    else
        echo "$1"
    fi
}

# 1. Platform Statistics
echo -e "${BLUE}📊 PLATFORM STATISTICS${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
stats=$(curl -s "$API_URL/stats")
pretty_print "$stats"
echo ""

# 2. All Users
echo -e "${BLUE}👥 ALL REGISTERED USERS${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
users=$(curl -s "$API_URL/users?limit=100")
pretty_print "$users"
echo ""

# 3. Leaderboard - Wins
echo -e "${BLUE}🏆 LEADERBOARD - TOP WINS${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
leaderboard_wins=$(curl -s "$API_URL/leaderboard?type=wins&limit=10")
pretty_print "$leaderboard_wins"
echo ""

# 4. Leaderboard - Winnings
echo -e "${BLUE}💰 LEADERBOARD - TOP WINNINGS${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
leaderboard_winnings=$(curl -s "$API_URL/leaderboard?type=winnings&limit=10")
pretty_print "$leaderboard_winnings"
echo ""

# 5. Health Check
echo -e "${BLUE}❤️  BACKEND HEALTH${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
health=$(curl -s "$API_URL/health")
pretty_print "$health"
echo ""

echo -e "${GREEN}✅ Data fetch complete!${NC}"
echo ""
echo "Available commands:"
echo "  ./check-backend.sh              - View all data"
echo "  curl $API_URL/stats              - Platform stats only"
echo "  curl $API_URL/users              - All users"
echo "  curl $API_URL/user/WALLET_ADDRESS - Specific user"
echo "  curl $API_URL/leaderboard        - Leaderboard"