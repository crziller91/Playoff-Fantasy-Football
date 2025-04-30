"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo } from 'react';
import { RootStore } from './RootStore';
import { useSocket } from '../hooks/useSocket';

// Create the context
const StoreContext = createContext<RootStore | null>(null);

// Create a provider component
export const StoreProvider = ({ children }: { children: ReactNode }) => {
  // Create store instance only once using useMemo
  const rootStore = useMemo(() => new RootStore(), []);
  const { socket, isConnected } = useSocket();

  // Set socket on the store when it connects
  useEffect(() => {
    rootStore.setSocket(socket);
  }, [socket, rootStore]);

  return (
    <StoreContext.Provider value={rootStore}>
      {children}
    </StoreContext.Provider>
  );
};

// Hook for using the store
export const useStore = () => {
  const context = useContext(StoreContext);
  if (context === null) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};