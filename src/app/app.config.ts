import { ApplicationConfig, provideZonelessChangeDetection, APP_INITIALIZER } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { appRoutes } from './app.routes';
import { DataStore } from './state/data.store';
import { I18nService } from './core/services/i18n.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(appRoutes, withComponentInputBinding()),
    {
      provide: APP_INITIALIZER,
      useFactory: (i18n: I18nService, data: DataStore) => async () => {
        await i18n.init();
        await data.loadAllCards(i18n.lang());
      },
      deps: [I18nService, DataStore],
      multi: true,
    },
  ],
};
