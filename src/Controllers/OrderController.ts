import Order from "../Backpack/Authenticated/Order.js";
import AccountController from "./AccountController.js";
import Utils from "../Utils/Utils.js";
import {
  Position,
  TradeSignal,
  TrailingStopData,
  ApiResponse,
  Side,
} from "../types/index.js";

interface OpenOrderParams {
  entry: number;
  stop?: number;
  target?: number;
  action: "LONG" | "SHORT";
  market: string;
  volume: number;
}

interface RecentOrder {
  id: string;
  minutes: number;
  triggerPrice: number;
  symbol?: string;
}

class OrderController {
  async forceClose(position: Position): Promise<ApiResponse> {
    // Add simulation check
    if (process.env.SIMULATION_MODE === "true") {
      console.log("🎭 SIMULATION - Would force close:", {
        symbol: position.symbol,
        quantity: Math.abs(parseFloat(position.netQuantity)),
      });
      return { orderId: "sim_close_" + Date.now(), success: true };
    }

    const Account = await AccountController.get();
    const market = Account.markets.find((el) => el.symbol === position.symbol);

    if (!market) {
      throw new Error(`Market ${position.symbol} not found`);
    }

    const isLong = parseFloat(position.netQuantity) > 0;
    const quantity = Math.abs(parseFloat(position.netQuantity));
    const decimal = market.decimal_quantity;

    const body = {
      symbol: position.symbol,
      orderType: "Market" as const,
      side: (isLong ? "Ask" : "Bid") as Side,
      reduceOnly: true,
      clientId: Math.floor(Math.random() * 1000000),
      quantity: String(quantity.toFixed(decimal)),
    };

    return (await Order.executeOrder(body)) || { success: false };
  }

  async openOrder({
    entry,
    stop,
    target,
    action,
    market,
    volume,
  }: OpenOrderParams): Promise<ApiResponse> {
    if (process.env.SIMULATION_MODE === "true") {
      console.log("🎭 SIMULATION - Would open order:", {
        market,
        action,
        entry,
        stop,
        target,
        volume: volume.toFixed(2),
      });
      return { orderId: "sim_" + Date.now(), success: true };
    }

    const isLong = action === "LONG";
    const side: Side = isLong ? "Bid" : "Ask";

    const Account = await AccountController.get();
    const find = Account.markets.find((el) => el.symbol === market);

    if (!find) {
      throw new Error(`Market ${market} not found`);
    }

    const decimal_quantity = find.decimal_quantity;
    const decimal_price = find.decimal_price;

    const formatPrice = (value: number): string =>
      parseFloat(value.toString()).toFixed(decimal_price).toString();
    const formatQuantity = (value: number): string =>
      parseFloat(value.toString()).toFixed(decimal_quantity).toString();

    const clientId = Math.floor(Math.random() * 1_000_000);
    const orderType = "Limit" as const;
    const postOnly = false;
    const timeInForce = "GTC" as const;

    const entryPrice = parseFloat(entry.toString());
    const quantity = formatQuantity(volume / entryPrice);
    const price = formatPrice(entryPrice);

    const offset = 0.001 * entryPrice;

    const triggerPrice = isLong
      ? formatPrice(entryPrice - offset)
      : formatPrice(entryPrice + offset);

    const body: any = {
      autoLend: true,
      autoLendRedeem: true,
      autoBorrow: true,
      autoBorrowRepay: true,
      clientId,
      orderType,
      postOnly,
      selfTradePrevention: "RejectTaker",
      side,
      symbol: market,
      timeInForce,
      price,
      triggerBy: "MarkPrice",
      triggerPrice,
      triggerQuantity: quantity,
    };

    // Stop loss
    if (
      stop !== undefined &&
      stop !== null &&
      !isNaN(parseFloat(stop.toString()))
    ) {
      const stopLoss = parseFloat(stop.toString());
      body.stopLossTriggerBy = "MarkPrice";
      body.stopLossTriggerPrice = isLong
        ? formatPrice(stopLoss + offset)
        : formatPrice(stopLoss - offset);
      body.stopLossLimitPrice = formatPrice(stopLoss);
    }

    // Take profit
    if (
      target !== undefined &&
      target !== null &&
      !isNaN(parseFloat(target.toString()))
    ) {
      const takeProfit = parseFloat(target.toString());
      body.takeProfitTriggerBy = "LastPrice";
      body.takeProfitTriggerPrice = isLong
        ? formatPrice(takeProfit - offset)
        : formatPrice(takeProfit + offset);
      body.takeProfitLimitPrice = formatPrice(takeProfit);
    }

    return (await Order.executeOrder(body)) || { success: false };
  }

  async getRecentOpenOrders(market: string): Promise<RecentOrder[]> {
    const orders = await Order.getOpenOrders(market);
    if (!orders) return [];

    const orderShorted = orders.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    return orderShorted.map((el) => ({
      id: el.id,
      minutes: Utils.minutesAgo(new Date(el.createdAt).getTime()),
      triggerPrice: parseFloat(el.triggerPrice || "0"),
    }));
  }

  async getAllOrdersSchedule(markets_open: string[]): Promise<RecentOrder[]> {
    const orders = await Order.getOpenOrders();
    if (!orders) return [];

    const orderShorted = orders.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    const list = orderShorted.map((el) => ({
      id: el.id,
      minutes: Utils.minutesAgo(new Date(el.createdAt).getTime()),
      triggerPrice: parseFloat(el.triggerPrice || "0"),
      symbol: el.symbol,
    }));

    return list.filter((el) => !markets_open.includes(el.symbol));
  }

  async cancelStopTS(symbol: string, id: string): Promise<ApiResponse | null> {
    return await Order.cancelOpenOrder(symbol, id);
  }

  async createStopTS({
    symbol,
    price,
    isLong,
    quantity,
  }: TrailingStopData): Promise<ApiResponse> {
    // Add simulation check
    if (process.env.SIMULATION_MODE === "true") {
      console.log("🎭 SIMULATION - Would create stop:", {
        symbol,
        price,
        side: isLong ? "LONG" : "SHORT",
        quantity,
      });
      return { orderId: "sim_stop_" + Date.now(), success: true };
    }

    const Account = await AccountController.get();
    const find = Account.markets.find((el) => el.symbol === symbol);

    if (!find) throw new Error(`Symbol ${symbol} not found in account data`);

    const decimal_quantity = find.decimal_quantity;
    const decimal_price = find.decimal_price;

    if (price <= 0) throw new Error("Invalid price: must be > 0");

    const absPrice = Math.abs(price); // garante positivo
    const triggerPrice = isLong ? absPrice - 0.01 : absPrice + 0.01;

    const formatPrice = (value: number): string =>
      parseFloat(value.toString()).toFixed(decimal_price).toString();
    const formatQuantity = (value: number): string =>
      parseFloat(value.toString()).toFixed(decimal_quantity).toString();

    const body = {
      symbol,
      orderType: "Limit" as const,
      side: (isLong ? "Ask" : "Bid") as Side,
      quantity: formatQuantity(quantity),
      postOnly: true,
      reduceOnly: true,
      price: formatPrice(absPrice),
      clientId: Math.floor(Math.random() * 1000000),
      timeInForce: "GTC" as const,
      triggerPrice: formatPrice(triggerPrice),
      triggerBy: "LastPrice" as const,
      triggerQuantity: formatQuantity(quantity),
    };

    return (await Order.executeOrder(body)) || { success: false };
  }
}

export default new OrderController();
