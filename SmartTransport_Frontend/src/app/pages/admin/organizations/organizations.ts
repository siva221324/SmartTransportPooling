import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { AdminService } from '../../../services/admin.service';
import { Organization, OrganizationRequest } from '../../../models/other.model';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-organizations',
  imports: [FormsModule, DatePipe],
  template: `
    <div class="pg-head">
      <h2><i class="bi bi-building-fill me-2"></i>Organizations</h2>
      <p>Manage whitelisted email domains</p>
    </div>

    <!-- Add Form -->
    <div class="card p-4 mb-4">
      <h5 class="fw-bold mb-3">{{ editId ? 'Edit' : 'Add' }} Organization</h5>
      @if (message) {
        <div class="alert" [class]="msgType === 'success' ? 'alert-success' : 'alert-danger'">{{ message }}</div>
      }
      <form (ngSubmit)="onSubmit()" class="row g-3 align-items-end">
        <div class="col-md-3">
          <label class="form-label">Name</label>
          <input type="text" class="form-control" [(ngModel)]="form.name" name="name" required placeholder="Cognizant">
        </div>
        <div class="col-md-3">
          <label class="form-label">Email Domain</label>
          <input type="text" class="form-control" [(ngModel)]="form.emailDomain" name="emailDomain" required placeholder="cognizant.com">
        </div>
        <div class="col-md-2">
          <div class="form-check mt-4">
            <input class="form-check-input" type="checkbox" [(ngModel)]="form.whitelisted" name="whitelisted" id="wl">
            <label class="form-check-label" for="wl">Whitelisted</label>
          </div>
        </div>
        <div class="col-md-2">
          <button type="submit" class="btn btn-primary w-100">
            <i class="bi bi-check-lg me-1"></i> {{ editId ? 'Update' : 'Add' }}
          </button>
        </div>
        @if (editId) {
          <div class="col-md-2">
            <button type="button" class="btn btn-outline-secondary w-100" (click)="cancelEdit()">Cancel</button>
          </div>
        }
      </form>
    </div>

    <!-- List -->
    @if (orgs().length === 0) {
      <div class="empty-state">
        <i class="bi bi-building"></i>
        <h5>No organizations yet</h5>
      </div>
    } @else {
      <div class="table-responsive">
        <table class="table table-hover align-middle">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email Domain</th>
              <th>Whitelisted</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (org of orgs(); track org.id) {
              <tr>
                <td class="fw-bold">{{ org.name }}</td>
                <td><code>&#64;{{ org.emailDomain }}</code></td>
                <td>
                  @if (org.whitelisted) {
                    <span class="badge bg-success">Yes</span>
                  } @else {
                    <span class="badge bg-secondary">No</span>
                  }
                </td>
                <td>{{ org.createdAt ? (org.createdAt | date:'mediumDate') : 'N/A' }}</td>
                <td>
                  <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" (click)="edit(org)"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-outline-danger" (click)="delete(org.id)"><i class="bi bi-trash"></i></button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `
})
export class Organizations implements OnInit {
  private adminService = inject(AdminService);
  private toast = inject(ToastService);

  orgs = signal<Organization[]>([]);
  form: OrganizationRequest = { name: '', emailDomain: '', whitelisted: true };
  editId: number | null = null;
  message = '';
  msgType = '';

  ngOnInit() { this.load(); }

  load() {
    this.adminService.getAllOrganizations().subscribe({
      next: o => this.orgs.set(o),
      error: () => this.toast.error('Failed to load organizations')
    });
  }

  onSubmit() {
    this.message = '';
    if (this.editId) {
      this.adminService.updateOrganization(this.editId, this.form).subscribe({
        next: () => { this.toast.success('Organization updated!'); this.cancelEdit(); this.load(); },
        error: (err) => { this.toast.error(err.error?.message || 'Failed'); this.message = err.error?.message || 'Failed'; this.msgType = 'error'; }
      });
    } else {
      this.adminService.createOrganization(this.form).subscribe({
        next: () => { this.toast.success('Organization added!'); this.form = { name: '', emailDomain: '', whitelisted: true }; this.load(); },
        error: (err) => { this.toast.error(err.error?.message || 'Failed'); this.message = err.error?.message || 'Failed'; this.msgType = 'error'; }
      });
    }
  }

  edit(org: Organization) {
    this.editId = org.id;
    this.form = { name: org.name, emailDomain: org.emailDomain, whitelisted: org.whitelisted };
  }

  cancelEdit() {
    this.editId = null;
    this.form = { name: '', emailDomain: '', whitelisted: true };
  }

  delete(id: number) {
    if (confirm('Delete this organization?')) {
      this.adminService.deleteOrganization(id).subscribe({
        next: () => { this.toast.warning('Organization deleted.'); this.load(); },
        error: (err) => this.toast.error(err.error?.message || 'Failed to delete')
      });
    }
  }
}

