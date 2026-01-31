import { sepolia } from "wagmi/chains";

/**
 * Supported networks for the app
 * To add more chains in the future, simply add them to this array:
 * Example: [sepolia, mainnet, polygon, base]
 *
 * The user's current connected chain will be used dynamically for operations.
 * Wagmi hooks will automatically use the chain from the user's wallet connection.
 */
export const SUPPORTED_CHAINS = [sepolia] as const;
