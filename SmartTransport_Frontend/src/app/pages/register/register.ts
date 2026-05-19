import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="auth-split">
      <!-- Left Panel - Branding -->
      <div class="auth-hero">
        <div class="auth-hero-bg">
          <div class="orb orb-1"></div>
          <div class="orb orb-2"></div>
          <div class="grid-overlay"></div>
        </div>
        <div class="auth-hero-content">
          <a routerLink="/" class="brand-link">
            <i class="bi bi-bus-front-fill"></i>
            <span>SmartTransport</span>
          </a>
          <h2>Join the ride-sharing revolution</h2>
          <p>Create your account and start sharing smarter rides with your organization today.</p>
          <div class="auth-features">
            <div class="auth-feature"><i class="bi bi-check-circle-fill"></i> Free for all org members</div>
            <div class="auth-feature"><i class="bi bi-check-circle-fill"></i> Offer & book rides from one account</div>
            <div class="auth-feature"><i class="bi bi-check-circle-fill"></i> Verified org-email community</div>
          </div>
        </div>
      </div>

      <!-- Right Panel - Form -->
      <div class="auth-form-panel">
        <div class="auth-form-wrapper" style="max-width: 480px;">
          <div class="d-lg-none text-center mb-3">
            <a routerLink="/" class="brand-link-mobile">
              <i class="bi bi-bus-front-fill text-primary" style="font-size: 2rem;"></i>
            </a>
          </div>
          <h3 class="fw-bold mb-1">Create Account</h3>
          <p class="text-muted mb-4">Use your organization email to get started</p>

          @if (error) {
            <div class="alert alert-danger alert-dismissible fade show">
              {{ error }}
              <button type="button" class="btn-close" (click)="error = ''"></button>
            </div>
          }

          @if (registered) {
            <div class="alert alert-success">
              <i class="bi bi-envelope-check me-2"></i>
              Account created! A verification email has been sent to <strong>{{ form.email }}</strong>.
              Please check your inbox and verify your email before signing in.
            </div>
            <a routerLink="/login" class="btn btn-primary w-100 btn-lg">Go to Sign In</a>
          } @else {
          <form (ngSubmit)="onRegister()">
            <div class="mb-3">
              <label class="form-label fw-semibold">Full Name</label>
              <input type="text" class="form-control form-control-modern" [(ngModel)]="form.name" name="name" placeholder="John Doe" required>
            </div>
            <div class="mb-3">
              <label class="form-label fw-semibold">Organization Email</label>
              <input type="email" class="form-control form-control-modern" [(ngModel)]="form.email" name="email"
                     placeholder="you&#64;company.com" required>
            </div>
            <div class="mb-3">
              <label class="form-label fw-semibold">Password</label>
              <input type="password" class="form-control form-control-modern" [(ngModel)]="form.password" name="password"
                     placeholder="Min 6 characters" minlength="6" required>
            </div>
            <div class="row mb-3">
              <div class="col-6">
                <label class="form-label fw-semibold">Phone</label>
                <input type="tel" class="form-control form-control-modern" [(ngModel)]="form.phone" name="phone" placeholder="Optional">
              </div>
              <div class="col-6">
                <label class="form-label fw-semibold">Gender</label>
                <select class="form-select form-control-modern" [(ngModel)]="form.gender" name="gender">
                  <option value="">Select</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>
            <div class="row mb-4">
              <div class="col-6">
                <label class="form-label fw-semibold">Department</label>
                <input type="text" class="form-control form-control-modern" [(ngModel)]="form.department" name="department" placeholder="Optional">
              </div>
              <div class="col-6">
                <label class="form-label fw-semibold">City</label>
                <input type="text" class="form-control form-control-modern" [(ngModel)]="form.city" name="city" placeholder="e.g. Coimbatore" required>
              </div>
            </div>
            <button type="submit" class="btn btn-primary w-100 btn-lg mb-3" [disabled]="loading">
              @if (loading) {
                <span class="spinner-border spinner-border-sm me-2"></span>
              }
              Create Account <i class="bi bi-arrow-right ms-1"></i>
            </button>
          </form>
          <p class="text-center mb-0">
            Already have an account? <a routerLink="/login" class="text-decoration-none fw-semibold">Sign in</a>
          </p>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-split { display: flex; min-height: 100vh; }
    .auth-hero {
      flex: 1; position: relative; overflow: hidden;
      background: #0a0a1e; display: none;
    }
    @media (min-width: 992px) { .auth-hero { display: flex; align-items: center; justify-content: center; } }
    .auth-hero-bg { position: absolute; inset: 0; }
    .auth-hero-bg .orb {
      position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.4;
      animation: float 8s ease-in-out infinite;
    }
    .auth-hero-bg .orb-1 { width: 400px; height: 400px; background: #4e54c8; top: -10%; right: -10%; }
    .auth-hero-bg .orb-2 { width: 300px; height: 300px; background: #2ecc71; bottom: -5%; left: -5%; animation-delay: -3s; }
    .auth-hero-bg .grid-overlay {
      position: absolute; inset: 0;
      background-image:
        linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
      background-size: 60px 60px;
    }
    @keyframes float {
      0%, 100% { transform: translate(0,0) scale(1); }
      33% { transform: translate(30px,-30px) scale(1.05); }
      66% { transform: translate(-20px,20px) scale(0.95); }
    }
    .auth-hero-content { position: relative; z-index: 1; padding: 60px; max-width: 480px; }
    .brand-link {
      display: flex; align-items: center; gap: 10px;
      font-size: 1.3rem; font-weight: 700; color: #fff; text-decoration: none;
      margin-bottom: 40px;
    }
    .brand-link i { color: #8f94fb; font-size: 1.5rem; }
    .brand-link-mobile { text-decoration: none; }
    .auth-hero-content h2 { color: #fff; font-weight: 800; font-size: 2rem; margin-bottom: 12px; }
    .auth-hero-content p { color: rgba(255,255,255,0.6); font-size: 1.05rem; line-height: 1.6; margin-bottom: 30px; }
    .auth-features { display: flex; flex-direction: column; gap: 12px; }
    .auth-feature {
      color: rgba(255,255,255,0.7); font-size: 0.95rem;
      display: flex; align-items: center; gap: 10px;
    }
    .auth-feature i { color: #2ecc71; }
    .auth-form-panel {
      flex: 1; display: flex; align-items: center; justify-content: center;
      padding: 40px; background: #fff;
    }
    .auth-form-panel h3 { color: #1a1a2e; }
    .auth-form-panel p, .auth-form-panel .text-muted { color: #6c757d !important; }
    .auth-form-panel .form-label { color: #344054; font-weight: 600; font-size: 0.875rem; }
    .auth-form-panel a { color: #4e54c8; }
    .auth-form-panel a:hover { color: #3b3f9e; }
    .auth-form-wrapper { width: 100%; }
    .form-control-modern {
      background: #fff; color: #1a1a2e;
      border: 1px solid #e0e3eb; border-radius: 10px; padding: 10px 16px;
    }
    .form-control-modern::placeholder { color: #adb5bd; }
    .form-control-modern:focus { box-shadow: none; border-color: #4e54c8; background: #fff; color: #1a1a2e; }
    .form-select.form-control-modern { color: #1a1a2e; background-color: #fff; }
    .form-select.form-control-modern option { color: #1a1a2e; background: #fff; }
    .alert-danger { background: #f8d7da; border-color: #f5c2c7; color: #842029; }
    .alert-success { background: #d1e7dd; border-color: #badbcc; color: #0f5132; }
  `]
})
export class Register {
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  form = { name: '', email: '', password: '', phone: '', gender: '', department: '', city: '', role: 'USER' };
  error = '';
  loading = false;
  registered = false;

  onRegister() {
    this.loading = true;
    this.error = '';
    this.auth.register(this.form).subscribe({
      next: () => {
        this.loading = false;
        this.registered = true;
        this.toast.success('Account created! Check your email to verify.');
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Registration failed. Ensure your email domain is whitelisted.';
        this.toast.error(this.error);
      }
    });
  }
}

