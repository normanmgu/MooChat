import React, { useState, useEffect } from 'react';
import uuid from "react-native-uuid"
import { WSMessage, UserResponse, MessagesResponse } from "../../../shared/types"

import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  SafeAreaView, // Add this
} from 'react-native';

const BACKEND_URL = "localhost:3000"

export default function HomeScreen() {
  const [message, setMessage] = useState('')
  const [username, setUsername] = useState('')
  const [id, setId] = useState('')
  const [feed, setFeed] = useState<Array<string>>([])
  const [isConnected, setIsConnected] = useState<true | false>(false)
  const [ws, setWs] = useState<WebSocket | null>(null)
  
  useEffect(() => {
    setFeed(["Enter username to connect."])
  }, [])

  const createWebsocketConnection = (username: string, userId: string) => {
    try {
      let ws = new WebSocket(`ws://${BACKEND_URL}/ws`)

      ws.onopen = () => {
        const connectMessage: WSMessage = {
          type: "user-connect",
          username,
          userId,
          timestamp: new Date().toISOString()
        }
        ws.send(JSON.stringify(connectMessage));
      }

      ws.onmessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data) as WSMessage
          setFeed(prevFeed => [...prevFeed, `${data.username}: ${data.message}`])
        } catch(error) {
          console.error("Error parsing message: ", error)
        }
      }
    }
    catch(error) {
      throw error
    }
  }

  const handleSend = async () => {
    if (message.trim()) {
      if(!isConnected) {
        try {

          const newUsername = message
          setUsername(newUsername)

          const newId = uuid.v4(); 

          // make sure user is created first
          const response = await fetch(`http://${BACKEND_URL}/user`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              id: newId,
              name: newUsername,
            })
          })
          // const data = await response.json()

          if(response.ok) {
            createWebsocketConnection(newUsername, newId);
            setFeed(prevFeed => [...prevFeed, `Connected as ${newUsername}`])
            setIsConnected(true);
          }
          else {
            throw new Error("Failed to create user")
          }
        }
        catch(error: any) {
          console.log(error)
          setUsername("");
          setId("");
          setFeed(prevFeed => [...prevFeed, error.message || "Failed to connect"])
        }
      }
      else {
        // send via socket
      }
      setMessage('')
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.feed}>
        {
          feed.map((msg, idx)=> <Text style= {styles.message} key={idx}>{msg}</Text>)
        }
        </View>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={message}
            onChangeText={setMessage}
            placeholder={isConnected ? "Type a message..." : "Enter a username..."}
            multiline
          />
          <TouchableOpacity 
            style={styles.sendButton}
            onPress={handleSend}
          >
            <Text style={styles.sendButtonText}>
              {isConnected ? "Send" : "Connect"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    justifyContent: 'center', // Changed from flex-end to center
    backgroundColor: '#fff',
    paddingHorizontal: 10, // Added padding to prevent touching edges
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    // Optional: add elevation/shadow to make it stand out
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  input: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    fontSize: 16,
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingHorizontal: 20,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  feed: {
    width: "100%",
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  message: {
    fontSize: 16,
    marginVertical: 5,
    color: "#333",
  }
  
});