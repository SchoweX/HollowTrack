import type { ComponentType } from 'react';
import { Route, Switch, Router as WouterRouter } from 'wouter';

import { runtimeConfig } from '../runtimeConfig';
import { NotFound } from './NotFound';

type WebAppRouterProps = {
  home: ComponentType;
};

export function WebAppRouter({ home: Home }: WebAppRouterProps) {
  return (
    <WouterRouter base={runtimeConfig.basePath.replace(/\/$/, '')}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/heute" component={Home} />
        <Route path="/tracker" component={Home} />
        <Route path="/verlauf" component={Home} />
        <Route path="/ernaehrung-sport" component={Home} />
        <Route path="/einstellungen" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </WouterRouter>
  );
}
