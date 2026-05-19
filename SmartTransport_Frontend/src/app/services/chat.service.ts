import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ChatMessage } from '../models/chat.model';
import { environment } from '../environment';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/chat`;

  getConversation(tripId: number): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(`${this.apiUrl}/${tripId}`);
  }

  sendMessage(tripId: number, content: string, receiverId?: number): Observable<ChatMessage> {
    const params: any = {};
    if (receiverId) params.receiverId = receiverId.toString();
    return this.http.post<ChatMessage>(`${this.apiUrl}/${tripId}`, { content }, { params });
  }

  markTripAsRead(tripId: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${tripId}/read`, {});
  }

  getUnreadCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.apiUrl}/unread`);
  }
}
