import Futures from "../Backpack/Authenticated/Futures.js";
import Order from "../Backpack/Authenticated/Order.js";
import OrderController from "../Controllers/OrderController.js";
import AccountController from "../Controllers/AccountController.js";
import Markets from "../Backpack/Public/Markets.js";
import Utils from "../Utils/Utils.js";
import { Position, Candle, Order as OrderType } from "../types/index.js";

interface ProcessedPosition {
  userId: string;
  positionId: string;
  symbol: string;
  profit: number;
  profitPercentage: number;
  breakEvenPrice: string;
  markPrice: number;
  inProfit: boolean;
  quantity: number;
  volume: number;
  isLong: boolean;
  entryPrice: number;
  // Add dual exit tracking
  hasPartialExit?: boolean;
  remainingQuantity?: number;
}

interface ATRTrailingParams {
  atrValue: number;
  trailMultiplier: number;
  partialExitRR: number;
  partialExitPct: number;
}

interface ProcessedOrder {
  id: string;
  minutes: number;
  triggerPrice: number;
}

class TrailingStop {
  processPosition(position: Position, makerFee: number): ProcessedPosition {
    const entryPrice = parseFloat(position.entryPrice);
    const markPrice = parseFloat(position.markPrice);
    const quantity = Math.abs(parseFloat(position.netQuantity));
    const netCost = Math.abs(parseFloat(position.netCost || "0"));
    const direction = parseFloat(position.netQuantity) > 0 ? 1 : -1;
    const isLong = parseFloat(position.netQuantity) > 0;

    const grossProfit = (markPrice - entryPrice) * direction * quantity;
    const openFee = entryPrice * quantity * makerFee;
    const closeFee = Math.abs(grossProfit) * makerFee;
    const fee = openFee + closeFee;

    const netProfit = grossProfit - fee;
    const netProfitPercent = (netProfit / netCost) * 100;

    return {
      userId: position.userId || "",
      positionId: position.positionId || "",
      symbol: position.symbol,
      profit: netProfit,
      profitPercentage: netProfitPercent,
      breakEvenPrice: position.breakEvenPrice || position.entryPrice,
      markPrice,
      inProfit: netProfit > 0,
      quantity,
      volume: quantity * markPrice,
      isLong,
      entryPrice,
      hasPartialExit: false, // This would need to be tracked in position metadata
      remainingQuantity: quantity,
    };
  }

  async processOrders(
    isLong: boolean,
    symbol: string
  ): Promise<ProcessedOrder[]> {
    const orders = await Order.getOpenOrders(symbol);
    if (!orders) return [];

    const sortedOrders = isLong
      ? orders.sort(
          (a, b) =>
            parseFloat(a.triggerPrice || "0") -
            parseFloat(b.triggerPrice || "0")
        )
      : orders.sort(
          (a, b) =>
            parseFloat(b.triggerPrice || "0") -
            parseFloat(a.triggerPrice || "0")
        );

    return sortedOrders.map((el) => ({
      id: el.id,
      minutes: Utils.minutesAgo(new Date(el.createdAt).getTime()),
      triggerPrice: parseFloat(el.triggerPrice || "0"),
    }));
  }

  calculateTrailingGap(
    candles: Candle[],
    marketPrice: number,
    isLong: boolean
  ): number {
    if (!candles || candles.length < 5) return 0;

    const recentCandles = candles.slice(-5);
    let recentBottom = Math.min(...recentCandles.map((c) => parseFloat(c.low)));
    let recentTop = Math.max(...recentCandles.map((c) => parseFloat(c.high)));

    const trailingGap = isLong
      ? marketPrice - recentBottom
      : recentTop - marketPrice;

    return Math.max(trailingGap, 0);
  }

  /**
   * Calculate ATR-based trailing stop for Pine Script fidelity
   */
  calculateATRTrailingStop(
    candles: Candle[],
    entryPrice: number,
    currentPrice: number,
    isLong: boolean,
    params: ATRTrailingParams
  ): { partialTarget: number; trailingStop: number } {
    if (!candles || candles.length < 14) {
      // Fallback to basic calculation
      const stopDist = Math.abs(currentPrice - entryPrice) * 0.02; // 2% fallback
      return {
        partialTarget: isLong
          ? entryPrice + stopDist * params.partialExitRR
          : entryPrice - stopDist * params.partialExitRR,
        trailingStop: isLong
          ? currentPrice - params.atrValue * params.trailMultiplier
          : currentPrice + params.atrValue * params.trailMultiplier,
      };
    }

    // Use ATR for precise trailing
    const atrTrailDistance = params.atrValue * params.trailMultiplier;
    const partialDistance = params.atrValue * params.partialExitRR;

    return {
      partialTarget: isLong
        ? entryPrice + partialDistance
        : entryPrice - partialDistance,
      trailingStop: isLong
        ? currentPrice - atrTrailDistance
        : currentPrice + atrTrailDistance,
    };
  }

  async stopLoss(): Promise<void> {
    try {
      const positions = await Futures.getOpenPositions();
      if (!positions || positions.length === 0) return;

      const Account = await AccountController.get();

      for (const position of positions) {
        const processedPosition = this.processPosition(position, Account.fee);

        // Get market analysis
        const analysis = await Markets.getCandlesAnalysis(
          processedPosition.symbol
        );
        if (!analysis) continue;

        const { candles, volume24h, price } = analysis;

        // Check volume threshold
        const minVolumeThreshold = Account.minVolumeDollar * 0.1;
        if (volume24h < minVolumeThreshold) {
          console.log(
            `⚠️ Low volume for ${processedPosition.symbol}, force closing`
          );
          await OrderController.forceClose(position);
          continue;
        }

        // Calculate trailing stop
        const trailingGap = this.calculateTrailingGap(
          candles,
          price,
          processedPosition.isLong
        );

        if (trailingGap === 0) continue;

        // Determine new stop price
        let newStopPrice: number;
        if (processedPosition.isLong) {
          newStopPrice = price - trailingGap;
        } else {
          newStopPrice = price + trailingGap;
        }

        // Ensure stop doesn't go beyond break-even
        const breakEvenPrice = parseFloat(processedPosition.breakEvenPrice);
        if (processedPosition.isLong && newStopPrice > breakEvenPrice) {
          newStopPrice = Math.min(newStopPrice, breakEvenPrice);
        } else if (!processedPosition.isLong && newStopPrice < breakEvenPrice) {
          newStopPrice = Math.max(newStopPrice, breakEvenPrice);
        }

        // Check existing orders and update if necessary
        const existingOrders = await this.processOrders(
          processedPosition.isLong,
          processedPosition.symbol
        );

        let shouldCreateNewStop = true;

        for (const order of existingOrders) {
          const priceDiff = Math.abs(order.triggerPrice - newStopPrice);
          const priceThreshold = price * 0.001; // 0.1% threshold

          if (priceDiff < priceThreshold) {
            shouldCreateNewStop = false;
            break;
          } else {
            // Cancel old stop and create new one
            await OrderController.cancelStopTS(
              processedPosition.symbol,
              order.id
            );
          }
        }

        if (shouldCreateNewStop) {
          try {
            await OrderController.createStopTS({
              symbol: processedPosition.symbol,
              price: newStopPrice,
              isLong: processedPosition.isLong,
              quantity: processedPosition.quantity,
            });

            console.log(
              `📊 Updated trailing stop for ${
                processedPosition.symbol
              }: ${newStopPrice.toFixed(4)}`
            );
          } catch (error) {
            console.error(
              `❌ Failed to create trailing stop for ${processedPosition.symbol}:`,
              error
            );
          }
        }
      }

      console.log("newStops discored");
    } catch (error) {
      console.error("stopLoss Error:", error);
    }
  }
}

export default new TrailingStop();
