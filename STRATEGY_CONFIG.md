# BB-EMA Volume Farmer v2.5 Strategy Configuration

## Strategy Selection

Set the trading strategy using:

```bash
export TRADING_STRATEGY="BBEMA_VOLUME_FARMER"  # For BB-EMA Volume Farmer strategy (default)
```

## BB-EMA Volume Farmer Strategy Parameters

### Core Parameters

```bash
export BBEMA_RISK_PERC="0.5"              # Risk percentage per trade (default: 0.5%)
export BBEMA_MAX_DD="22"                   # Maximum drawdown percentage (default: 22%)
export BBEMA_DAILY_LOSS_PERC="2.5"        # Daily loss limit percentage (default: 2.5%)
```

### Bollinger Bands & EMA Settings

```bash
export BBEMA_BB_LEN="20"                   # Bollinger Bands period (default: 20)
export BBEMA_BB_MULT="2.0"                 # Bollinger Bands multiplier (default: 2.0)
export BBEMA_EMA_FAST_LEN="21"             # Fast EMA period (default: 21)
export BBEMA_EMA_SLOW_LEN="55"             # Slow EMA period (default: 55)
```

### Risk Management

```bash
export BBEMA_ATR_LEN="14"                  # ATR period for stop loss calculation (default: 14)
export BBEMA_STOP_MULT="1.1"               # ATR multiplier for stop loss (default: 1.1)
export BBEMA_PARTIAL_RR="0.7"              # Risk/Reward ratio for partial take profit (default: 0.7)
export BBEMA_REWARD_RR="2.5"               # Risk/Reward ratio for final take profit (default: 2.5)
export BBEMA_TRAIL_ATR_MULT="1.5"          # ATR multiplier for trailing stop (default: 1.5)
export BBEMA_PARTIAL_PCT="40"              # Percentage to close at first take profit (default: 40%)
```

### Entry Management

```bash
export BBEMA_MIN_BARS_BETWEEN="5"          # Minimum bars between entries (default: 5)
export BBEMA_USE_RANGE_TRADES="false"      # Enable range bounce trades (default: false)
```

### Volume Filter

```bash
export BBEMA_USE_VOL_FILTER="false"        # Enable volume filtering (default: false)
export BBEMA_VOL_LOOKBACK="50"             # Volume lookback period (default: 50)
export BBEMA_VOL_THRESH="0.6"              # Volume threshold (0.0-1.0, default: 0.6)
```

## Example Configuration

### Conservative BB-EMA Setup

```bash
export TRADING_STRATEGY="BBEMA_VOLUME_FARMER"
export BBEMA_RISK_PERC="0.25"
export BBEMA_STOP_MULT="1.5"
export BBEMA_PARTIAL_RR="1.0"
export BBEMA_REWARD_RR="3.0"
export BBEMA_USE_VOL_FILTER="true"
export BBEMA_VOL_THRESH="0.7"
```

### Aggressive BB-EMA Setup

```bash
export TRADING_STRATEGY="BBEMA_VOLUME_FARMER"
export BBEMA_RISK_PERC="1.0"
export BBEMA_STOP_MULT="0.8"
export BBEMA_PARTIAL_RR="0.5"
export BBEMA_REWARD_RR="2.0"
export BBEMA_USE_RANGE_TRADES="true"
export BBEMA_MIN_BARS_BETWEEN="3"
```

## Strategy Features

### BB-EMA Volume Farmer v2.5

- **Trend Following**: Enters long when price breaks above upper Bollinger Band with EMA confirmation
- **Pullback Trading**: Enters on price crossing back to Bollinger Band basis (middle line)
- **Range Bounce**: Optional range trading when price hits band extremes
- **Volume Filtering**: Optional volume-based trade filtering
- **Risk Management**: ATR-based stop losses and take profits
- **Partial Profits**: Configurable partial position closing
- **Trailing Stops**: ATR-based trailing stop functionality
- **Position Spacing**: Prevents overtrading with minimum bar spacing

### MA/EMA Cross

- **Simple Crossover**: Enters when SMA crosses above/below EMA
- **Trend Confirmation**: Uses slow vs fast moving averages
- **Basic Risk Management**: Market price entry with configurable offset

## Usage Notes

1. **Strategy Switching**: Restart the bot after changing `TRADING_STRATEGY`
2. **Parameter Changes**: Most parameters are loaded at startup - restart required for changes
3. **Risk Management**: Always test with small position sizes first
4. **Backtesting**: Use test scripts to validate strategy behavior
5. **Monitoring**: Watch logs for strategy decision explanations
