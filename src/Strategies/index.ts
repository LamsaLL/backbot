import { IStrategy, StrategyConfig } from "./StrategyInterface.js";
import { BBEMAVolumeFarmerStrategy } from "./BBEMAVolumeFarmerStrategy.js";

export class StrategyFactory {
  private static strategies: Map<string, new () => IStrategy> = new Map([
    ["BBEMA_VOLUME_FARMER", BBEMAVolumeFarmerStrategy as any],
  ]);

  static createStrategy(strategyName: string): IStrategy {
    const StrategyClass = this.strategies.get(strategyName.toUpperCase());

    if (!StrategyClass) {
      throw new Error(
        `Strategy "${strategyName}" not found. Available strategies: ${Array.from(
          this.strategies.keys()
        ).join(", ")}`
      );
    }

    return new StrategyClass();
  }

  static getAvailableStrategies(): string[] {
    return Array.from(this.strategies.keys());
  }

  static async initializeStrategy(
    strategyName: string,
    config: StrategyConfig
  ): Promise<IStrategy> {
    const strategy = this.createStrategy(strategyName);
    await strategy.initialize(config);
    return strategy;
  }
}

export * from "./StrategyInterface.js";
export * from "./BBEMAVolumeFarmerStrategy.js";
