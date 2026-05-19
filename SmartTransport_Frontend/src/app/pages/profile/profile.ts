import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-profile',
  imports: [FormsModule],
  template: `
    <div class="pg-head">
      <h2><i class="bi bi-person-circle me-2"></i>My Profile</h2>
    </div>

    @if (user()) {
      <div class="row g-4">
        <div class="col-md-4">
          <div class="panel">
            <div class="panel-body text-center">
              <div class="avatar-wrap">
                @if (user()!.profilePic) {
                  <img [src]="profilePicUrl()" class="avatar-img" alt="Profile">
                } @else {
                  <div class="avatar-placeholder"><i class="bi bi-person-fill"></i></div>
                }
              </div>
              <div class="mb-3">
                <label class="upload-btn">
                  <i class="bi bi-camera me-1"></i> Change Photo
                  <input type="file" accept="image/*" hidden (change)="onPicSelected($event)">
                </label>
                @if (uploadingPic) { <span class="spinner-border spinner-border-sm ms-2" style="color:#8f88ff"></span> }
              </div>
              <h5 class="fw-bold" style="color:#f0f0f5">{{ user()!.name }}</h5>
              <p style="color:rgba(255,255,255,0.4)">{{ user()!.email }}</p>
              <span class="role-badge">{{ user()!.role }}</span>
              <div class="profile-details">
                <div class="detail-row"><i class="bi bi-phone"></i><span>{{ user()!.phone || 'Not set' }}</span></div>
                <div class="detail-row"><i class="bi bi-gender-ambiguous"></i><span>{{ user()!.gender || 'Not set' }}</span></div>
                <div class="detail-row"><i class="bi bi-building"></i><span>{{ user()!.organizationDomain || 'N/A' }}</span></div>
                <div class="detail-row"><i class="bi bi-diagram-3"></i><span>{{ user()!.department || 'Not set' }}</span></div>
                <div class="detail-row"><i class="bi bi-geo-alt"></i><span>{{ user()!.city || 'Not set' }}</span></div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-md-8">
          <div class="panel">
            <div class="panel-head"><h6>Edit Profile</h6></div>
            <div class="panel-body">
              @if (success) { <div class="alert alert-success">Profile updated successfully!</div> }
              @if (error) { <div class="alert alert-danger">{{ error }}</div> }
              <form (ngSubmit)="onUpdate()">
                <div class="mb-3">
                  <label class="form-label">Name</label>
                  <input type="text" class="form-control" [(ngModel)]="form.name" name="name" required>
                </div>
                <div class="row mb-3">
                  <div class="col-6">
                    <label class="form-label">Phone</label>
                    <input type="tel" class="form-control" [(ngModel)]="form.phone" name="phone">
                  </div>
                  <div class="col-6">
                    <label class="form-label">Gender</label>
                    <select class="form-select" [(ngModel)]="form.gender" name="gender">
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>
                <div class="row mb-3">
                  <div class="col-6">
                    <label class="form-label">Department</label>
                    <input type="text" class="form-control" [(ngModel)]="form.department" name="department">
                  </div>
                  <div class="col-6">
                    <label class="form-label">City</label>
                    <input type="text" class="form-control" [(ngModel)]="form.city" name="city" placeholder="e.g. Coimbatore">
                  </div>
                </div>
                <button type="submit" class="btn btn-primary"><i class="bi bi-check-lg me-1"></i> Save Changes</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host { display: block; }
    .pg-head { margin-bottom: 24px; }
    .pg-head h2 { font-weight: 800; font-size: 1.5rem; color: #f0f0f5; margin: 0; }

    .panel { background: #1c1c2e; border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; overflow: hidden; }
    .panel-head { padding: 16px 20px 12px; border-bottom: 1px solid rgba(255,255,255,0.04); }
    .panel-head h6 { margin: 0; font-weight: 700; color: #f0f0f5; }
    .panel-body { padding: 24px; }

    .avatar-wrap { margin-bottom: 16px; }
    .avatar-img { width: 100px; height: 100px; border-radius: 50%; object-fit: cover; border: 3px solid rgba(108,99,255,0.3); }
    .avatar-placeholder {
      width: 100px; height: 100px; border-radius: 50%; display: inline-flex;
      align-items: center; justify-content: center;
      background: rgba(108,99,255,0.15); color: #8f88ff; font-size: 3rem;
      margin: 0 auto;
    }
    .upload-btn {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 6px 14px; border-radius: 8px;
      border: 1px solid rgba(108,99,255,0.2); color: #8f88ff;
      font-size: 0.82rem; font-weight: 600; cursor: pointer;
      transition: all 0.2s;
    }
    .upload-btn:hover { background: rgba(108,99,255,0.1); }
    .role-badge {
      display: inline-block; padding: 4px 14px; border-radius: 50px;
      background: linear-gradient(135deg, #6c63ff, #8f88ff); color: #fff;
      font-size: 0.75rem; font-weight: 700; margin-bottom: 16px;
    }
    .profile-details { text-align: left; margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.04); }
    .detail-row { padding: 8px 0; font-size: 0.88rem; color: rgba(255,255,255,0.5); display: flex; align-items: center; gap: 10px; }
    .detail-row i { color: rgba(255,255,255,0.25); width: 18px; text-align: center; }
  `]
})
export class Profile implements OnInit {
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  user = signal<User | null>(null);
  form = { name: '', email: '', password: '', phone: '', gender: '', department: '', city: '', role: '' };
  success = false;
  error = '';
  uploadingPic = false;

  ngOnInit() {
    this.auth.getProfile().subscribe({
      next: u => {
        this.user.set(u);
        this.form = { name: u.name, email: u.email, password: '', phone: u.phone || '', gender: u.gender || '', department: u.department || '', city: u.city || '', role: u.role };
      },
      error: () => this.toast.error('Failed to load profile')
    });
  }

  onUpdate() {
    this.success = false;
    this.error = '';
    this.auth.updateProfile(this.form).subscribe({
      next: (u) => { this.user.set(u); this.success = true; this.toast.success('Profile updated!'); },
      error: (err) => { this.error = err.error?.message || 'Update failed'; this.toast.error(this.error); }
    });
  }

  profilePicUrl(): string {
    return this.auth.getProfilePicUrl(this.user()!.profilePic);
  }

  onPicSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.uploadingPic = true;
    this.auth.uploadProfilePic(file).subscribe({
      next: (filename) => {
        const u = this.user()!;
        this.user.set({ ...u, profilePic: filename });
        this.uploadingPic = false;
        this.toast.success('Profile picture updated!');
      },
      error: () => { this.uploadingPic = false; this.toast.error('Upload failed'); }
    });
  }
}

