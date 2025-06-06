import { Platform } from '@angular/cdk/platform';
import { inject } from '@angular/core';
import {
  IsActiveMatchOptions,
  Navigation,
  Router,
  ViewTransitionInfo,
} from '@angular/router';

export const viewTransitionHandler = ({ transition }: ViewTransitionInfo) => {
  const router = inject(Router);
  const platform = inject(Platform);

  const currentNavigation = router.getCurrentNavigation()!;

  if (
    usingBrowserButtonsOnIosWebkit(currentNavigation, platform) ||
    isTransitioningToSameRoutePath(currentNavigation, router)
  ) {
    transition.skipTransition();
  }
};

const usingBrowserButtonsOnIosWebkit = (
  currentNavigation: Navigation,
  platform: Platform,
) => {
  return (
    currentNavigation.trigger === 'popstate' && platform.IOS && platform.WEBKIT
  );
};

const isTransitioningToSameRoutePath = (
  currentNavigation: Navigation,
  router: Router,
) => {
  const targetUrl = currentNavigation.finalUrl!;

  const config: IsActiveMatchOptions = {
    paths: 'exact',
    matrixParams: 'exact',
    fragment: 'ignored',
    queryParams: 'ignored',
  };

  return router.isActive(targetUrl, config);
};
