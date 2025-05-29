import axios from "axios";
import { auth } from "./Authentication.js";
import {
  OrderData,
  Order as OrderType,
  ApiResponse,
} from "../../types/index.js";

interface OrderParams {
  symbol?: string;
  orderId?: string;
  clientId?: number;
  marketType?: string;
  orderType?: string;
}

class Order {
  async getOpenOrder(
    symbol: string,
    orderId?: string,
    clientId?: number
  ): Promise<OrderType | null> {
    const timestamp = Date.now();

    if (!symbol) {
      console.error("symbol required");
      return null;
    }

    if (!orderId && !clientId) {
      console.error("clientId or orderId is required");
      return null;
    }

    const params: OrderParams = { symbol };
    if (orderId) params.orderId = orderId;
    if (clientId) params.clientId = clientId;

    const headers = auth({
      instruction: "orderQuery",
      timestamp,
      params,
    });

    try {
      const response = await axios.get(`${process.env.API_URL}/api/v1/order`, {
        headers,
        params,
      });
      return response.data;
    } catch (error: any) {
      console.error(
        "getOpenOrder - ERROR!",
        error.response?.data || error.message
      );
      return null;
    }
  }

  // marketType: "SPOT" "PERP" "IPERP" "DATED" "PREDICTION" "RFQ"
  async getOpenOrders(
    symbol?: string,
    marketType: string = "PERP"
  ): Promise<OrderType[] | null> {
    const timestamp = Date.now();

    const params: OrderParams = {};
    if (symbol) params.symbol = symbol;
    if (marketType) params.marketType = marketType;

    const headers = auth({
      instruction: "orderQueryAll",
      timestamp,
      params,
    });

    try {
      const response = await axios.get(`${process.env.API_URL}/api/v1/orders`, {
        headers,
        params,
      });
      return response.data;
    } catch (error: any) {
      console.error(
        "getOpenOrders - ERROR!",
        error.response?.data || error.message
      );
      return null;
    }
  }

  async executeOrder(body: OrderData): Promise<ApiResponse | null> {
    const timestamp = Date.now();
    const headers = auth({
      instruction: "orderExecute",
      timestamp,
      params: body,
    });

    try {
      const { data } = await axios.post(
        `${process.env.API_URL}/api/v1/order`,
        body,
        {
          headers,
        }
      );
      console.log("✅ executeOrder Success!", data.symbol);
      return data;
    } catch (err: any) {
      console.error(
        "❌ executeOrder - Error!",
        body,
        err.response?.data || err.message
      );
      return null;
    }
  }

  async cancelOpenOrder(
    symbol: string,
    orderId?: string,
    clientId?: number
  ): Promise<ApiResponse | null> {
    const timestamp = Date.now();

    if (!symbol) {
      console.error("symbol required");
      return null;
    }

    const params: OrderParams = { symbol };
    if (orderId) params.orderId = orderId;
    if (clientId) params.clientId = clientId;

    const headers = auth({
      instruction: "orderCancel",
      timestamp,
      params,
    });

    try {
      const response = await axios.delete(
        `${process.env.API_URL}/api/v1/order`,
        {
          headers,
          data: params,
        }
      );
      return response.data;
    } catch (error: any) {
      console.error(
        "cancelOpenOrder - ERROR!",
        error.response?.data || error.message
      );
      return null;
    }
  }

  async cancelOpenOrders(
    symbol: string,
    orderType?: string
  ): Promise<ApiResponse | null> {
    const timestamp = Date.now();

    if (!symbol) {
      console.error("symbol required");
      return null;
    }

    const params: OrderParams = { symbol };
    if (orderType) params.orderType = orderType;

    const headers = auth({
      instruction: "orderCancelAll",
      timestamp,
      params,
    });

    try {
      const response = await axios.delete(
        `${process.env.API_URL}/api/v1/orders`,
        {
          headers,
          data: params,
        }
      );
      return response.data;
    } catch (error: any) {
      console.error(
        "cancelOpenOrders - ERROR!",
        error.response?.data || error.message
      );
      return null;
    }
  }
}

export default new Order();
