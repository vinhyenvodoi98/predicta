import { Market } from "@/types";

export const markets: Market[] = [
  {
    id: "1",
    title: "Will Bitcoin reach $100,000 by end of 2026?",
    description:
      "This market resolves to YES if Bitcoin (BTC) reaches or exceeds $100,000 USD on any major exchange by December 31, 2026, 11:59 PM UTC.",
    category: "Crypto",
    endDate: "2026-12-31",
    totalVolume: 45230,
    status: "open",
    options: [
      { id: "1a", label: "Yes", probability: 0.68, totalShares: 30756 },
      { id: "1b", label: "No", probability: 0.32, totalShares: 14474 },
    ],
  },
  {
    id: "2",
    title: "Will there be a major AI breakthrough in 2026?",
    description:
      "This market resolves to YES if a widely recognized AI research lab announces a breakthrough that is covered by at least 3 major news outlets.",
    category: "Technology",
    endDate: "2026-12-31",
    totalVolume: 32100,
    status: "open",
    options: [
      { id: "2a", label: "Yes", probability: 0.74, totalShares: 23754 },
      { id: "2b", label: "No", probability: 0.26, totalShares: 8346 },
    ],
  },
  {
    id: "3",
    title: "Will SpaceX successfully land humans on Mars?",
    description:
      "This market resolves to YES if SpaceX successfully lands human astronauts on Mars and they survive for at least 24 hours.",
    category: "Space",
    endDate: "2030-12-31",
    totalVolume: 58900,
    status: "open",
    options: [
      { id: "3a", label: "Yes", probability: 0.42, totalShares: 24738 },
      { id: "3b", label: "No", probability: 0.58, totalShares: 34162 },
    ],
  },
  {
    id: "4",
    title: "Will global temperatures rise by 1.5°C by 2027?",
    description:
      "This market resolves to YES if the global average temperature anomaly exceeds 1.5°C above pre-industrial levels according to NASA or NOAA data.",
    category: "Climate",
    endDate: "2027-12-31",
    totalVolume: 28450,
    status: "open",
    options: [
      { id: "4a", label: "Yes", probability: 0.61, totalShares: 17354 },
      { id: "4b", label: "No", probability: 0.39, totalShares: 11096 },
    ],
  },
  {
    id: "5",
    title: "Will a quantum computer solve a real-world problem by 2028?",
    description:
      "This market resolves to YES if a quantum computer demonstrates practical advantage over classical computers in solving a commercially relevant problem.",
    category: "Technology",
    endDate: "2028-12-31",
    totalVolume: 19800,
    status: "open",
    options: [
      { id: "5a", label: "Yes", probability: 0.55, totalShares: 10890 },
      { id: "5b", label: "No", probability: 0.45, totalShares: 8910 },
    ],
  },
  {
    id: "6",
    title: "Will autonomous vehicles be legal in all US states?",
    description:
      "This market resolves to YES if fully autonomous vehicles (Level 5) are legal to operate without a human driver in all 50 US states.",
    category: "Transportation",
    endDate: "2029-12-31",
    totalVolume: 22340,
    status: "open",
    options: [
      { id: "6a", label: "Yes", probability: 0.38, totalShares: 8489 },
      { id: "6b", label: "No", probability: 0.62, totalShares: 13851 },
    ],
  },
];
