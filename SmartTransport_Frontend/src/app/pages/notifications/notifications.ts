import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { NotificationService } from '../../services/notification.service';
import { ToastService } from '../../services/toast.service';
import { AppNotification } from '../../models/notification.model';

@Component({
  selector: 'app-notifications',
  imports: [DatePipe],
  template: `
    <div class="page-header d-flex justify-content-between align-items-center">
      <div>
        <h2><i class="bi bi-bell me-2"></i>Notifications</h2>
        <p class="text-muted mb-0">{{ unreadCount() }} unread</p>
      </div>
      @if (unreadCount() > 0) {
        <button class="btn btn-outline-primary btn-sm" (click)="markAllRead()">
          <i class="bi bi-check2-all me-1"></i> Mark all as read
        </button>
      }
    </div>

    @if (loading()) {
      <div class="text-center py-5">
        <div class="spinner-border text-primary"></div>
      </div>
    } @else if (notifications().length === 0) {
      <div class="text-center py-5 text-muted">
        <i class="bi bi-bell-slash" style="font-size: 3rem;"></i>
        <p class="mt-2">No notifications yet</p>
      </div>
    } @else {
      <div class="list-group">
        @for (n of notifications(); track n.id) {
          <div class="list-group-item list-group-item-action d-flex align-items-start gap-3 py-3"
               [class.bg-light]="!n.read"
               style="cursor: pointer;"
               (click)="onNotificationClick(n)">
            <div class="flex-shrink-0">
              <div class="rounded-circle d-flex align-items-center justify-content-center"
                   [style.background]="getIconBg(n.type)"
                   style="width:42px;height:42px;">
                <i class="bi text-white" [class]="getIcon(n.type)"></i>
              </div>
            </div>
            <div class="flex-grow-1">
              <div class="d-flex justify-content-between">
                <h6 class="mb-1 fw-bold">{{ n.title }}</h6>
                @if (!n.read) {
                  <span class="badge bg-primary rounded-pill">New</span>
                }
              </div>
              <p class="mb-1 text-muted small">{{ n.message }}</p>
              <small class="text-muted">{{ n.createdAt | date:'MMM d, h:mm a' }}</small>
            </div>
          </div>
        }
      </div>
    }
  `
})
export class Notifications implements OnInit {
  private notifService = inject(NotificationService);
  private router = inject(Router);
  private toast = inject(ToastService);

  notifications = signal<AppNotification[]>([]);
  loading = signal(true);
  unreadCount = signal(0);

  ngOnInit() {
    this.loadNotifications();
  }

  loadNotifications() {
    this.notifService.getNotifications().subscribe({
      next: list => {
        this.notifications.set(list);
        this.unreadCount.set(list.filter(n => !n.read).length);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Failed to load notifications');
      }
    });
  }

  onNotificationClick(n: AppNotification) {
    if (!n.read) {
      this.notifService.markAsRead(n.id).subscribe(() => {
        n.read = true;
        this.unreadCount.set(this.unreadCount() - 1);
      });
    }
    // Navigate based on type
    if (n.referenceId) {
      if (n.type === 'CHAT_MESSAGE') {
        this.router.navigate(['/chat', n.referenceId]);
      } else {
        this.router.navigate(['/trip', n.referenceId]);
      }
    }
  }

  markAllRead() {
    this.notifService.markAllRead().subscribe(() => {
      this.notifications().forEach(n => n.read = true);
      this.unreadCount.set(0);
      this.toast.success('All notifications marked as read');
    });
  }

  getIcon(type: string): string {
    const icons: Record<string, string> = {
      BOOKING_REQUESTED: 'bi-ticket-detailed',
      BOOKING_APPROVED: 'bi-check-circle',
      BOOKING_REJECTED: 'bi-x-circle',
      BOOKING_CANCELLED: 'bi-x-lg',
      TRIP_CANCELLED: 'bi-exclamation-triangle',
      TRIP_STARTED: 'bi-play-fill',
      TRIP_COMPLETED: 'bi-flag-fill',
      TRIP_REMINDER: 'bi-clock',
      CHAT_MESSAGE: 'bi-chat-dots',
    };
    return icons[type] || 'bi-bell';
  }

  getIconBg(type: string): string {
    const colors: Record<string, string> = {
      BOOKING_REQUESTED: '#0d6efd',
      BOOKING_APPROVED: '#198754',
      BOOKING_REJECTED: '#dc3545',
      BOOKING_CANCELLED: '#6c757d',
      TRIP_CANCELLED: '#dc3545',
      TRIP_STARTED: '#198754',
      TRIP_COMPLETED: '#0d6efd',
      TRIP_REMINDER: '#ffc107',
      CHAT_MESSAGE: '#6f42c1',
    };
    return colors[type] || '#6c757d';
  }
}
