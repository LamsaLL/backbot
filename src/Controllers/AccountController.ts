import Markets from "../Backpack/Public/Markets.js";
import Account from "../Backpack/Authenticated/Account.js";
import Capital from "../Backpack/Authenticated/Capital.js";
import { Market } from "../types/index.js";

interface AccountData {
  maxOpenOrders: number;
  minVolumeDollar: number;
  fee: number;
  leverage: number;
  capitalAvailable: number;
  markets: {
    symbol: string;
    decimal_quantity: number;
    decimal_price: number;
  }[];
}

class AccountController {
  async get(): Promise<AccountData> {
    const Accounts = await Account.getAccount();
    const Collateral = await Capital.getCollateral();
    let markets = await Markets.getMarkets();

    if (!Accounts) {
      throw new Error("Failed to get account data");
    }

    if (!Collateral) {
      throw new Error("Failed to get collateral data");
    }

    if (!markets) {
      throw new Error("Failed to get markets data");
    }

    const filteredMarkets = markets
      .filter(
        (el: any) => el.marketType === "PERP" && el.orderBookState === "Open"
      )
      .map((el: any) => {
        return {
          symbol: el.symbol,
          decimal_quantity: String(
            el.filters.quantity.stepSize.split(".")[1] || ""
          ).length,
          decimal_price: String(el.filters.price.tickSize.split(".")[1] || "")
            .length,
        };
      });

    const makerFee = parseFloat(Accounts.futuresMakerFee || "0") / 10000;
    const leverage = parseInt(Accounts.leverageLimit?.toString() || "1");
    const capitalAvailable =
      parseFloat(Collateral.netEquityAvailable || "0") * leverage;

    const maxOpenOrders = parseInt(process.env.LIMIT_ORDER || "1");
    const minVolumeDollar = capitalAvailable / maxOpenOrders;

    const obj: AccountData = {
      maxOpenOrders,
      minVolumeDollar,
      fee: makerFee,
      leverage,
      capitalAvailable,
      markets: filteredMarkets,
    };

    return obj;
  }
}

export default new AccountController();
