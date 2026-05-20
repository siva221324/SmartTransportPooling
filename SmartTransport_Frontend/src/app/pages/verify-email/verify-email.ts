import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-verify-email',
  imports: [RouterLink],
  template: `
    <div class="auth-wrapper">
      <div class="auth-card text-center">
        @if (loading()) {
          <div class="py-4">
            <div class="spinner-border text-primary mb-3" style="width: 3rem; height: 3rem;"></div>
            <h4 class="fw-bold">Verifying your email...</h4>
            <p class="text-muted">Please wait a moment</p>
          </div>
        } @else if (success()) {
          <div class="py-4">
            <i class="bi bi-check-circle-fill text-success" style="font-size: 4rem;"></i>
            <h3 class="mt-3 fw-bold">Email Verified!</h3>
            <p class="text-muted">Your email has been verified successfully. You can now sign in.</p>
            <a routerLink="/login" class="btn btn-primary mt-2">Go to Sign In</a>
          </div>
        } @else {
          <div class="py-4">
            <i class="bi bi-x-circle-fill text-danger" style="font-size: 4rem;"></i>
            <h3 class="mt-3 fw-bold">Verification Failed</h3>
            <p class="text-muted">{{ error() }}</p>
            <a routerLink="/login" class="btn btn-outline-primary mt-2">Go to Sign In</a>
          </div>
        }
      </div>
    </div>
  `
})
export class VerifyEmail implements OnInit {
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);

  loading = signal(true);
  success = signal(false);
  error = signal('');

  ngOnInit() {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.loading.set(false);
      this.error.set('Invalid or missing verification token');
      return;
    }
    this.auth.verifyEmail(token).subscribe({
      next: () => {
        this.loading.set(false);
        this.success.set(true);
        this.toast.success('Email verified successfully!');
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err.error?.message || err.error || 'Verification failed. The link may have expired.';
        this.error.set(msg);
        this.toast.error(msg);
      }
    });
  }
}
