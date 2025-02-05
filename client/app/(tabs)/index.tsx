import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  SafeAreaView, // Add this
} from 'react-native';

export default function HomeScreen() {
  const [message, setMessage] = useState('')
  const [username, setUsername] = useState('')
  const [feed, setFeed] = useState<Array<string>>([])
  const [isConnected, setIsConnected] = useState<true | false>(false)
  
  useEffect(() => {
    setFeed(["Enter username to connect."])
  }, [])

  const createWebsocketConnection = (username: string) => {
    console.log("made it here")
    try {
      let ws = new WebSocket("ws://localhost:3000/ws")
      ws.onopen = () => {
        ws.send(`User: ${username}`)
      }
    }
    catch(error) {

      throw error
    }
  }

  const handleSend = () => {
    if (message.trim()) {
      if(!isConnected) {
        try {

          const newUsername = message
          setUsername(newUsername)

          // Connection logic AKA create websocket
          createWebsocketConnection(newUsername);

          setFeed(prevFeed => [...prevFeed, `Connected as ${newUsername}`])
          setIsConnected(true);
        }
        catch(error) {
          console.log(error)
          setUsername("");
          setFeed(prevFeed => [...prevFeed, error as string])
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
        {
          feed.map((msg, idx)=> <Text key={idx}>{msg}</Text>)
        }
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={message}
            onChangeText={setMessage}
            placeholder="Type a message..."
            multiline
          />
          <TouchableOpacity 
            style={styles.sendButton}
            onPress={handleSend}
          >
            <Text style={styles.sendButtonText}>Send</Text>
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
});