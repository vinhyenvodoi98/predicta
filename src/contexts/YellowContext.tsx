/**
 * Yellow Network Client Context
 *
 * Provides a singleton Yellow client instance across the app.
 * Prevents connection/disconnection issues from React Strict Mode.
 */

"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { Client } from "yellow-ts";
import {
  createAuthRequestMessage,
  createAuthVerifyMessage,
  createEIP712AuthMessageSigner,
  AuthChallengeResponse,
  RPCMethod,
  RPCResponse,
  NitroliteClient,
  WalletStateSigner,
  Channel,
} from "@erc7824/nitrolite";
import { WalletClient, PublicClient, createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";
import { generateSessionKey, SessionAllowance } from "@/lib/yellow/auth";
import { getContractAddresses } from "@/lib/yellow/contracts";

interface AuthParams {
  scope: string;
  application: string;
  allowances: SessionAllowance[];
  expiresInSeconds?: number;
}

interface YellowContextValue {
  client: Client | null;
  isConnected: boolean;
  isConnecting: boolean;
  isAuthenticated: boolean;
  error: Error | null;
  sessionKey: ReturnType<typeof generateSessionKey> | null;
  channels: any[];
  balances: any[];
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  authenticate: (walletClient: WalletClient, authParams: AuthParams) => Promise<void>;
  sendMessage: (message: any) => void;
  listen: (callback: (message: RPCResponse) => void) => void;
}

const YellowContext = createContext<YellowContextValue | null>(null);

export function YellowProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [sessionKey, setSessionKey] = useState<ReturnType<typeof generateSessionKey> | null>(null);
  const [channels, setChannels] = useState<any[]>([]);
  const [balances, setBalances] = useState<any[]>([]);

  const clientRef = useRef<Client | null>(null);
  const url = process.env.NEXT_PUBLIC_CLEARNODE_WS_URL || "wss://clearnet-sandbox.yellow.com/ws";

  const connect = useCallback(async () => {
    // Prevent duplicate connections
    if (clientRef.current) {
      console.log("[YellowProvider] Already have a client instance");
      return;
    }

    if (isConnecting) {
      console.log("[YellowProvider] Connection already in progress");
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      console.log(`[YellowProvider] Connecting to ${url}...`);
      const client = new Client({ url });

      await client.connect();

      // Listen for connection close events
      if ((client as any).ws) {
        const ws = (client as any).ws;
        ws.addEventListener('close', (event: CloseEvent) => {
          console.warn(`[YellowProvider] WebSocket closed: ${event.code} ${event.reason}`);
          setIsConnected(false);
          setIsAuthenticated(false);
          if (event.code !== 1000) { // 1000 = normal closure
            setError(new Error(`Connection closed unexpectedly: ${event.reason || 'Unknown reason'}`));
          }
        });

        ws.addEventListener('error', (event: Event) => {
          console.error(`[YellowProvider] WebSocket error:`, event);
          setError(new Error('WebSocket error occurred'));
        });
      }

      clientRef.current = client;
      setIsConnected(true);
      setIsConnecting(false);
      console.log("[YellowProvider] ✓ Connected to Yellow Network");
    } catch (err) {
      console.error("[YellowProvider] Connection error:", err);
      setError(err instanceof Error ? err : new Error("Failed to connect"));
      setIsConnected(false);
      setIsConnecting(false);
      clientRef.current = null;
    }
  }, [url]);

  const disconnect = useCallback(async () => {
    if (clientRef.current) {
      try {
        console.log("[YellowProvider] Disconnecting from Yellow Network...");
        await clientRef.current.disconnect();
        console.log("[YellowProvider] ✓ Disconnected successfully");
      } catch (err) {
        console.error("[YellowProvider] Error during disconnect:", err);
      } finally {
        clientRef.current = null;
        setIsConnected(false);
        setIsAuthenticated(false);
        setSessionKey(null);
      }
    }
  }, []);

  const authenticate = useCallback(
    async (walletClient: WalletClient, authParams: AuthParams) => {
      if (!clientRef.current) {
        throw new Error("Not connected to Yellow Network");
      }

      if (!walletClient.account) {
        throw new Error("Wallet client has no account");
      }

      const client = clientRef.current;
      const userAddress = walletClient.account.address;

      // Step 1: Generate session key
      const newSessionKey = generateSessionKey();
      setSessionKey(newSessionKey);

      const expiresAt = BigInt(
        Math.floor(Date.now() / 1000) + (authParams.expiresInSeconds || 3600)
      );

      console.log("[YellowProvider] 🔐 Requesting authentication...");

      // Step 2: Send auth request
      const authRequestMessage = await createAuthRequestMessage({
        address: userAddress,
        session_key: newSessionKey.account.address,
        application: authParams.application,
        allowances: authParams.allowances.map(a => ({
          asset: a.asset,
          amount: a.amount,
        })),
        expires_at: expiresAt,
        scope: authParams.scope,
      });

      client.sendMessage(authRequestMessage);

      // Step 3: Listen for auth challenge and verify
      return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Authentication timeout"));
        }, 30000);

        const listener = async (message: RPCResponse) => {
          try {
            if (message.method === RPCMethod.AuthChallenge) {
              console.log("[YellowProvider] 🔑 Received auth challenge");

              // Prepare EIP-712 auth params
              const eip712AuthParams = {
                scope: authParams.scope,
                application: userAddress,
                participant: newSessionKey.account.address,
                expire: expiresAt,
                allowances: authParams.allowances.map(a => ({
                  asset: a.asset,
                  amount: a.amount,
                })),
                session_key: newSessionKey.account.address,
                expires_at: expiresAt,
              };

              // Create EIP-712 signer
              const eip712Signer = createEIP712AuthMessageSigner(
                walletClient,
                eip712AuthParams,
                { name: authParams.application }
              );

              // Create and send auth verify message
              const authVerifyMessage = await createAuthVerifyMessage(
                eip712Signer,
                message as AuthChallengeResponse
              );

              client.sendMessage(authVerifyMessage);
            } else if (message.method === RPCMethod.AuthVerify) {
              clearTimeout(timeout);

              if (message.params?.success) {
                console.log("[YellowProvider] ✅ Authentication successful");
                setIsAuthenticated(true);
                resolve();
              } else {
                console.error("[YellowProvider] ❌ Authentication failed:", message.params);
                reject(new Error("Authentication failed"));
              }
            } else if (message.method === RPCMethod.Error) {
              clearTimeout(timeout);
              console.error("[YellowProvider] ❌ Error:", message.params);
              const errorMessage = (message.params as any)?.message || (message.params as any)?.error || "Authentication error";
              reject(new Error(errorMessage));
            }
          } catch (err) {
            clearTimeout(timeout);
            reject(err);
          }
        };

        client.listen(listener);
      });
    },
    []
  );

  const sendMessage = useCallback((message: any) => {
    if (!clientRef.current) {
      throw new Error("Not connected to Yellow Network");
    }
    clientRef.current.sendMessage(message);
  }, []);

  const listen = useCallback((callback: (message: RPCResponse) => void) => {
    if (!clientRef.current) {
      throw new Error("Not connected to Yellow Network");
    }
    clientRef.current.listen(callback);
  }, []);

  // Set up global listener for channels and balances updates
  useEffect(() => {
    if (!clientRef.current || !isAuthenticated) return;

    console.log("[YellowProvider] Setting up listener for channels and balances updates...");

    const updateListener = (message: RPCResponse) => {
      // Handle channels update
      if (message.method === RPCMethod.ChannelsUpdate) {
        console.log("[YellowProvider] 📊 Channels update received:", message.params);
        setChannels(message.params?.channels || []);
      }

      // Handle balance update
      if (message.method === RPCMethod.BalanceUpdate) {
        console.log("[YellowProvider] 💰 Predicta balance:", message.params);
        setBalances(message.params?.balanceUpdates || []);
      }

      // Handle assets update (might contain balance info)
      if (message.method === 'assets' || (message as any).res?.[1] === 'assets') {
        const assetsData = (message as any).res?.[2] || message.params;
        if (assetsData?.assets) {
          console.log("[YellowProvider] 🪙 Assets update received:", assetsData.assets);
          setBalances(assetsData.assets);
        }
      }
    };

    clientRef.current.listen(updateListener);

    return () => {
      // Cleanup listener on unmount or when auth changes
      console.log("[YellowProvider] Cleaning up update listener");
    };
  }, [isAuthenticated]);

  const value: YellowContextValue = {
    client: clientRef.current,
    isConnected,
    isConnecting,
    isAuthenticated,
    error,
    sessionKey,
    channels,
    balances,
    connect,
    disconnect,
    authenticate,
    sendMessage,
    listen,
  };

  return <YellowContext.Provider value={value}>{children}</YellowContext.Provider>;
}

export function useYellow() {
  const context = useContext(YellowContext);
  if (!context) {
    throw new Error("useYellow must be used within a YellowProvider");
  }
  return context;
}
