export interface ChatMessage {
  id: number;
  tripId: number;
  senderId: number;
  senderName: string;
  receiverId: number;
  receiverName: string;
  content: string;
  sentAt: string;
  readAt: string | null;
}
