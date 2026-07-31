import { useLocation } from 'wouter';

export function useAppNavigation() {
  const [location, setLocation] = useLocation();

  return {
    location,
    navigate: setLocation,
  };
}
