import axios from "axios";
import Utils from "../../Utils/Utils.js";
import { Market, Candle } from "../../types/index.js";

class Markets {
  async getMarkets(): Promise<Market[] | null> {
    try {
      const response = await axios.get(`${process.env.API_URL}/api/v1/markets`);
      return response.data;
    } catch (error: any) {
      console.error(
        "getMarkets - ERROR!",
        error.response?.data || error.message
      );
      return null;
    }
  }

  async getMarket(symbol: string): Promise<Market | null> {
    if (!symbol) {
      console.error("symbol required");
      return null;
    }

    try {
      const response = await axios.get(`${process.env.API_URL}/api/v1/market`, {
        params: { symbol },
      });
      return response.data;
    } catch (error: any) {
      console.error(
        "getMarket - ERROR!",
        error.response?.data || error.message
      );
      return null;
    }
  }

  async getTicker(symbol: string): Promise<any | null> {
    if (!symbol) {
      console.error("symbol required");
      return null;
    }

    try {
      const response = await axios.get(`${process.env.API_URL}/api/v1/ticker`, {
        params: { symbol },
      });
      return response.data;
    } catch (error: any) {
      console.error(
        "getTicker - ERROR!",
        error.response?.data || error.message
      );
      return null;
    }
  }

  async getTickers(): Promise<any[] | null> {
    try {
      const response = await axios.get(`${process.env.API_URL}/api/v1/tickers`);
      return response.data;
    } catch (error: any) {
      console.error(
        "getTickers - ERROR!",
        error.response?.data || error.message
      );
      return null;
    }
  }

  async getDepth(symbol: string): Promise<any | null> {
    if (!symbol) {
      console.error("symbol required");
      return null;
    }

    try {
      const response = await axios.get(`${process.env.API_URL}/api/v1/depth`, {
        params: { symbol },
      });
      return response.data;
    } catch (error: any) {
      console.error("getDepth - ERROR!", error.response?.data || error.message);
      return null;
    }
  }

  async getCandles(
    symbol: string,
    interval: string = "1m",
    startTime?: number,
    endTime?: number
  ): Promise<Candle[] | null> {
    if (!symbol) {
      console.error("symbol required");
      return null;
    }

    if (!interval) {
      console.error("interval required");
      return null;
    }

    const params: any = { symbol, interval };
    if (startTime) params.startTime = startTime;
    if (endTime) params.endTime = endTime;

    try {
      const response = await axios.get(`${process.env.API_URL}/api/v1/klines`, {
        params,
      });
      return response.data;
    } catch (error: any) {
      console.error(
        "getCandles - ERROR!",
        error.response?.data || error.message
      );
      return null;
    }
  }

  async getCandles5m(
    symbol: string,
    limit: number = 25
  ): Promise<Candle[] | null> {
    // Use the same approach as getKLines which works
    const timestamp = Date.now();
    const now = Math.floor(timestamp / 1000);
    const duration = Utils.getIntervalInSeconds("5m") * limit;
    const startTime = now - duration;
    const endTime = now;

    try {
      const response = await axios.get(`${process.env.API_URL}/api/v1/klines`, {
        params: {
          symbol,
          interval: "5m",
          startTime,
          endTime,
        },
      });
      return response.data;
    } catch (error: any) {
      console.error(
        "getCandles5m - ERROR!",
        error.response?.data || error.message
      );
      return null;
    }
  }

  async getVolume24h(symbol: string): Promise<number> {
    const candles = await this.getCandles5m(symbol, 288); // 24h = 288 * 5min
    if (!candles || candles.length === 0) return 0;

    return candles.reduce((total, candle) => {
      return total + parseFloat(candle.volume);
    }, 0);
  }

  async getCandlesAnalysis(symbol: string): Promise<{
    candles: Candle[];
    volume24h: number;
    price: number;
    high24h: number;
    low24h: number;
  } | null> {
    try {
      const candles = await this.getCandles5m(symbol, 25);
      if (!candles || candles.length === 0) return null;

      const volume24h = await this.getVolume24h(symbol);
      const latestCandle = candles[candles.length - 1]!;
      const price = parseFloat(latestCandle.close);

      // Calculate 24h high/low from more candles
      const candles24h = await this.getCandles5m(symbol, 288);
      let high24h = price;
      let low24h = price;

      if (candles24h) {
        candles24h.forEach((candle) => {
          const high = parseFloat(candle.high);
          const low = parseFloat(candle.low);
          if (high > high24h) high24h = high;
          if (low < low24h) low24h = low;
        });
      }

      return {
        candles,
        volume24h,
        price,
        high24h,
        low24h,
      };
    } catch (error: any) {
      console.error(
        "getCandlesAnalysis - ERROR!",
        error.response?.data || error.message
      );
      return null;
    }
  }

  async getRecentTrades(
    symbol: string,
    limit: number = 100
  ): Promise<any[] | null> {
    if (!symbol) {
      console.error("symbol required");
      return null;
    }

    try {
      const response = await axios.get(`${process.env.API_URL}/api/v1/trades`, {
        params: { symbol, limit },
      });
      return response.data;
    } catch (error: any) {
      console.error(
        "getRecentTrades - ERROR!",
        error.response?.data || error.message
      );
      return null;
    }
  }

  async getHistoryTrades(
    symbol: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<any[] | null> {
    if (!symbol) {
      console.error("symbol required");
      return null;
    }

    try {
      const response = await axios.get(
        `${process.env.API_URL}/api/v1/trades/history`,
        {
          params: { symbol, limit, offset },
        }
      );
      return response.data;
    } catch (error: any) {
      console.error(
        "getHistoryTrades - ERROR!",
        error.response?.data || error.message
      );
      return null;
    }
  }
}

export default new Markets();
