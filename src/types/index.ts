export interface Market {
  id: string;
  title: string;
  description: string;
  category: string;
  endDate: string;
  totalVolume: number;
  options: MarketOption[];
  status: "open" | "closed" | "resolved";
  resolution?: string;
}

export interface MarketOption {
  id: string;
  label: string;
  probability: number;
  totalShares: number;
}

export interface Prediction {
  id: string;
  marketId: string;
  optionId: string;
  shares: number;
  timestamp: string;
  userId: string;
}
