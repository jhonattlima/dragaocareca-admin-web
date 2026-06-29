import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AuthInterceptor } from './core/auth.interceptor';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { FeedComponent } from './pages/feed/feed.component';
import { HealthComponent } from './pages/health/health.component';
import { LoginComponent } from './pages/login/login.component';
import { ManageComponent } from './pages/manage/manage.component';
import { EpisodeFormComponent } from './pages/manage/episode-form.component';
import { MastheadComponent } from './pages/masthead/masthead.component';
import { MetricsComponent } from './pages/metrics/metrics.component';

@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    LoginComponent,
    FeedComponent,
    EpisodeFormComponent,
    MastheadComponent,
    ManageComponent,
    MetricsComponent,
    HealthComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    RouterModule,
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
