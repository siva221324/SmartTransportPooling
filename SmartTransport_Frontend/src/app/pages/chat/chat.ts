import { Component, inject, OnInit, OnDestroy, signal, computed, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { Client, IMessage } from '@stomp/stompjs';
import { ChatService } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';
import { TripService } from '../../services/trip.service';
import { ToastService } from '../../services/toast.service';
import { ChatMessage } from '../../models/chat.model';
import { Trip } from '../../models/trip.model';
import { environment } from '../../environment';

@Component({
  selector: 'app-chat',
  imports: [FormsModule, DatePipe, RouterLink],
  template: `
    <div class="d-flex flex-column" style="height: calc(100vh - 120px);">
      <!-- Header -->
      <div class="card mb-3 p-3">
        <div class="d-flex align-items-center justify-content-between">
          <div class="d-flex align-items-center gap-3">
            <a [routerLink]="['/trip', tripId]" class="btn btn-outline-secondary btn-sm">
              <i class="bi bi-arrow-left"></i>
            </a>
            <div>
              <h5 class="mb-0"><i class="bi bi-chat-dots me-2"></i>Trip Chat</h5>
              @if (trip()) {
                <small class="text-muted">{{ trip()!.origin }} → {{ trip()!.destination }}</small>
              }
            </div>
          </div>
          @if (trip()) {
            <span class="badge bg-secondary">Trip #{{ tripId }}</span>
          }
        </div>
      </div>

      <!-- Messages -->
      <div class="card flex-grow-1 mb-3 p-0 overflow-hidden">
        <div #scrollContainer class="p-3 overflow-auto h-100" style="background: #f8f9fa;">
          @if (loading()) {
            <div class="text-center py-5">
              <div class="spinner-border text-primary"></div>
            </div>
          } @else if (messages().length === 0) {
            <div class="text-center py-5 text-muted">
              <i class="bi bi-chat-dots" style="font-size: 3rem;"></i>
              <p class="mt-2">No messages yet. Start the conversation!</p>
            </div>
          } @else {
            @for (msg of messages(); track msg.id) {
              <div class="mb-3 d-flex" [class.justify-content-end]="msg.senderId === currentUserId()">
                <div class="chat-bubble" [class.sent]="msg.senderId === currentUserId()"
                     [class.received]="msg.senderId !== currentUserId()" style="max-width: 70%;">
                  @if (msg.senderId !== currentUserId()) {
                    <small class="fw-bold d-block mb-1" style="color: #6c757d;">{{ msg.senderName }}</small>
                  }
                  <p class="mb-1">{{ msg.content }}</p>
                  <small class="text-muted" style="font-size: 0.7rem;">
                    {{ msg.sentAt | date:'MMM d, h:mm a' }}
                    @if (msg.senderId === currentUserId() && msg.readAt) {
                      <i class="bi bi-check2-all text-primary ms-1"></i>
                    }
                  </small>
                </div>
              </div>
            }
          }
        </div>
      </div>

      <!-- Input -->
      <div class="card p-3">
        <form (ngSubmit)="sendMessage()" class="d-flex gap-2">
          <input type="text" class="form-control" [(ngModel)]="newMessage" name="newMessage"
                 placeholder="Type a message..." autocomplete="off" [disabled]="sending()">
          <button type="submit" class="btn btn-primary px-4" [disabled]="!newMessage.trim() || sending()">
            @if (sending()) {
              <span class="spinner-border spinner-border-sm"></span>
            } @else {
              <i class="bi bi-send"></i>
            }
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .chat-bubble {
      padding: 0.6rem 1rem;
      border-radius: 1rem;
      word-wrap: break-word;
    }
    .chat-bubble.sent {
      background: #0d6efd;
      color: white;
      border-bottom-right-radius: 0.25rem;
    }
    .chat-bubble.sent small { color: rgba(255,255,255,0.7) !important; }
    .chat-bubble.received {
      background: white;
      border: 1px solid #dee2e6;
      border-bottom-left-radius: 0.25rem;
    }
  `]
})
export class Chat implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  private route = inject(ActivatedRoute);
  private chatService = inject(ChatService);
  private authService = inject(AuthService);
  private tripService = inject(TripService);
  private toast = inject(ToastService);

  tripId = 0;
  trip = signal<Trip | null>(null);
  messages = signal<ChatMessage[]>([]);
  loading = signal(true);
  sending = signal(false);
  newMessage = '';
  currentUserId = signal(0);
  private shouldScroll = false;
  private stompClient: Client | null = null;

  ngOnInit() {
    this.tripId = Number(this.route.snapshot.paramMap.get('tripId'));

    // Load trip info
    this.tripService.getTrip(this.tripId).subscribe(t => this.trip.set(t));

    // Load user profile to get userId
    this.authService.getProfile().subscribe(u => this.currentUserId.set(u.id));

    // Load messages
    this.chatService.getConversation(this.tripId).subscribe({
      next: msgs => {
        this.messages.set(msgs);
        this.loading.set(false);
        this.shouldScroll = true;
        // Mark as read
        this.chatService.markTripAsRead(this.tripId).subscribe();
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Failed to load messages');
      }
    });

    // Subscribe to WebSocket for real-time messages
    this.connectWebSocket();
  }

  ngAfterViewChecked() {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  ngOnDestroy() {
    if (this.stompClient) {
      this.stompClient.deactivate();
    }
  }

  sendMessage() {
    const content = this.newMessage.trim();
    if (!content) return;

    this.sending.set(true);
    const receiverId = this.getReceiverId();

    this.chatService.sendMessage(this.tripId, content, receiverId).subscribe({
      next: () => {
        this.newMessage = '';
        this.sending.set(false);
        // Message will arrive via WebSocket, but if WS isn't connected, add it directly
      },
      error: (err) => {
        this.sending.set(false);
        this.toast.error(err.error?.message || err.error || 'Failed to send message');
      }
    });
  }

  private getReceiverId(): number | undefined {
    const trip = this.trip();
    if (!trip) return undefined;
    // If current user is the driver, we need to figure out the receiverId
    // For now, return undefined (passenger→driver auto-detected on backend)
    if (trip.driver.id === this.currentUserId()) {
      // Driver: pick the "other" participant from conversation or undefined
      const msgs = this.messages();
      const otherUser = msgs.find(m => m.senderId !== this.currentUserId());
      return otherUser?.senderId;
    }
    return undefined;
  }

  private connectWebSocket() {
    this.stompClient = new Client({
      brokerURL: environment.wsUrl.replace('http', 'ws') + '/websocket',
      reconnectDelay: 5000,
      debug: () => {}
    });

    this.stompClient.onConnect = () => {
      this.stompClient!.subscribe(`/topic/chat/${this.tripId}`, (msg: IMessage) => {
        const chatMsg: ChatMessage = JSON.parse(msg.body);
        // Avoid duplicates
        const existing = this.messages();
        if (!existing.find(m => m.id === chatMsg.id)) {
          this.messages.set([...existing, chatMsg]);
          this.shouldScroll = true;
          // Mark as read if we're the receiver
          if (chatMsg.receiverId === this.currentUserId()) {
            this.chatService.markTripAsRead(this.tripId).subscribe();
          }
        }
      });
    };

    this.stompClient.activate();
  }

  private scrollToBottom() {
    try {
      const el = this.scrollContainer?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    } catch {}
  }
}
