import { createContext, useContext } from 'react';

export type AppNavigation = {
  location: string;
  navigate: (path: string) => void;
};

export const AppNavigationContext = createContext<AppNavigation | null>(null);

export function useAppNavigation(): AppNavigation {
  const navigation = useContext(AppNavigationContext);

  if (!navigation) {
    throw new Error('AppNavigationContext wurde nicht bereitgestellt.');
  }

  return navigation;
}
