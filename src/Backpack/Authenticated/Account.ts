import axios from "axios";
import { auth } from "./Authentication.js";
import { Account as AccountType } from "../../types/index.js";

class Account {
  async getAccount(): Promise<AccountType | null> {
    const timestamp = Date.now();

    const headers = auth({
      instruction: "accountQuery",
      timestamp,
      params: {},
    });

    try {
      const response = await axios.get(
        `${process.env.API_URL}/api/v1/account`,
        {
          headers,
        }
      );

      return response.data;
    } catch (error: any) {
      console.error(
        "getAccount - ERROR!",
        error.response?.data || error.message
      );
      return null;
    }
  }

  // Symbol is token symbol not market, ex: BTC, SOL, etc.
  async getMaxBorrowQuantity(symbol: string): Promise<any | null> {
    const timestamp = Date.now();

    if (!symbol) {
      console.error("symbol required");
      return null;
    }

    const headers = auth({
      instruction: "maxBorrowQuantity",
      timestamp,
      params: { symbol },
    });

    try {
      const response = await axios.get(
        `${process.env.API_URL}/api/v1/account/limits/borrow`,
        {
          headers,
          params: { symbol },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error(
        "getMaxBorrowQuantity - ERROR!",
        error.response?.data || error.message
      );
      return null;
    }
  }

  //side: "Bid" "Ask"
  async getMaxOrderQuantity(
    symbol: string,
    side: "Bid" | "Ask"
  ): Promise<any | null> {
    const timestamp = Date.now();

    if (!symbol) {
      console.error("symbol required");
      return null;
    }

    if (!side) {
      console.error("side required");
      return null;
    }

    const headers = auth({
      instruction: "maxOrderQuantity",
      timestamp,
      params: { symbol, side },
    });

    try {
      const response = await axios.get(
        `${process.env.API_URL}/api/v1/account/limits/order`,
        {
          headers,
          params: { symbol, side },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error(
        "getMaxOrderQuantity - ERROR!",
        error.response?.data || error.message
      );
      return null;
    }
  }

  async getMaxWithdrawalQuantity(
    symbol: string,
    autoBorrow: boolean = true,
    autoLendRedeem: boolean = true
  ): Promise<any | null> {
    const timestamp = Date.now();

    if (!symbol) {
      console.error("symbol required");
      return null;
    }

    const headers = auth({
      instruction: "maxWithdrawalQuantity",
      timestamp,
      params: { symbol, autoBorrow, autoLendRedeem },
    });

    try {
      const response = await axios.get(
        `${process.env.API_URL}/api/v1/account/limits/withdrawal`,
        {
          headers,
          params: { symbol, autoBorrow, autoLendRedeem },
        }
      );
      return response.data;
    } catch (error: any) {
      console.error(
        "getMaxWithdrawalQuantity - ERROR!",
        error.response?.data || error.message
      );
      return null;
    }
  }

  async updateAccount(
    leverageLimit: number,
    autoBorrowSettlements: boolean = true,
    autoLend: boolean = true,
    autoRepayBorrows: boolean = true
  ): Promise<any | null> {
    const timestamp = Date.now();

    if (!leverageLimit) {
      console.error("leverageLimit required");
      return null;
    }

    const params = {
      autoBorrowSettlements,
      autoLend,
      autoRepayBorrows,
      leverageLimit,
    };

    const headers = auth({
      instruction: "accountUpdate",
      timestamp,
      params,
    });

    try {
      const response = await axios.patch(
        `${process.env.API_URL}/api/v1/account`,
        params,
        {
          headers,
        }
      );
      return response.data;
    } catch (error: any) {
      console.error(
        "updateAccount - ERROR!",
        error.response?.data || error.message
      );
      return null;
    }
  }
}

export default new Account();
