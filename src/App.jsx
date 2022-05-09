import React, { useEffect, useState } from "react"
import logo from "./logo.svg"
import "./App.css"
import { io } from "socket.io-client"

const socket = io({ autoConnect: false })
socket.onAny((event, ...args) => {
  console.log("%c" + event, "color: yellow;", args)
})

function App() {
  const [room, setRoom] = useState()

  const joinRoom = (e) => {
    socket.auth = { name: window.prompt(), room: e.target.dataset.room }
    socket.connect()
    console.log({ socket })
    setRoom(socket)
  }

  const disconnect = () => {
    socket.disconnect()
    setRoom(null)
  }

  return (
    <div>
      <button onClick={joinRoom} data-room="a">
        join room
      </button>
      {room && (
        <>
          <button onClick={disconnect}>disconnect</button>
          <MessageInput room={room} />
        </>
      )}
    </div>
  )
}

const MessageInput = ({ room }) => {
  const inputRef = React.useRef()

  const submitForm = (e) => {
    e.preventDefault()
    const value = inputRef.current.value.trim()
    room.emit("hello", value)
    e.target.reset()
  }

  return (
    <form onSubmit={submitForm}>
      <input type="text" ref={inputRef} />
      <button type="submit">submit</button>
    </form>
  )
}

export default App
