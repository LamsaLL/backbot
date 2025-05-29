import dotenv from "dotenv";
import Decision from "./src/Decision/Decision.js";
import TrailingStop from "./src/TrailingStop/TrailingStop.js";

dotenv.config();

async function startStopLoss(): Promise<void> {
  await TrailingStop.stopLoss();
  setTimeout(startStopLoss, 2500); // 2.5s
}

async function startDecision(): Promise<void> {
  await Decision.analyze();
  setTimeout(startDecision, 60000); // 1m
}

console.log("🤖 Starting Backbot Trading Bot...");
console.log(
  `📊 Simulation Mode: ${process.env.SIMULATION_MODE === "true" ? "ON" : "OFF"}`
);
console.log(`📈 Max Concurrent Orders: ${process.env.LIMIT_ORDER || 1}`);

startDecision();
startStopLoss();
