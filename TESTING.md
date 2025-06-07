# 🧪 Backbot Testing Guide

This guide will help you thoroughly test your Backbot trading system using the comprehensive test suite.

## 🚀 Quick Start

Run all tests:

```bash
npm test
```

Run specific test suites:

```bash
npm run test:offline    # Logic tests (no API required)
npm run test:connection # API connectivity tests
npm run test:strategy   # Trading strategy tests
npm run test:system     # Integration tests
```

## 📋 Test Suites

### 1. Offline Tests (`test:offline`)

- **No API required** - Safe to run anytime
- Tests mathematical indicators (SMA, EMA, Bollinger Bands)
- Tests risk calculations and trading logic
- Tests trend analysis algorithms

### 2. Connection Tests (`test:connection`)

- Tests API connectivity to Backpack Exchange
- Validates environment variables
- Tests public API endpoints (markets, system status)
- Tests authenticated API access

### 3. Strategy Tests (`test:strategy`)

- Tests strategy factory and initialization
- Tests BBEMA Volume Farmer strategy
- Tests custom configuration handling
- Tests strategy analysis with mock data

### 4. System Integration Tests (`test:system`)

- Tests integration between components
- Tests account controller and order controller
- Tests risk manager validation
- Tests environment configuration
- **Warning check**: Alerts if running in LIVE mode

## 🔧 Prerequisites

### Environment Setup

Before testing, you need to set up your environment:

1. **Create `.env` file:**

   ```bash
   cp .env.template .env
   ```

   Then edit `.env` with your actual Backpack Exchange API credentials.

2. **Required Environment Variables:**

   - `PRIVATE_KEY` - Your Backpack Exchange private key
   - `PUBLIC_KEY` - Your Backpack Exchange public key
   - `API_URL` - Backpack API URL (usually https://api.backpack.exchange)
   - `LIMIT_ORDER` - Minimum order size in USD (e.g., 100)
   - `SIMULATION_MODE` - MUST be `true` for testing!

3. **Install Dependencies:**

   ```bash
   npm install
   ```

4. **Build TypeScript:**

   ```bash
   npm run build
   ```

5. **Verify `SIMULATION_MODE=true`** - This is critical for safe testing!

## 📋 Testing Steps

### Step 1: Environment & System Test

```bash
npm test
```

This comprehensive test checks:

- ✅ Environment variables
- ✅ API connectivity
- ✅ Authentication
- ✅ Account data access
- ✅ Market data feeds
- ✅ Controllers functionality
- ✅ Trading logic
- ✅ Simulation mode status

**Expected Result:** All tests should pass ✅

### Step 2: Connection Test

```bash
npm run test:connection
```

Quick test to verify:

- ✅ API server connectivity
- ✅ Authentication credentials
- ✅ Basic account access

### Step 3: Dry Run Test

```bash
npm run test:dry
```

Simulates the actual trading logic:

- 📊 Analyzes real market data
- 🤖 Shows trading decisions
- 💰 Calculates position sizes
- 🎯 Displays entry/exit points
- ⚖️ Shows risk/reward ratios
- **Does NOT place any orders**

### Step 4: Manual Verification

Check these manually:

#### Account Settings ✅

- [ ] Leverage limit is appropriate
- [ ] Available capital is sufficient
- [ ] Trading fees are acceptable
- [ ] Risk per trade is reasonable

#### Market Data ✅

- [ ] Market prices are updating
- [ ] Candlestick data is recent
- [ ] Technical indicators calculate correctly

#### Trading Logic ✅

- [ ] MA/EMA crossover signals make sense
- [ ] Support/resistance levels are reasonable
- [ ] Position sizing is appropriate
- [ ] Stop losses are set correctly

## 🛡️ Safety Checklist

Before running live:

### Environment ✅

- [ ] `SIMULATION_MODE=true` (for testing)
- [ ] `LIMIT_ORDER` set to reasonable number (start with 1)
- [ ] Valid API credentials
- [ ] Sufficient account balance

### Risk Management ✅

- [ ] Position size is reasonable (recommended: < 2% per trade)
- [ ] Stop losses are configured
- [ ] Maximum open orders limit is set
- [ ] Account leverage is conservative

### System Status ✅

- [ ] All tests passing
- [ ] No error messages in logs
- [ ] Market data updating correctly
- [ ] Account data accessible

## 🚀 Running the Bot

### Safe Testing (Simulation Mode)

```bash
# Keep SIMULATION_MODE=true in .env
npm start
```

### Live Trading (BE CAREFUL!)

```bash
# Change SIMULATION_MODE=false in .env
npm run prod
```

## 📊 Monitoring

While running, monitor:

- Console logs for decisions
- Account balance changes
- Open positions
- Error messages

## 🔧 Troubleshooting

### Common Issues:

**Authentication Errors:**

- Check API keys in `.env`
- Verify keys have correct permissions
- Check API URL is correct

**Market Data Errors:**

- Verify internet connection
- Check if markets are open
- Confirm API limits not exceeded

**Trading Logic Errors:**

- Check account balance
- Verify position limits
- Check market filters

**TypeScript Errors:**

- Run `npm run build` to check compilation
- Fix any type errors before running

## 🎯 Recommended Testing Workflow

1. **Start with simulation mode** (`SIMULATION_MODE=true`)
2. **Run all tests** (`npm test`)
3. **Do dry run** (`npm run test:dry`)
4. **Monitor for 24-48 hours** in simulation
5. **Verify all logic works correctly**
6. **Only then consider live trading** with small amounts

## ⚠️ Important Warnings

- **Always test in simulation mode first**
- **Start with small position sizes**
- **Monitor the bot actively when first running**
- **Have stop-loss strategies in place**
- **Never risk more than you can afford to lose**
- **Cryptocurrency trading involves significant risk**

## 🆘 Emergency Actions

If something goes wrong:

1. **Stop the bot** (Ctrl+C)
2. **Check open positions** on Backpack Exchange
3. **Manually close positions** if needed
4. **Review logs** for error details
5. **Fix issues** before restarting

---

**Remember: This is financial software. Test thoroughly and trade responsibly!** 💼
