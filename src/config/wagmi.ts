import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { createStorage } from "wagmi";
import { SUPPORTED_CHAINS } from "./constants";

export const config = getDefaultConfig({
  appName: "Predicta",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "YOUR_PROJECT_ID",
  chains: SUPPORTED_CHAINS,
  ssr: true,
  storage: createStorage({
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  }),
});
