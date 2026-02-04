/**
 * LMSR (Logarithmic Market Scoring Rule) utilities
 * Used for calculating prediction market prices
 */

/**
 * Calculate LMSR price for a given outcome
 * @param yesShares - Number of YES shares outstanding
 * @param noShares - Number of NO shares outstanding
 * @param liquidityParam - Liquidity parameter (b) - controls market depth
 * @returns Object with YES and NO prices (0-1 range)
 */
export function calculateLMSRPrices(
  yesShares: number,
  noShares: number,
  liquidityParam: number = 100
): { yesPrice: number; noPrice: number } {
  // Handle edge cases
  if (yesShares === 0 && noShares === 0) {
    return { yesPrice: 0.5, noPrice: 0.5 };
  }

  // LMSR formula: P(outcome) = exp(q_outcome / b) / sum(exp(q_i / b))
  // where q is quantity of shares and b is liquidity parameter

  const b = liquidityParam;

  // Calculate exponentials
  const expYes = Math.exp(yesShares / b);
  const expNo = Math.exp(noShares / b);
  const sum = expYes + expNo;

  // Calculate prices
  const yesPrice = expYes / sum;
  const noPrice = expNo / sum;

  return {
    yesPrice: Math.max(0.01, Math.min(0.99, yesPrice)), // Clamp between 1% and 99%
    noPrice: Math.max(0.01, Math.min(0.99, noPrice)),
  };
}

/**
 * Calculate cost to buy shares using LMSR
 * Cost = b * ln(exp((q_yes + amount) / b) + exp(q_no / b)) - b * ln(exp(q_yes / b) + exp(q_no / b))
 * @param yesShares - Current YES shares
 * @param noShares - Current NO shares
 * @param amount - Amount of shares to buy
 * @param buyYes - Whether buying YES (true) or NO (false)
 * @param liquidityParam - Liquidity parameter
 * @returns Cost in base currency units
 */
export function calculateLMSRCost(
  yesShares: number,
  noShares: number,
  amount: number,
  buyYes: boolean,
  liquidityParam: number = 100
): number {
  const b = liquidityParam;

  // Current cost function value
  const currentCost = b * Math.log(Math.exp(yesShares / b) + Math.exp(noShares / b));

  // New quantities after purchase
  const newYesShares = buyYes ? yesShares + amount : yesShares;
  const newNoShares = buyYes ? noShares : noShares + amount;

  // New cost function value
  const newCost = b * Math.log(Math.exp(newYesShares / b) + Math.exp(newNoShares / b));

  // Cost is the difference
  return Math.max(0, newCost - currentCost);
}

/**
 * Calculate expected payout for a position
 * @param shares - Number of shares held
 * @param won - Whether the position won
 * @returns Payout amount
 */
export function calculatePayout(shares: number, won: boolean): number {
  return won ? shares : 0;
}
