import type { ComponentType, ReactNode } from 'react';
import {
  Route,
  Switch,
  Router as WouterRouter,
  useLocation,
} from 'wouter';

import { runtimeConfig } from '../runtimeConfig';
import { AppNavigationContext } from '../useAppNavigation';
import { NotFound } from './NotFound';

type WebAppRouterProps = {
  home: ComponentType;
};

function WouterNavigationBridge({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();

  return (
    <AppNavigationContext.Provider
      value={{
        location,
        navigate: (path) => setLocation(path),
      }}
    >
      {children}
    </AppNavigationContext.Provider>
  );
}

export function WebAppRouter({ home: Home }: WebAppRouterProps) {
  return (
    <WouterRouter base={runtimeConfig.basePath.replace(/\/$/, '')}>
      <WouterNavigationBridge>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/heute" component={Home} />
          <Route path="/tracker" component={Home} />
          <Route path="/verlauf" component={Home} />
          <Route path="/ernaehrung-sport" component={Home} />
          <Route path="/einstellungen" component={Home} />
          <Route component={NotFound} />
        </Switch>
      </WouterNavigationBridge>
    </WouterRouter>
  );
}
