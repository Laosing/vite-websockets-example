import fs from "fs"
import path from "path"
import express from "express"
import { createServer as createViteServer } from "vite"
import { fileURLToPath } from "url"
import http from "http"
import { Server as WebsocketServer } from "socket.io"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const server = http.createServer(app)

const vite = await createViteServer({
  server: { middlewareMode: "ssr" }
})
app.use(vite.middlewares)
app.use("*", async (req, res, next) => {
  const url = req.originalUrl
  try {
    let template = fs.readFileSync(
      path.resolve(__dirname, "index.html"),
      "utf-8"
    )
    template = await vite.transformIndexHtml(url, template)
    res.status(200).set({ "Content-Type": "text/html" }).end(template)
  } catch (e) {
    vite.ssrFixStacktrace(e)
    next(e)
  }
})

const store = {}

const io = new WebsocketServer(server)
io.on("connection", (socket) => {
  const { name } = socket.handshake.auth
  const { room } = socket.handshake.query
  console.log(`${name} connected room: ${room}!`)

  socket.join(room)

  // init room storage
  store[room] = store[room] || []
  const roomData = store[room]

  io.to(room).emit("getChat", roomData)

  socket.on("addChat", (value) => {
    roomData.push({ id: Math.random(), name, value })
    io.to(room).emit("getChat", roomData)
  })
  socket.on("disconnect", () => {
    console.log(`${name} disconnecting from room ${room}`)
  })
})

server.listen(8000, () => console.log("listening on port 8000"))
