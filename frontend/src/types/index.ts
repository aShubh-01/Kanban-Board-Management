export interface User {
  id: String;
  name: string;
  email: string;
  token?: string;
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export interface ChecklistItem {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  listId: string;
  title: string;
  description: string;
  priority: Priority;
  dueDate?: string;
  assigneeIds: string[];
  checklist: ChecklistItem[];
  position: number;
}

export interface BoardList {
  id: string;
  boardId: string;
  title: string;
  position: number;
  tasks?: Task[];
}

export interface Board {
  id: string;
  title: string;
  description?: string;
  ownerId: string;
  memberIds: string[];
}

export interface Notification {
  id: string;
  recipientId: string;
  message: string;
  type: 'INVITE' | 'ALERT';
  boardId?: string;
  boardTitle?: string;
  senderName?: string;
  createdAt: string;
  read: boolean;
  processed: boolean;
}
export interface Attachment {
  id: string;
  taskId: string;
  fileName: string;
  contentType: string;
  size: number;
  url: string;
  createdAt: string;
  uploadedBy: string;
}
