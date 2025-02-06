import { expect, test, describe, beforeEach } from "bun:test";
import { InMemoryDB } from "./db";

describe("InMemoryDB", () => {
  let db: InMemoryDB;

  // Reset the database before each test
  beforeEach(() => {
    db = new InMemoryDB();
  });

  test("should create and get users", () => {
    const user = db.createUser("user1", "John Doe");
    expect(user).toEqual({ id: "user1", name: "John Doe" });
    expect(db.getUser("user1")).toEqual(user);
  });

  test("should create and get chatrooms", () => {
    const chatroom = db.createChatroom("chat1");
    expect(chatroom).toEqual({ id: "chat1" });
    expect(db.getChatroom("chat1")).toEqual(chatroom);
  });

  test("should create and get messages", () => {
    // First create necessary user and chatroom
    db.createUser("user1", "John");
    db.createChatroom("chat1");

    const message = db.createMessage(
      "msg1",
      "user1",
      "chat1",
      "Hello, world!"
    );

    expect(message).toMatchObject({
      id: "msg1",
      userId: "user1",
      chatroomId: "chat1",
      content: "Hello, world!",
      status: "sent"
    });

    // Verify timestamp is recent
    expect(Date.now() - message.timestamp).toBeLessThan(1000);
    
    expect(db.getMessage("msg1")).toEqual(message);
  });

  test("should update message status", () => {
    // Setup
    db.createUser("user1", "John");
    db.createChatroom("chat1");
    db.createMessage("msg1", "user1", "chat1", "Hello");

    // Test status update
    expect(db.updateMessageStatus("msg1", "read")).toBe(true);
    expect(db.getMessage("msg1")?.status).toBe("read");
  });

  test("should manage user-chatroom relationships", () => {
    // Setup
    db.createUser("user1", "John");
    db.createUser("user2", "Jane");
    db.createChatroom("chat1");

    // Test adding users to chatroom
    expect(db.addUserToChatroom("user1", "chat1")).toBe(true);
    expect(db.addUserToChatroom("user2", "chat1")).toBe(true);

    // Test getting chatroom users
    const chatroomUsers = db.getChatroomUsers("chat1");
    expect(chatroomUsers).toHaveLength(2);
    expect(chatroomUsers.map(u => u.id)).toContain("user1");
    expect(chatroomUsers.map(u => u.id)).toContain("user2");

    // Test getting user chatrooms
    const userChatrooms = db.getUserChatrooms("user1");
    expect(userChatrooms).toHaveLength(1);
    expect(userChatrooms[0].id).toBe("chat1");

    // Test removing user from chatroom
    expect(db.removeUserFromChatroom("user1", "chat1")).toBe(true);
    expect(db.getChatroomUsers("chat1")).toHaveLength(1);
  });

  test("should get chatroom messages in chronological order", () => {
    // Setup
    db.createUser("user1", "John");
    db.createChatroom("chat1");
    
    // Create messages with artificial delays to ensure different timestamps
    const msg1 = db.createMessage("msg1", "user1", "chat1", "First message");
    const msg2 = db.createMessage("msg2", "user1", "chat1", "Second message");
    const msg3 = db.createMessage("msg3", "user1", "chat1", "Third message");

    const messages = db.getChatroomMessages("chat1");
    expect(messages).toHaveLength(3);
    expect(messages[0].id).toBe("msg1");
    expect(messages[1].id).toBe("msg2");
    expect(messages[2].id).toBe("msg3");
  });

  test("should handle invalid operations gracefully", () => {
    // Test getting non-existent user
    expect(db.getUser("nonexistent")).toBeUndefined();

    // Test getting non-existent chatroom
    expect(db.getChatroom("nonexistent")).toBeUndefined();

    // Test adding user to non-existent chatroom
    expect(db.addUserToChatroom("user1", "nonexistent")).toBe(false);

    // Test updating non-existent message
    expect(db.updateMessageStatus("nonexistent", "read")).toBe(false);
  });
});

// Run a simple integration test
describe("Integration Test", () => {
  test("should simulate a chat scenario", () => {
    const db = new InMemoryDB();

    // Create users
    const john = db.createUser("user1", "John");
    const jane = db.createUser("user2", "Jane");

    // Create chatroom
    const chatroom = db.createChatroom("chat1");

    // Add users to chatroom
    db.addUserToChatroom(john.id, chatroom.id);
    db.addUserToChatroom(jane.id, chatroom.id);

    // Send messages
    db.createMessage("msg1", john.id, chatroom.id, "Hey Jane!");
    db.createMessage("msg2", jane.id, chatroom.id, "Hi John!");
    db.createMessage("msg3", john.id, chatroom.id, "How are you?");

    // Mark messages as read
    db.updateMessageStatus("msg1", "read");
    db.updateMessageStatus("msg2", "read");

    // Verify chat history
    const messages = db.getChatroomMessages(chatroom.id);
    expect(messages).toHaveLength(3);
    expect(messages[0].content).toBe("Hey Jane!");
    expect(messages[0].status).toBe("read");
    expect(messages[1].content).toBe("Hi John!");
    expect(messages[1].status).toBe("read");
    expect(messages[2].content).toBe("How are you?");
    expect(messages[2].status).toBe("sent");
  });
});