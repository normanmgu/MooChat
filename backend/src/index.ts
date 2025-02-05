import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { createBunWebSocket } from "hono/bun"
import { ServerWebSocket } from "bun"

const app = new Hono()

// upgradeWebSocket: middleware that allows server to upgrade from http to websocket
// websocket: reference to the websocket open for connection
const { upgradeWebSocket, websocket } = createBunWebSocket()

const activeUsers = new Map()

app.use('/*', cors())

app.get('/', (c) => {
  return c.json({
    message: "Hello from backend",
    ok: true,
  })
})

app.get(
  "/ws",
  upgradeWebSocket((_) => ({
    onOpen(_, ws) {
      ws.send("successfully connected")
      console.log("connection established")
    },
    onClose(_, ws) {
      console.log("Web server socket closed")
    }
  }))
)

// Config object used by Buns runtime to automatically create and start the servert
export default {
  port: 3000,
  fetch: app.fetch,
  websocket,
}
