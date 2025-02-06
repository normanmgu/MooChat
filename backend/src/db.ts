// Types for our database entities
export interface User {
  id: string;
  name: string;
}

export interface Chatroom {
  id: string;
}

export interface Message {
  id: string;
  userId: string;
  chatroomId: string;
  content: string;
  status: 'sent' | 'read';
  timestamp: number;
}

export interface UserToChatroom {
  userId: string;
  chatroomId: string;
}

// In-memory database class
export class InMemoryDB {
  private users: Map<string, User>;
  private chatrooms: Map<string, Chatroom>;
  private messages: Map<string, Message>;
  private userToChatrooms: Set<string>; // Stores "userId:chatroomId" strings

  constructor() {
    this.users = new Map();
    this.chatrooms = new Map();
    this.messages = new Map();
    this.userToChatrooms = new Set();
  }

  logUsers() {
    console.log(this.users)
  }

  logChatroom() {
    console.log(this.chatrooms)
  }

  logUserToChatrooms() {
    console.log(this.userToChatrooms)
  }

  // User methods
  createUser(id: string, name: string): User {
    const user: User = { id, name };
    this.users.set(id, user);
    return user;
  }

  getUser(id: string): User | undefined {
    return this.users.get(id);
  }

  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }

  // Chatroom methods
  createChatroom(id: string): Chatroom {
    const chatroom: Chatroom = { id };
    this.chatrooms.set(id, chatroom);
    return chatroom;
  }

  getChatroom(id: string): Chatroom | undefined {
    return this.chatrooms.get(id);
  }

  // Message methods
  createMessage(id: string, userId: string, chatroomId: string, content: string): Message {
    const message: Message = {
      id,
      userId,
      chatroomId,
      content,
      status: 'sent',
      timestamp: Date.now(),
    };
    this.messages.set(id, message);
    return message;
  }

  getMessage(id: string): Message | undefined {
    return this.messages.get(id);
  }

  updateMessageStatus(id: string, status: 'sent' | 'read'): boolean {
    const message = this.messages.get(id);
    if (message) {
      message.status = status;
      return true;
    }
    return false;
  }

  // Get all messages for a chatroom
  getChatroomMessages(chatroomId: string): Message[] {
    return Array.from(this.messages.values())
      .filter(msg => msg.chatroomId === chatroomId)
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  // User-Chatroom relationship methods
  addUserToChatroom(userId: string, chatroomId: string): boolean {
    const user = this.users.get(userId);
    const chatroom = this.chatrooms.get(chatroomId);
    
    if (!user || !chatroom) {
      return false;
    }

    this.userToChatrooms.add(`${userId}:${chatroomId}`);
    return true;
  }

  removeUserFromChatroom(userId: string, chatroomId: string): boolean {
    return this.userToChatrooms.delete(`${userId}:${chatroomId}`);
  }

  // Get all chatrooms for a user
  getUserChatrooms(userId: string): Chatroom[] {
    const chatroomIds = Array.from(this.userToChatrooms)
      .filter(relation => relation.startsWith(`${userId}:`))
      .map(relation => relation.split(':')[1]);
    
    return chatroomIds
      .map(id => this.chatrooms.get(id))
      .filter((chatroom): chatroom is Chatroom => chatroom !== undefined);
  }

  // Get all users in a chatroom
  getChatroomUsers(chatroomId: string): User[] {
    const userIds = Array.from(this.userToChatrooms)
      .filter(relation => relation.endsWith(`:${chatroomId}`))
      .map(relation => relation.split(':')[0]);
    
    return userIds
      .map(id => this.users.get(id))
      .filter((user): user is User => user !== undefined);
  }
}