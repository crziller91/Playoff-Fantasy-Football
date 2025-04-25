"use client";

import { createContext, ReactNode, useContext } from 'react';
import { RootStore } from './RootStore';

// Create the context
const StoreContext = createContext<RootStore | null>(null);

// Create a provider component
export const StoreProvider = ({ children }: { children: ReactNode }) => {
  // Create store instance only once
  const rootStore = new RootStore();

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