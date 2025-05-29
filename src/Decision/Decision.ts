import Futures from "../Backpack/Authenticated/Futures.js";
import Order from "../Backpack/Authenticated/Order.js";
import OrderController from "../Controllers/OrderController.js";
import AccountController from "../Controllers/AccountController.js";
import Markets from "../Backpack/Public/Markets.js";
import { Candle, Position } from "../types/index.js";

interface AnalysisResult {
  action: "LONG" | "SHORT" | "NEUTRAL";
  entry: number | null;
  marketPrice: number;
  volume?: number;
  market?: string;
  stop?: number | null;
  target?: number | null;
}

interface SupportResistance {
  stopLoss: number | null;
  takeProfit: number | null;
}

class Decision {
  async analyze(): Promise<void> {
    try {
      const positions = await Futures.getOpenPositions();
      const Account = await AccountController.get();
      const markets = Account.markets.map((el) => el.symbol);
      const symbol_opend = positions?.map((el: Position) => el.symbol) || [];
      const schedule_ordens = await OrderController.getAllOrdersSchedule(
        symbol_opend
      );
      const markets_schedule = schedule_ordens.map((el) => el.symbol);
      const markets_available = markets.filter(
        (symbol) =>
          !symbol_opend.includes(symbol) && !markets_schedule.includes(symbol)
      );

      // Cancel old scheduled orders
      for (const schedule_orden of schedule_ordens) {
        if (schedule_orden.minutes > 5) {
          await Order.cancelOpenOrders(schedule_orden.symbol || "");
        }
      }

      const LIMIT_ORDER = parseInt(process.env.LIMIT_ORDER || "1");

      if (
        (positions?.length || 0) <= LIMIT_ORDER &&
        schedule_ordens.length <= LIMIT_ORDER
      ) {
        console.log("Markets available: ", markets_available.length);

        for (const market of markets_available) {
          const candles = await Markets.getCandles5m(market, 25);
          if (!candles || candles.length === 0) continue;

          const ticker = await Markets.getTicker(market);
          if (!ticker) continue;

          const marketPrice = parseFloat(
            ticker.lastPrice || ticker.markPrice || "0"
          );
          if (marketPrice === 0) continue;

          const dataset = this.analyzeMAEMACross(candles, marketPrice);
          dataset.volume = Account.minVolumeDollar;
          dataset.market = market;

          if (dataset.action !== "NEUTRAL") {
            const { stopLoss, takeProfit } = this.findSupportResistance(
              candles,
              marketPrice
            );

            dataset.stop = stopLoss;
            dataset.target = takeProfit;

            const orders = await OrderController.getRecentOpenOrders(market);

            if (orders.length > 0) {
              if (orders[0]!.minutes > 10) {
                await Order.cancelOpenOrders(market);
                await OrderController.openOrder(dataset as any);
              } else {
                await OrderController.openOrder(dataset as any);
              }
            } else {
              await OrderController.openOrder(dataset as any);
            }
          }
        }
      }
      console.log("done");
    } catch (error) {
      console.log("analyze Error", error);
    }
  }

  analyzeMAEMACross(
    candles: Candle[],
    marketPrice: number | string,
    period: number = 21,
    entryOffset: number = 0.0005
  ): AnalysisResult {
    const closes = candles.map((c) => parseFloat(c.close));
    const ma: (number | null)[] = [];
    const ema: (number | null)[] = [];
    const k = 2 / (period + 1);

    // Cálculo da MA
    for (let i = 0; i < closes.length; i++) {
      if (i + 1 >= period) {
        const sum = closes
          .slice(i + 1 - period, i + 1)
          .reduce((a, b) => a + b, 0);
        ma.push(sum / period);
      } else {
        ma.push(null);
      }
    }

    // Cálculo da EMA
    for (let i = 0; i < closes.length; i++) {
      if (i === period - 1) {
        const maValue = ma[i];
        ema.push(maValue !== null && maValue !== undefined ? maValue : null);
      } else if (i >= period) {
        ema.push(closes[i]! * k + ema[i - 1]! * (1 - k));
      } else {
        ema.push(null);
      }
    }

    const i = closes.length - 1;
    const iPrev = i - 1;
    const parsedMarketPrice = parseFloat(marketPrice.toString());

    let action: "LONG" | "SHORT" | "NEUTRAL" = "NEUTRAL";
    let entry: number | null = null;

    if (
      ma[iPrev] !== null &&
      ema[iPrev] !== null &&
      ma[i] !== null &&
      ema[i] !== null
    ) {
      const prevDiff = ma[iPrev]! - ema[iPrev]!;
      const currDiff = ma[i]! - ema[i]!;

      // MA cruzou EMA de baixo para cima → LONG
      if (prevDiff <= 0 && currDiff > 0) {
        action = "LONG";
        entry = parseFloat((parsedMarketPrice - entryOffset).toFixed(6));
      }

      // MA cruzou EMA de cima para baixo → SHORT
      else if (prevDiff >= 0 && currDiff < 0) {
        action = "SHORT";
        entry = parseFloat((parsedMarketPrice + entryOffset).toFixed(6));
      }
    }

    return {
      action,
      entry,
      marketPrice: parsedMarketPrice,
    };
  }

  findSupportResistance(
    candles: Candle[],
    entryPrice: number
  ): SupportResistance {
    const supports: number[] = [];
    const resistances: number[] = [];

    for (let i = 1; i < candles.length - 1; i++) {
      const prev = candles[i - 1]!;
      const curr = candles[i]!;
      const next = candles[i + 1]!;

      const low = parseFloat(curr.low);
      const high = parseFloat(curr.high);

      // Suporte: fundo local
      if (low < parseFloat(prev.low) && low < parseFloat(next.low)) {
        supports.push(low);
      }

      // Resistência: topo local
      if (high > parseFloat(prev.high) && high > parseFloat(next.high)) {
        resistances.push(high);
      }
    }

    // Encontrar suporte mais próximo abaixo do preço de entrada
    const support =
      supports.filter((level) => level < entryPrice).sort((a, b) => b - a)[0] ??
      null;

    // Encontrar resistência mais próxima acima do preço de entrada
    const resistance =
      resistances
        .filter((level) => level > entryPrice)
        .sort((a, b) => a - b)[0] ?? null;

    return {
      stopLoss: support,
      takeProfit: resistance,
    };
  }
}

export default new Decision();
