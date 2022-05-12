import fs from "fs"
import path from "path"
import express from "express"
import { createServer as createViteServer } from "vite"
import { fileURLToPath } from "url"
import http from "http"
import { Server as WebsocketServer } from "socket.io"
import serializeJavascript from "serialize-javascript"

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

  let _room

  // socket.on("getRooms", () => {
  //   socket.emit("rooms", io.sockets.adapter.rooms)
  // })

  socket.on("joinRoom", (room) => {
    console.log(`${name} connected room: ${room}!`)
    socket.join(room)
    _room = room
    store[room] = store[room] || []
    io.to(room).emit("joinRoom", room)
  })

  socket.on("leaveRoom", (value) => {
    socket.leave(value)
    _room = undefined
    console.log(`${name} leaving room ${value}`)
  })

  socket.on("getChat", () => {
    io.to(_room).emit("getChat", store[_room])
  })

  socket.on("getRooms", async () => {
    const clients = Array.from(io.sockets.adapter.sids.keys())
    const rooms = Array.from(io.sockets.adapter.rooms.keys()).filter(
      (id) => !clients.includes(id)
    )
    io.to(_room).emit("getRooms", rooms)
  })

  socket.on("addChat", (value) => {
    store[_room].push({ id: Math.random(), name, value })
    io.to(_room).emit("getChat", store[_room])
  })

  socket.on("disconnect", () => {
    console.log(`${name} disconnected!`)
  })
})

server.listen(8000, () => console.log("listening on port 8000"))
