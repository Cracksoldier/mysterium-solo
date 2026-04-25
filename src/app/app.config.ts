import { ApplicationConfig, provideZonelessChangeDetection, APP_INITIALIZER } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { appRoutes } from './app.routes';
import { DataStore } from './state/data.store';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(appRoutes, withComponentInputBinding()),
    {
      provide: APP_INITIALIZER,
      useFactory: (data: DataStore) => () => data.loadAllCards(),
      deps: [DataStore],
      multi: true,
    },
  ],
};
