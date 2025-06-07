import {
  IStrategy,
  AnalysisResult,
  StrategyConfig,
  AccountData,
} from "./StrategyInterface.js";
import { Candle, Position, Market } from "../types/index.js";
import * as Indicators from "../Indicators/index.js";

interface BBEMAState {
  lastEntryBarIndex?: number;
}

export class BBEMAVolumeFarmerStrategy implements IStrategy {
  readonly name = "BB_EMA_VOLUME_FARMER";
  private config!: StrategyConfig;
  private symbolStates: Map<string, BBEMAState> = new Map();

  // Strategy Parameters (Pine Script defaults)
  private riskPerc = 0.5; // 0.5%
  private maxDD = 22; // 22%
  private dailyLossPerc = 2.5; // 2.5%

  private bbLen = 20;
  private bbMult = 2.0;
  private emaFastLen = 21;
  private emaSlowLen = 55;

  private atrLen = 14;
  private stopMult = 1.1;
  private partialRR = 0.7;
  private rewardRR = 2.5;
  private trailATRMult = 1.5;
  private partialPct = 40; // %

  private minBarsBetween = 5;
  private useRangeTrades = false;

  private useVolFilter = false;
  private volLookback = 50;
  private volThresh = 0.6;

  async initialize(config: StrategyConfig): Promise<void> {
    this.config = config;

    // Load parameters from config, fallback to defaults
    this.riskPerc = parseFloat(config.BBEMA_RISK_PERC) || this.riskPerc;
    this.maxDD = parseFloat(config.BBEMA_MAX_DD) || this.maxDD;
    this.dailyLossPerc =
      parseFloat(config.BBEMA_DAILY_LOSS_PERC) || this.dailyLossPerc;

    this.bbLen = parseInt(config.BBEMA_BB_LEN) || this.bbLen;
    this.bbMult = parseFloat(config.BBEMA_BB_MULT) || this.bbMult;
    this.emaFastLen = parseInt(config.BBEMA_EMA_FAST_LEN) || this.emaFastLen;
    this.emaSlowLen = parseInt(config.BBEMA_EMA_SLOW_LEN) || this.emaSlowLen;

    this.atrLen = parseInt(config.BBEMA_ATR_LEN) || this.atrLen;
    this.stopMult = parseFloat(config.BBEMA_STOP_MULT) || this.stopMult;
    this.partialRR = parseFloat(config.BBEMA_PARTIAL_RR) || this.partialRR;
    this.rewardRR = parseFloat(config.BBEMA_REWARD_RR) || this.rewardRR;
    this.trailATRMult =
      parseFloat(config.BBEMA_TRAIL_ATR_MULT) || this.trailATRMult;
    this.partialPct = parseInt(config.BBEMA_PARTIAL_PCT) || this.partialPct;

    this.minBarsBetween =
      parseInt(config.BBEMA_MIN_BARS_BETWEEN) || this.minBarsBetween;
    this.useRangeTrades =
      config.BBEMA_USE_RANGE_TRADES === "true" || this.useRangeTrades;

    this.useVolFilter =
      config.BBEMA_USE_VOL_FILTER === "true" || this.useVolFilter;
    this.volLookback = parseInt(config.BBEMA_VOL_LOOKBACK) || this.volLookback;
    this.volThresh = parseFloat(config.BBEMA_VOL_THRESH) || this.volThresh;

    console.log(`🎯 ${this.name} strategy initialized with config:`, {
      riskPerc: this.riskPerc,
      bbLen: this.bbLen,
      emaFastLen: this.emaFastLen,
      emaSlowLen: this.emaSlowLen,
      stopMult: this.stopMult,
      partialRR: this.partialRR,
      rewardRR: this.rewardRR,
      useRangeTrades: this.useRangeTrades,
      useVolFilter: this.useVolFilter,
    });
  }

  private getSymbolState(symbol: string): BBEMAState {
    if (!this.symbolStates.has(symbol)) {
      this.symbolStates.set(symbol, {});
    }
    return this.symbolStates.get(symbol)!;
  }

  private updateSymbolState(symbol: string, barIndex: number) {
    const state = this.getSymbolState(symbol);
    state.lastEntryBarIndex = barIndex;
    this.symbolStates.set(symbol, state);
  }

  async analyze(
    candles: Candle[],
    market: Market,
    account: AccountData,
    openPositionsForSymbol: Position[],
    allOpenPositions: Position[]
  ): Promise<AnalysisResult | null> {
    const minDataRequired = Math.max(
      this.bbLen,
      this.emaSlowLen,
      this.atrLen,
      this.volLookback,
      25
    );

    if (candles.length < minDataRequired) {
      const lastCandle = candles[candles.length - 1];
      return {
        action: "NEUTRAL",
        symbol: market.symbol,
        marketPrice: lastCandle ? parseFloat(lastCandle.close) : 0,
        reason: "Not enough candle data",
      };
    }

    const closes = candles.map((c) => parseFloat(c.close));
    const highs = candles.map((c) => parseFloat(c.high));
    const lows = candles.map((c) => parseFloat(c.low));
    const volumes = candles.map((c) => parseFloat(c.volume));
    const currentPrice = closes[closes.length - 1];
    const currentBarIndex = candles.length - 1;

    if (currentPrice === undefined) {
      return {
        action: "NEUTRAL",
        symbol: market.symbol,
        marketPrice: 0,
        reason: "Unable to get current price",
      };
    }

    // === INDICATORS ===
    const basisSeries = Indicators.sma(closes, this.bbLen);
    const devSeries = Indicators.stdev(closes, this.bbLen);
    const emaFastSeries = Indicators.ema(closes, this.emaFastLen);
    const emaSlowSeries = Indicators.ema(closes, this.emaSlowLen);
    const atrSeries = Indicators.atr(candles, this.atrLen);

    const basis = basisSeries[basisSeries.length - 1];
    const dev = devSeries[devSeries.length - 1];
    const emaFast = emaFastSeries[emaFastSeries.length - 1];
    const emaFastPrev = emaFastSeries[emaFastSeries.length - 3]; // emaFast[2] in Pine
    const emaSlow = emaSlowSeries[emaSlowSeries.length - 1];
    const atrVal = atrSeries[atrSeries.length - 1];

    if (
      basis === null ||
      basis === undefined ||
      dev === null ||
      dev === undefined ||
      emaFast === null ||
      emaFast === undefined ||
      emaFastPrev === null ||
      emaFastPrev === undefined ||
      emaSlow === null ||
      emaSlow === undefined ||
      atrVal === null ||
      atrVal === undefined
    ) {
      return {
        action: "NEUTRAL",
        symbol: market.symbol,
        marketPrice: currentPrice,
        reason: "Indicator calculation resulted in null or undefined",
      };
    }

    const upperBB = basis + this.bbMult * dev;
    const lowerBB = basis - this.bbMult * dev;
    const stopDist = Math.max(atrVal * this.stopMult, market.tickSize * 3);

    // === POSITION SIZE CALCULATION ===
    const capital = account.capitalAvailable;
    const riskCash = capital * (this.riskPerc / 100);
    const contracts = Math.max(Math.floor(riskCash / stopDist), 1);
    const volume = contracts * currentPrice; // Approximate volume in USD

    // === PYRAMIDING CHECK ===
    const openLegs = openPositionsForSymbol.length;
    const canSize = openLegs < 2; // Pyramiding = 2

    // === SIGNALS ===
    const upSlope = emaFast > emaFastPrev;
    const dnSlope = emaFast < emaFastPrev;

    const longTrend =
      upSlope && currentPrice > upperBB && currentPrice > emaFast;
    const shortTrend =
      dnSlope && currentPrice < lowerBB && currentPrice < emaFast;

    const longPull =
      upSlope &&
      Indicators.crossover(
        closes.slice(-2),
        basisSeries.slice(-2).map((b) => b ?? 0)
      );
    const shortPull =
      dnSlope &&
      Indicators.crossunder(
        closes.slice(-2),
        basisSeries.slice(-2).map((b) => b ?? 0)
      );

    const longRange =
      this.useRangeTrades &&
      currentPrice < lowerBB &&
      Indicators.crossover(closes.slice(-2), new Array(2).fill(lowerBB));
    const shortRange =
      this.useRangeTrades &&
      currentPrice > upperBB &&
      Indicators.crossunder(closes.slice(-2), new Array(2).fill(upperBB));

    // === VOLUME FILTER ===
    let volGate = true;
    if (this.useVolFilter) {
      const volSlice = volumes.slice(-this.volLookback);
      const volMin = Math.min(...volSlice);
      const volMax = Math.max(...volSlice);
      const currentVolume = volumes[volumes.length - 1];
      if (currentVolume === undefined) {
        volGate = false;
      } else {
        const volRank =
          volMax !== volMin
            ? (currentVolume - volMin) / (volMax - volMin)
            : 0.5;
        volGate = volRank > this.volThresh;
      }
    }

    const longCore = longTrend || longPull;
    const shortCore = shortTrend || shortPull;

    let longSig = volGate && (longCore || (this.useRangeTrades && longRange));
    let shortSig =
      volGate && (shortCore || (this.useRangeTrades && shortRange));

    // === MIN-BAR SPACING FILTER ===
    const symbolState = this.getSymbolState(market.symbol);
    const barSpacingOK =
      symbolState.lastEntryBarIndex === undefined ||
      currentBarIndex - symbolState.lastEntryBarIndex >= this.minBarsBetween;

    // === FINAL SIGNAL CHECK ===
    if (!canSize || !barSpacingOK) {
      return {
        action: "NEUTRAL",
        symbol: market.symbol,
        marketPrice: currentPrice,
        reason: !canSize
          ? "Max positions reached"
          : "Min bars between entries not met",
      };
    }

    let action: "LONG" | "SHORT" | "NEUTRAL" = "NEUTRAL";
    let entry = currentPrice;
    let stopLoss: number | undefined;
    let takeProfit1: number | undefined;
    let takeProfit2: number | undefined;

    if (longSig) {
      action = "LONG";
      stopLoss = entry - stopDist;
      takeProfit1 = entry + stopDist * this.partialRR;
      takeProfit2 = entry + stopDist * this.rewardRR;

      // Update state to track last entry
      this.updateSymbolState(market.symbol, currentBarIndex);
    } else if (shortSig) {
      action = "SHORT";
      stopLoss = entry + stopDist;
      takeProfit1 = entry - stopDist * this.partialRR;
      takeProfit2 = entry - stopDist * this.rewardRR;

      // Update state to track last entry
      this.updateSymbolState(market.symbol, currentBarIndex);
    }

    return {
      action,
      symbol: market.symbol,
      marketPrice: currentPrice,
      entry,
      stopLoss,
      takeProfit1,
      takeProfit2,
      volume,
      partialClosePct: this.partialPct,
      trailingStopParams: {
        atrValue: atrVal!,
        trailMultiplier: this.trailATRMult,
        trailOffsetPoints: atrVal! * this.trailATRMult,
      },
      reason:
        action !== "NEUTRAL"
          ? `${action} signal: ${
              longTrend
                ? "trend"
                : longPull
                ? "pullback"
                : longRange
                ? "range"
                : shortTrend
                ? "trend"
                : shortPull
                ? "pullback"
                : shortRange
                ? "range"
                : "unknown"
            }`
          : "No signal",
    };
  }
}
