import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () =>
      import('./pages/home/home.component').then((m) => m.HomePageComponent),
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: '404',
    loadComponent: () =>
      import('./pages/error/error.component').then((m) => m.ErrorPageComponent),
    data: {
      errorType: 'NotFound',
    },
  },
  {
    path: '**',
    redirectTo: '/404', // TODO: Create a 404 page
  },
];
