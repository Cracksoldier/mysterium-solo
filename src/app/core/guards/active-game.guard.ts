import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PersistenceService } from '../services/persistence.service';

export const activeGameGuard: CanActivateFn = () => {
  const persistence = inject(PersistenceService);
  const router = inject(Router);
  if (persistence.loadSession()) return true;
  return router.parseUrl('/');
};
