import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return "₹0";
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function calculateOversString(legalBalls: number): string {
  const overs = Math.floor(legalBalls / 6);
  const balls = legalBalls % 6;
  return `${overs}.${balls}`;
}

export function calculateEconomyRate(runs: number, legalBalls: number): string {
  if (legalBalls === 0) return "0.00";
  return ((runs * 6) / legalBalls).toFixed(2);
}

export function calculateStrikeRate(runs: number, ballsFaced: number): string {
  if (ballsFaced === 0) return "0.00";
  return ((runs * 100) / ballsFaced).toFixed(2);
}

export function calculateBattingAverage(runs: number, dismissals: number): string {
  if (dismissals === 0) return "-";
  return (runs / dismissals).toFixed(2);
}
