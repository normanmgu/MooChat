import { useState, useEffect, useRef } from 'react'
import { View, TextInput, ScrollView, StyleSheet, Pressable } from 'react-native'
import { ThemedText } from '@/components/ThemedText'
import { ThemedView } from '@/components/ThemedView'
import { SafeAreaView } from 'react-native-safe-area-context'
import { WSMessage } from '../../../shared/types'
import uuid from 'react-native-uuid'

const BACKEND_URL = 'localhost:3000'

const ADJECTIVES = ['Happy', 'Sleepy', 'Grumpy', 'Silly', 'Clever', 'Witty', 'Lucky', 'Friendly']
const ANIMALS = ['Panda', 'Koala', 'Tiger', 'Lion', 'Dolphin', 'Penguin', 'Fox', 'Bear']

function generateRandomUsername() {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)]
  return `${adjective}${animal}`
}

export default function ChatScreen() {
  const [messages, setMessages] = useState<Array<{ username: string; content: string }>>([])
  const [inputMessage, setInputMessage] = useState('')
  const [ws, setWs] = useState<WebSocket | null>(null)
  const [username, setUsername] = useState(generateRandomUsername())
  const scrollViewRef = useRef<ScrollView>(null)

  useEffect(() => {
    const websocket = new WebSocket(`ws://${BACKEND_URL}/ws`)
    
    websocket.onopen = () => {
      const connectMessage: WSMessage = {
        type: 'user-connect',
        username,
        timestamp: new Date().toISOString(),
        userId: uuid.v4() as string
      }
      websocket.send(JSON.stringify(connectMessage))
    }

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as WSMessage
        if (data.type === 'chat' || data.type === 'user-connect') {
          setMessages(prev => [...prev, { 
            username: data.username,
            content: data.type === 'user-connect' 
              ? '👋 joined the chat'
              : data.message || ''
          }])
        }
      } catch(error) {
        console.error("Error parsing message: ", error)
      }
    }

    setWs(websocket)
    return () => websocket.close()
  }, [username])

  const sendMessage = () => {
    if (inputMessage.trim() && ws?.readyState === WebSocket.OPEN) {
      const message: WSMessage = {
        type: 'chat',
        username,
        message: inputMessage.trim(),
        timestamp: new Date().toISOString()
      }
      ws.send(JSON.stringify(message))
      setInputMessage('')
    }
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ThemedView style={styles.container}>
        <ThemedText style={styles.usernameText}>Chatting as: {username}</ThemedText>
        <ScrollView 
          ref={scrollViewRef}
          style={styles.messagesContainer}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((msg, index) => (
            <View key={index} style={[
              styles.messageBox,
              msg.username === username ? styles.ownMessage : styles.otherMessage
            ]}>
              <ThemedText style={styles.username}>{msg.username}</ThemedText>
              <ThemedText>{msg.content}</ThemedText>
            </View>
          ))}
        </ScrollView>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputMessage}
            onChangeText={setInputMessage}
            placeholder="Type a message..."
            onSubmitEditing={sendMessage}
            placeholderTextColor="#666"
          />
          <Pressable 
            style={styles.sendButton}
            onPress={sendMessage}
          >
            <ThemedText style={styles.sendButtonText}>Send</ThemedText>
          </Pressable>
        </View>
      </ThemedView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  usernameText: {
    textAlign: 'center',
    padding: 10,
    fontWeight: 'bold',
  },
  messagesContainer: {
    flex: 1,
    marginBottom: 10,
  },
  messageBox: {
    padding: 10,
    marginVertical: 5,
    borderRadius: 8,
    maxWidth: '80%',
  },
  ownMessage: {
    backgroundColor: '#007AFF',
    alignSelf: 'flex-end',
  },
  otherMessage: {
    backgroundColor: '#E5E5EA',
    alignSelf: 'flex-start',
  },
  username: {
    fontSize: 12,
    marginBottom: 4,
    opacity: 0.7,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    padding: 10,
    marginRight: 10,
    color: '#000',
    backgroundColor: '#fff',
  },
  sendButton: {
    padding: 10,
    backgroundColor: '#007AFF',
    borderRadius: 20,
    minWidth: 70,
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#fff',
  },
})