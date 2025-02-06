export type MessageType = 'user-connect' | 'chat' | 'system';

export interface WSMessage {
  type: MessageType;
  username: string;
  message?: string;
  timestamp: string;
  userId?: string;
}

export interface User {
  id: string;
  name: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Specific API responses
export interface UserResponse extends ApiResponse<User> {}
export interface MessagesResponse extends ApiResponse<WSMessage[]> {}