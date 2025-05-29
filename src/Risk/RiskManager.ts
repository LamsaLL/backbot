import { Position } from "../types/index.js";

interface RiskLimits {
  maxRiskPerTrade: number;        // Max % of capital per trade (default: 2%)
  maxDailyLoss: number;          // Max daily loss % (default: 5%)
  maxTotalExposure: number;      // Max total position exposure % (default: 80%)
  maxPositionsPerMarket: number; // Max positions per symbol (default: 1)
  maxOpenPositions: number;      // Max total open positions (default: 5)
  minVolumeUSD: number;          // Minimum trade size USD (default: 100)
  maxVolumeUSD: number;          // Maximum trade size USD
  stopLossRequired: boolean;     // Require stop loss (default: true)
  maxLeverage: number;           // Maximum leverage allowed (default: 10x)
}

interface RiskValidationResult {
  isValid: boolean;
  reason?: string;
  suggestedVolume?: number;
  riskPercentage?: number;
}

interface DailyPnL {
  date: string;
  totalPnL: number;
  tradeCount: number;
}

interface RiskMetrics {
  totalPositions: number;
  totalExposure: number;
  exposurePercentage: number;
  dailyPnL: number;
  dailyPnLPercentage: number;
  remainingRiskCapacity: number;
  canOpenNewPosition: boolean;
}

class RiskManager {
  private limits: RiskLimits;
  private dailyPnL: DailyPnL[] = [];

  constructor(customLimits?: Partial<RiskLimits>) {
    this.limits = {
      maxRiskPerTrade: 0.02,        // 2%
      maxDailyLoss: 0.05,           // 5%
      maxTotalExposure: 0.80,       // 80%
      maxPositionsPerMarket: 1,
      maxOpenPositions: parseInt(process.env.LIMIT_ORDER || "5"),
      minVolumeUSD: 100,
      maxVolumeUSD: 10000,
      stopLossRequired: true,
      maxLeverage: 10,
      ...customLimits
    };

    console.log(`🛡️ RiskManager initialized:
      - Max Risk Per Trade: ${(this.limits.maxRiskPerTrade * 100).toFixed(1)}%
      - Max Daily Loss: ${(this.limits.maxDailyLoss * 100).toFixed(1)}%
      - Max Total Exposure: ${(this.limits.maxTotalExposure * 100).toFixed(1)}%
      - Max Open Positions: ${this.limits.maxOpenPositions}
      - Volume Range: $${this.limits.minVolumeUSD} - $${this.limits.maxVolumeUSD}
      - Stop Loss Required: ${this.limits.stopLossRequired ? 'Yes' : 'No'}
      - Max Leverage: ${this.limits.maxLeverage}x`);
  }

  /**
   * Validate if a new position can be opened safely
   */
  async validateNewPosition(
    symbol: string,
    volume: number,
    entryPrice: number,
    stopLoss: number | null,
    capitalAvailable: number,
    existingPositions: Position[] = [],
    leverage: number = 1
  ): Promise<RiskValidationResult> {
    
    console.log(`🔍 Validating position: ${symbol} - Volume: $${volume.toFixed(2)}`);

    // 1. Basic volume validation
    const volumeCheck = this.validatePositionSize(volume, capitalAvailable);
    if (!volumeCheck.isValid) {
      console.log(`❌ Volume validation failed: ${volumeCheck.reason}`);
      return volumeCheck;
    }

    // 2. Stop loss requirement
    if (this.limits.stopLossRequired && !stopLoss) {
      console.log(`❌ Stop loss validation failed: Required but not provided`);
      return {
        isValid: false,
        reason: "Stop loss is required for all trades"
      };
    }

    // 3. Check daily loss limit
    const dailyLossCheck = await this.checkDailyLossLimit(capitalAvailable);
    if (!dailyLossCheck.isValid) {
      console.log(`❌ Daily loss limit check failed: ${dailyLossCheck.reason}`);
      return dailyLossCheck;
    }

    // 4. Check maximum positions limit
    const positionLimitCheck = this.checkPositionLimits(symbol, existingPositions);
    if (!positionLimitCheck.isValid) {
      console.log(`❌ Position limit check failed: ${positionLimitCheck.reason}`);
      return positionLimitCheck;
    }

    // 5. Check total exposure
    const exposureCheck = this.checkTotalExposure(volume, existingPositions, capitalAvailable);
    if (!exposureCheck.isValid) {
      console.log(`❌ Exposure check failed: ${exposureCheck.reason}`);
      return exposureCheck;
    }

    // 6. Leverage validation
    const leverageCheck = this.validateLeverage(leverage);
    if (!leverageCheck.isValid) {
      console.log(`❌ Leverage check failed: ${leverageCheck.reason}`);
      return leverageCheck;
    }

    // 7. Calculate actual risk percentage
    const riskAmount = stopLoss ? Math.abs(entryPrice - stopLoss) * (volume / entryPrice) : volume * 0.05; // Assume 5% risk if no stop
    const riskPercentage = riskAmount / capitalAvailable;

    console.log(`✅ Position validation passed - Risk: ${(riskPercentage * 100).toFixed(2)}%`);

    return {
      isValid: true,
      riskPercentage: riskPercentage * 100,
      suggestedVolume: volume
    };
  }

  /**
   * Validate position size against risk limits
   */
  validatePositionSize(volume: number, capitalAvailable: number): RiskValidationResult {
    // Calculate maximum allowed risk
    const maxRiskAmount = capitalAvailable * this.limits.maxRiskPerTrade;
    
    // Check minimum volume
    if (volume < this.limits.minVolumeUSD) {
      return {
        isValid: false,
        reason: `Position size too small. Minimum: $${this.limits.minVolumeUSD}`,
        suggestedVolume: this.limits.minVolumeUSD
      };
    }

    // Check maximum volume
    if (volume > this.limits.maxVolumeUSD) {
      return {
        isValid: false,
        reason: `Position size too large. Maximum: $${this.limits.maxVolumeUSD}`,
        suggestedVolume: this.limits.maxVolumeUSD
      };
    }

    // Check risk percentage
    if (volume > maxRiskAmount) {
      const suggestedVolume = Math.floor(maxRiskAmount);
      return {
        isValid: false,
        reason: `Position exceeds ${(this.limits.maxRiskPerTrade * 100).toFixed(1)}% risk limit`,
        suggestedVolume: suggestedVolume,
        riskPercentage: (volume / capitalAvailable) * 100
      };
    }

    return {
      isValid: true,
      riskPercentage: (volume / capitalAvailable) * 100
    };
  }

  /**
   * Check if daily loss limit has been reached
   */
  async checkDailyLossLimit(capitalAvailable: number): Promise<RiskValidationResult> {
    const today = new Date().toISOString().split('T')[0];
    const todayPnL = this.dailyPnL.find(day => day.date === today);
    
    if (todayPnL && todayPnL.totalPnL < 0) {
      const dailyLossPercentage = Math.abs(todayPnL.totalPnL) / capitalAvailable;
      
      if (dailyLossPercentage >= this.limits.maxDailyLoss) {
        return {
          isValid: false,
          reason: `Daily loss limit reached: ${(dailyLossPercentage * 100).toFixed(2)}%`
        };
      }
    }

    return { isValid: true };
  }

  /**
   * Check position count limits
   */
  checkPositionLimits(symbol: string, existingPositions: Position[]): RiskValidationResult {
    const totalPositions = existingPositions.length;
    const positionsInMarket = existingPositions.filter(pos => pos.symbol === symbol).length;

    if (totalPositions >= this.limits.maxOpenPositions) {
      return {
        isValid: false,
        reason: `Maximum open positions reached: ${this.limits.maxOpenPositions}`
      };
    }

    if (positionsInMarket >= this.limits.maxPositionsPerMarket) {
      return {
        isValid: false,
        reason: `Maximum positions in ${symbol} reached: ${this.limits.maxPositionsPerMarket}`
      };
    }

    return { isValid: true };
  }

  /**
   * Check total portfolio exposure
   */
  checkTotalExposure(newVolume: number, existingPositions: Position[], capitalAvailable: number): RiskValidationResult {
    const currentExposure = existingPositions.reduce((total, pos) => {
      const positionValue = Math.abs(parseFloat(pos.netQuantity)) * parseFloat(pos.entryPrice || "0");
      return total + positionValue;
    }, 0);

    const totalExposure = currentExposure + newVolume;
    const exposurePercentage = totalExposure / capitalAvailable;

    if (exposurePercentage > this.limits.maxTotalExposure) {
      const maxAllowedVolume = (capitalAvailable * this.limits.maxTotalExposure) - currentExposure;
      
      return {
        isValid: false,
        reason: `Total exposure would exceed ${(this.limits.maxTotalExposure * 100).toFixed(1)}%`,
        suggestedVolume: Math.max(0, Math.floor(maxAllowedVolume))
      };
    }

    return { isValid: true };
  }

  /**
   * Validate leverage settings
   */
  validateLeverage(leverage: number): RiskValidationResult {
    if (leverage > this.limits.maxLeverage) {
      return {
        isValid: false,
        reason: `Leverage ${leverage}x exceeds maximum allowed: ${this.limits.maxLeverage}x`
      };
    }

    return { isValid: true };
  }

  /**
   * Calculate safe position size based on risk parameters
   */
  calculateSafePositionSize(
    entryPrice: number,
    stopLoss: number,
    capitalAvailable: number,
    riskPercentage: number = this.limits.maxRiskPerTrade
  ): number {
    if (!stopLoss || stopLoss === entryPrice) {
      // If no stop loss, use percentage of capital
      return capitalAvailable * riskPercentage;
    }

    // Calculate position size based on stop loss distance
    const riskPerUnit = Math.abs(entryPrice - stopLoss);
    const maxRiskAmount = capitalAvailable * riskPercentage;
    const maxQuantity = maxRiskAmount / riskPerUnit;
    const maxVolume = maxQuantity * entryPrice;

    // Apply volume limits
    return Math.min(
      maxVolume,
      this.limits.maxVolumeUSD
    );
  }

  /**
   * Update daily P&L tracking
   */
  updateDailyPnL(pnl: number): void {
    const todayRaw = new Date().toISOString().split('T')[0];
    if (!todayRaw) return; // Safety check
    
    const today: string = todayRaw;
    const todayIndex = this.dailyPnL.findIndex(day => day.date === today);
    
    if (todayIndex >= 0) {
      const todayEntry = this.dailyPnL[todayIndex];
      if (todayEntry) {
        todayEntry.totalPnL += pnl;
        todayEntry.tradeCount += 1;
      }
    } else {
      this.dailyPnL.push({
        date: today,
        totalPnL: pnl,
        tradeCount: 1
      });
    }

    // Keep only last 30 days
    this.dailyPnL = this.dailyPnL.slice(-30);

    console.log(`📊 Daily P&L updated: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`);
  }

  /**
   * Get current risk metrics
   */
  getRiskMetrics(existingPositions: Position[], capitalAvailable: number): RiskMetrics {
    const totalExposure = existingPositions.reduce((total, pos) => {
      const positionValue = Math.abs(parseFloat(pos.netQuantity)) * parseFloat(pos.entryPrice || "0");
      return total + positionValue;
    }, 0);

    const today = new Date().toISOString().split('T')[0];
    const todayPnL = this.dailyPnL.find(day => day.date === today);

    return {
      totalPositions: existingPositions.length,
      totalExposure: totalExposure,
      exposurePercentage: (totalExposure / capitalAvailable) * 100,
      dailyPnL: todayPnL?.totalPnL || 0,
      dailyPnLPercentage: todayPnL ? (todayPnL.totalPnL / capitalAvailable) * 100 : 0,
      remainingRiskCapacity: Math.max(0, capitalAvailable * this.limits.maxRiskPerTrade),
      canOpenNewPosition: existingPositions.length < this.limits.maxOpenPositions
    };
  }

  /**
   * Emergency stop - check if trading should be halted
   */
  shouldHaltTrading(capitalAvailable: number): { halt: boolean; reason?: string } {
    const today = new Date().toISOString().split('T')[0];
    const todayPnL = this.dailyPnL.find(day => day.date === today);
    
    if (todayPnL && todayPnL.totalPnL < 0) {
      const dailyLossPercentage = Math.abs(todayPnL.totalPnL) / capitalAvailable;
      
      if (dailyLossPercentage >= this.limits.maxDailyLoss) {
        return {
          halt: true,
          reason: `Daily loss limit exceeded: ${(dailyLossPercentage * 100).toFixed(2)}%`
        };
      }
    }

    return { halt: false };
  }

  /**
   * Get risk limits configuration
   */
  getRiskLimits(): RiskLimits {
    return { ...this.limits };
  }

  /**
   * Update risk limits
   */
  updateRiskLimits(newLimits: Partial<RiskLimits>): void {
    this.limits = { ...this.limits, ...newLimits };
    console.log(`🛡️ Risk limits updated:`, newLimits);
  }

  /**
   * Get daily P&L history
   */
  getDailyPnLHistory(): DailyPnL[] {
    return [...this.dailyPnL];
  }

  /**
   * Reset daily P&L (for testing or new day)
   */
  resetDailyPnL(): void {
    const today = new Date().toISOString().split('T')[0];
    this.dailyPnL = this.dailyPnL.filter(day => day.date !== today);
    console.log(`🔄 Daily P&L reset for ${today}`);
  }
}

export default RiskManager;
