import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-reset-password',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="auth-wrapper">
      <div class="auth-card">
        <div class="text-center mb-4">
          <i class="bi bi-shield-lock text-primary" style="font-size: 3rem;"></i>
          <h3 class="mt-2 fw-bold">Reset Password</h3>
          <p class="text-muted">Enter your new password</p>
        </div>

        @if (error) {
          <div class="alert alert-danger alert-dismissible fade show">
            {{ error }}
            <button type="button" class="btn-close" (click)="error = ''"></button>
          </div>
        }

        @if (success) {
          <div class="alert alert-success">
            <i class="bi bi-check-circle me-2"></i>
            Password reset successfully! You can now sign in with your new password.
          </div>
          <a routerLink="/login" class="btn btn-primary w-100">Go to Sign In</a>
        } @else {
          <form (ngSubmit)="onSubmit()">
            <div class="mb-3">
              <label class="form-label">New Password</label>
              <div class="input-group">
                <span class="input-group-text"><i class="bi bi-lock"></i></span>
                <input type="password" class="form-control" [(ngModel)]="newPassword" name="newPassword"
                       placeholder="Minimum 6 characters" minlength="6" required>
              </div>
            </div>
            <div class="mb-3">
              <label class="form-label">Confirm Password</label>
              <div class="input-group">
                <span class="input-group-text"><i class="bi bi-lock-fill"></i></span>
                <input type="password" class="form-control" [(ngModel)]="confirmPassword" name="confirmPassword"
                       placeholder="Re-enter password" required>
              </div>
            </div>
            <button type="submit" class="btn btn-primary w-100 mb-3" [disabled]="loading">
              @if (loading) {
                <span class="spinner-border spinner-border-sm me-2"></span>
              }
              Reset Password
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
export class ResetPassword implements OnInit {
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toast = inject(ToastService);

  token = '';
  newPassword = '';
  confirmPassword = '';
  error = '';
  loading = false;
  success = false;

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    if (!this.token) {
      this.error = 'Invalid or missing reset token';
    }
  }

  onSubmit() {
    if (this.newPassword !== this.confirmPassword) {
      this.error = 'Passwords do not match';
      return;
    }
    this.loading = true;
    this.error = '';
    this.auth.resetPassword(this.token, this.newPassword).pipe(
      finalize(() => this.loading = false)
    ).subscribe({
      next: () => {
        this.success = true;
        this.toast.success('Password reset successfully!');
      },
      error: (err) => {
        this.error = err.error?.message || err.error || 'Failed to reset password';
        this.toast.error(this.error);
      }
    });
  }
}
