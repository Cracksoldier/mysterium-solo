import { Routes } from '@angular/router';
import { activeGameGuard } from './core/guards/active-game.guard';

export const appRoutes: Routes = [
  { path: '', loadChildren: () => import('./features/home/home.routes').then(m => m.homeRoutes) },
  { path: 'setup', loadChildren: () => import('./features/setup/setup.routes').then(m => m.setupRoutes) },
  {
    path: 'board',
    canActivate: [activeGameGuard],
    loadChildren: () => import('./features/board/board.routes').then(m => m.boardRoutes),
  },
  {
    path: 'final',
    canActivate: [activeGameGuard],
    loadChildren: () => import('./features/final-phase/final-phase.routes').then(m => m.finalPhaseRoutes),
  },
  { path: 'result', loadChildren: () => import('./features/result/result.routes').then(m => m.resultRoutes) },
  { path: '**', redirectTo: '' },
];
