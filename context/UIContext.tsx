import React, { createContext, useContext, useState, ReactNode } from 'react';

interface DroneTarget {
  x: number;
  y: number;
  active: boolean;
  text?: string;
}

interface UIContextType {
  droneTarget: DroneTarget | null;
  setDroneTarget: (target: DroneTarget | null) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [droneTarget, setDroneTarget] = useState<DroneTarget | null>(null);

  return (
    <UIContext.Provider value={{ droneTarget, setDroneTarget }}>
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};