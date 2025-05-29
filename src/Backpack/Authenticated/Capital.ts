import axios from "axios";
import { auth } from "./Authentication.js";
import { Balance } from "../../types/index.js";

interface CollateralData {
  netEquityAvailable: string;
  netEquity: string;
  maintenanceMargin: string;
  initialMargin: string;
  available: string;
  locked: string;
}

interface DepositData {
  id: string;
  blockchain: string;
  symbol: string;
  quantity: string;
  status: string;
  createdAt: string;
  txHash?: string;
}

interface WithdrawalData {
  id: string;
  blockchain: string;
  symbol: string;
  quantity: string;
  status: string;
  createdAt: string;
  txHash?: string;
  address: string;
}

interface DepositAddress {
  blockchain: string;
  address: string;
  memo?: string;
}

class Capital {
  async getBalances(): Promise<Balance[] | null> {
    const timestamp = Date.now();

    const headers = auth({
      instruction: "balanceQuery",
      timestamp,
      params: {},
    });

    try {
      const response = await axios.get(
        `${process.env.API_URL}/api/v1/capital`,
        {
          headers,
        }
      );

      return response.data;
    } catch (error: any) {
      console.error(
        "getBalances - ERROR!",
        error.response?.data || error.message
      );
      return null;
    }
  }

  async getCollateral(): Promise<CollateralData | null> {
    const timestamp = Date.now();

    const headers = auth({
      instruction: "collateralQuery",
      timestamp,
      params: {},
    });

    try {
      const response = await axios.get(
        `${process.env.API_URL}/api/v1/capital/collateral`,
        {
          headers,
        }
      );

      return response.data;
    } catch (error: any) {
      console.error(
        "getCollateral - ERROR!",
        error.response?.data || error.message
      );
      return null;
    }
  }

  async getDeposits(
    from: number = Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days
    to: number = Date.now(), // now
    limit: number = 100,
    offset: number = 0
  ): Promise<DepositData[] | null> {
    const timestamp = Date.now();

    const params = { from, to, limit, offset };

    const headers = auth({
      instruction: "depositQueryAll",
      timestamp,
      params,
    });

    try {
      const response = await axios.get(
        `${process.env.API_URL}/wapi/v1/capital/deposits`,
        {
          headers,
          params,
        }
      );

      return response.data;
    } catch (error: any) {
      console.error(
        "getDeposits - ERROR!",
        error.response?.data || error.message
      );
      return null;
    }
  }

  // blockchain: "Arbitrum" "Base" "Berachain" "Bitcoin" "BitcoinCash" "Bsc" "Cardano" "Dogecoin" "EqualsMoney" "Ethereum" "Hyperliquid" "Litecoin" "Polygon" "Sui" "Solana" "Story" "XRP"
  async getDepositAddress(blockchain: string): Promise<DepositAddress | null> {
    const timestamp = Date.now();

    if (!blockchain) {
      console.error("blockchain required");
      return null;
    }

    const params = { blockchain };

    const headers = auth({
      instruction: "depositAddressQuery",
      timestamp,
      params,
    });

    try {
      const response = await axios.get(
        `${process.env.API_URL}/wapi/v1/capital/deposit/address`,
        {
          headers,
          params,
        }
      );

      return response.data;
    } catch (error: any) {
      console.error(
        "getDepositAddress - ERROR!",
        error.response?.data || error.message
      );
      return null;
    }
  }

  async getWithdrawals(
    from: number = Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days
    to: number = Date.now(), // now
    limit: number = 100,
    offset: number = 0
  ): Promise<WithdrawalData[] | null> {
    const timestamp = Date.now();

    const params = { from, to, limit, offset };

    const headers = auth({
      instruction: "withdrawalQueryAll",
      timestamp,
      params,
    });

    try {
      const response = await axios.get(
        `${process.env.API_URL}/wapi/v1/capital/withdrawals`,
        {
          headers,
          params,
        }
      );

      return response.data;
    } catch (error: any) {
      console.error(
        "getWithdrawals - ERROR!",
        error.response?.data || error.message
      );
      return null;
    }
  }
}

export default new Capital();
