
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { config } from './app/app.config.server';

// Export a default function that takes a context argument for SSR
export default function bootstrap(context: any) {
  return bootstrapApplication(AppComponent, config, context);
}
