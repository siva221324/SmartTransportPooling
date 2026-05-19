export interface AppNotification {
  id: number;
  type: string;
  title: string;
  message: string;
  referenceId: number;
  read: boolean;
  createdAt: string;
}
