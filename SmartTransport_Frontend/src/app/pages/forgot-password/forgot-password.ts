import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-forgot-password',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="auth-wrapper">
      <div class="auth-card">
        <div class="text-center mb-4">
          <i class="bi bi-envelope-check text-primary" style="font-size: 3rem;"></i>
          <h3 class="mt-2 fw-bold">Forgot Password</h3>
          <p class="text-muted">Enter your email to receive a reset link</p>
        </div>

        @if (error()) {
          <div class="alert alert-danger alert-dismissible fade show">
            {{ error() }}
            <button type="button" class="btn-close" (click)="error.set('')"></button>
          </div>
        }

        @if (sent()) {
          <div class="alert alert-success">
            <i class="bi bi-check-circle me-2"></i>
            A password reset link has been sent to <strong>{{ email }}</strong>. Please check your inbox.
          </div>
          <p class="text-center mt-3">
            <a routerLink="/login" class="text-decoration-none fw-semibold">Back to Sign In</a>
          </p>
        } @else {
          <form (ngSubmit)="onSubmit()">
            <div class="mb-3">
              <label class="form-label">Email</label>
              <div class="input-group">
                <span class="input-group-text"><i class="bi bi-envelope"></i></span>
                <input type="email" class="form-control" [(ngModel)]="email" name="email"
                       placeholder="you@organization.com" required>
              </div>
            </div>
            <button type="submit" class="btn btn-primary w-100 mb-3" [disabled]="loading()">
              @if (loading()) {
                <span class="spinner-border spinner-border-sm me-2"></span>
              }
              Send Reset Link
            </button>
          </form>
          <p class="text-center mb-0">
            <a routerLink="/login" class="text-decoration-none fw-semibold">Back to Sign In</a>
          </p>
        }
      </div>
    </div>
  `
})
export class ForgotPassword {
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  email = '';
  error = signal('');
  loading = signal(false);
  sent = signal(false);

  onSubmit() {
    this.loading.set(true);
    this.error.set('');
    this.auth.forgotPassword(this.email).pipe(
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: () => {
        this.sent.set(true);
        this.toast.success('Reset link sent! Check your email.');
      },
      error: (err) => {
        const msg = err.error?.message || err.error || 'Failed to send reset link';
        this.error.set(msg);
        this.toast.error(msg);
      }
    });
  }
}
