import { Candle } from "../types/index.js";

export function sma(data: number[], period: number): (number | null)[] {
  if (period <= 0) throw new Error("Period must be positive.");
  const result: (number | null)[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      const slice = data.slice(i - period + 1, i + 1);
      const sum = slice.reduce((acc, val) => acc + val, 0);
      result.push(sum / period);
    }
  }
  return result;
}

export function ema(data: number[], period: number): (number | null)[] {
  if (period <= 0) throw new Error("Period must be positive.");
  const result: (number | null)[] = new Array(data.length).fill(null);

  if (data.length < period) return result;

  // Calculate first EMA as SMA
  let sumForFirstSma = 0;
  for (let i = 0; i < period; i++) {
    const value = data[i];
    if (value === undefined) throw new Error("Data contains undefined values");
    sumForFirstSma += value;
  }
  result[period - 1] = sumForFirstSma / period;

  // Calculate subsequent EMAs
  const k = 2 / (period + 1);
  for (let i = period; i < data.length; i++) {
    const value = data[i];
    if (value === undefined) throw new Error("Data contains undefined values");
    result[i] = value * k + result[i - 1]! * (1 - k);
  }

  return result;
}

export function stdev(data: number[], period: number): (number | null)[] {
  if (period <= 0) throw new Error("Period must be positive.");
  const result: (number | null)[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      const slice = data.slice(i - period + 1, i + 1);
      const mean = slice.reduce((acc, val) => acc + val, 0) / period;
      const variance =
        slice.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / period;
      result.push(Math.sqrt(variance));
    }
  }
  return result;
}

function trueRange(candle: Candle, prevCandle?: Candle): number {
  const high = parseFloat(candle.high);
  const low = parseFloat(candle.low);
  const prevClose = prevCandle ? parseFloat(prevCandle.close) : null;

  let tr = high - low;
  if (prevClose !== null) {
    tr = Math.max(tr, Math.abs(high - prevClose), Math.abs(low - prevClose));
  }
  return tr;
}

export function atr(candles: Candle[], period: number): (number | null)[] {
  if (period <= 0) throw new Error("Period must be positive.");
  const trs: number[] = [];

  for (let i = 0; i < candles.length; i++) {
    const currentCandle = candles[i];
    const prevCandle = i > 0 ? candles[i - 1] : undefined;
    if (!currentCandle) continue;
    trs.push(trueRange(currentCandle, prevCandle));
  }

  // ATR uses RMA (Running Moving Average)
  const result: (number | null)[] = new Array(candles.length).fill(null);
  if (candles.length < period) return result;

  let sumTr = 0;
  for (let i = 0; i < period; i++) {
    const trValue = trs[i];
    if (trValue === undefined) continue;
    sumTr += trValue;
  }
  result[period - 1] = sumTr / period;

  for (let i = period; i < candles.length; i++) {
    const trValue = trs[i];
    const prevResult = result[i - 1];
    if (
      trValue === undefined ||
      prevResult === null ||
      prevResult === undefined
    )
      continue;
    result[i] = (prevResult * (period - 1) + trValue) / period;
  }

  return result;
}

export function lowest(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      const slice = data.slice(i - period + 1, i + 1);
      result.push(Math.min(...slice));
    }
  }
  return result;
}

export function highest(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      const slice = data.slice(i - period + 1, i + 1);
      result.push(Math.max(...slice));
    }
  }
  return result;
}

// For series1 crossing over series2 at the most recent bar
export function crossover(
  series1: (number | null)[],
  series2: (number | null)[]
): boolean {
  if (series1.length < 2 || series2.length < 2) return false;

  const s1Current = series1[series1.length - 1];
  const s1Prev = series1[series1.length - 2];
  const s2Current = series2[series2.length - 1];
  const s2Prev = series2[series2.length - 2];

  if (
    s1Current === null ||
    s1Current === undefined ||
    s1Prev === null ||
    s1Prev === undefined ||
    s2Current === null ||
    s2Current === undefined ||
    s2Prev === null ||
    s2Prev === undefined
  )
    return false;

  return s1Prev <= s2Prev && s1Current > s2Current;
}

// For series1 crossing under series2 at the most recent bar
export function crossunder(
  series1: (number | null)[],
  series2: (number | null)[]
): boolean {
  if (series1.length < 2 || series2.length < 2) return false;

  const s1Current = series1[series1.length - 1];
  const s1Prev = series1[series1.length - 2];
  const s2Current = series2[series2.length - 1];
  const s2Prev = series2[series2.length - 2];

  if (
    s1Current === null ||
    s1Current === undefined ||
    s1Prev === null ||
    s1Prev === undefined ||
    s2Current === null ||
    s2Current === undefined ||
    s2Prev === null ||
    s2Prev === undefined
  )
    return false;

  return s1Prev >= s2Prev && s1Current < s2Current;
}
