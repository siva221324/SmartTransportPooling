import { Injectable } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import { Subject, Observable } from 'rxjs';
import { LocationUpdate } from '../models/other.model';
import { environment } from '../environment';

@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private client: Client | null = null;
  private connected = false;

  connect(): void {
    if (this.connected) return;

    this.client = new Client({
      brokerURL: environment.wsUrl.replace('http', 'ws') + '/websocket',
      reconnectDelay: 5000,
      debug: () => {}
    });

    this.client.onConnect = () => {
      this.connected = true;
    };

    this.client.onDisconnect = () => {
      this.connected = false;
    };

    this.client.activate();
  }

  subscribeToTripLocation(tripId: number): Observable<LocationUpdate> {
    const subject = new Subject<LocationUpdate>();
    if (this.client && this.connected) {
      this.client.subscribe(`/topic/trip/${tripId}/location`, (msg: IMessage) => {
        subject.next(JSON.parse(msg.body));
      });
    } else {
      // Wait for connection then subscribe
      const checkInterval = setInterval(() => {
        if (this.client && this.connected) {
          clearInterval(checkInterval);
          this.client.subscribe(`/topic/trip/${tripId}/location`, (msg: IMessage) => {
            subject.next(JSON.parse(msg.body));
          });
        }
      }, 500);
      // Timeout after 10s
      setTimeout(() => clearInterval(checkInterval), 10000);
    }
    return subject.asObservable();
  }

  subscribeToProximityAlerts(tripId: number): Observable<{ message: string; distanceMeters: number; passengerId: number }> {
    const subject = new Subject<{ message: string; distanceMeters: number; passengerId: number }>();
    if (this.client && this.connected) {
      this.client.subscribe(`/topic/trip/${tripId}/proximity`, (msg: IMessage) => {
        subject.next(JSON.parse(msg.body));
      });
    } else {
      const checkInterval = setInterval(() => {
        if (this.client && this.connected) {
          clearInterval(checkInterval);
          this.client.subscribe(`/topic/trip/${tripId}/proximity`, (msg: IMessage) => {
            subject.next(JSON.parse(msg.body));
          });
        }
      }, 500);
      setTimeout(() => clearInterval(checkInterval), 10000);
    }
    return subject.asObservable();
  }

  sendLocation(update: LocationUpdate): void {
    if (this.client && this.connected) {
      this.client.publish({
        destination: '/app/track',
        body: JSON.stringify(update)
      });
    }
  }

  disconnect(): void {
    if (this.client) {
      this.client.deactivate();
      this.connected = false;
    }
  }
}

