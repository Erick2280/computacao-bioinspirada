import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () =>
      import('./global/pages/home/home.component').then(
        (m) => m.HomePageComponent,
      ),
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: '404',
    loadComponent: () =>
      import('./global/pages/error/error.component').then(
        (m) => m.ErrorPageComponent,
      ),
    data: {
      errorType: 'NotFound',
    },
  },
  {
    path: '**',
    redirectTo: '/404',
  },
];
