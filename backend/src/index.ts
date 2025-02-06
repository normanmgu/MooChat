import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { createBunWebSocket } from "hono/bun"
import { ServerWebSocket } from "bun"
import { WSContext } from 'hono/ws'
import { InMemoryDB } from './db'
import { WSMessage, User } from "../../shared/types"

interface ClientInfo {
  username: string;
  userId: string;  // Added to link with DB
  timestamp: string;
  ws: WSContext;
}

const app = new Hono()
const db = new InMemoryDB() // "Volatile Ahh DB"
const clients = new Map<string, ClientInfo>()

// upgradeWebSocket: middleware that allows server to upgrade from http to websocket
// websocket: reference to the websocket open for connection
const { upgradeWebSocket, websocket } = createBunWebSocket()

const broadcastMessage = (message: WSMessage, excludeUserId?: string) => {
  clients.forEach(client => {
    if(client.userId !== excludeUserId) {
      client.ws.send(JSON.stringify(message))
    }
  })
}


app.use('/*', cors())

app.post("/user", async (c) => {
  try {
    const { id, name } = await c.req.json()

    if(!id || !name) {
      return c.json({
        success: false,
        error: "Messing required fields: id and name are required"
      }, 400)
    }
    if(db.getUser(id)) {
      return c.json({
        success: false,
        error: "User with this ID already exists"
      }, 409)
    }

    const newUser = db.createUser(id, name)

    return c.json({
      success: true,
      data: newUser
    }, 201)
  }
  catch(error) {
    return c.json({
      success: false,
      error: "Invalid request format or server error"
    }, 500)
  }
})

app.get(
  "/ws",
  upgradeWebSocket((_) => ({
    onOpen(_, ws: WSContext) {
      ws.send(JSON.stringify({
        type: "system",
        username: "system",
        message: "Successfully connected to chat server",
        timestamp: new Date().toISOString()
      }))
    },
    onMessage(evt: MessageEvent, ws: WSContext) {
      try {
        const data = JSON.parse(evt.data as string) as WSMessage
        switch (data.type) {
          case "user-connect":
            const { username, userId, timestamp } = data
            if(!userId) {
              throw new Error("userId is required")
            }

            const clientInfo: ClientInfo = {
              username,
              userId,
              timestamp,
              ws
            }
            clients.set(userId, clientInfo)

            const joinMessage: WSMessage = {
              type: "system",
              username: "system",
              message: `${username} joined the chat`,
              timestamp: new Date().toISOString()
            }
            broadcastMessage(joinMessage, userId)
            break
        }
      } catch(error) {
        // err
      }
    },
    onClose(evt: CloseEvent, ws) {
      console.info("Detected Disconnection")
    }
  }))
)

// Config object used by Buns runtime to automatically create and start the servert
export default {
  port: 3000,
  fetch: app.fetch,
  websocket,
}
