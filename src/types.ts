import { Message } from './lib/gemini';

export interface ChatConversation {
  id: string;
  title: string;
  messages: Message[];
  status?: 'active' | 'archived';
  createdAt: number;
  updatedAt: number;
}
