import React, { useEffect, useState } from "react"
import "./App.css"
import { io } from "socket.io-client"

const name = "drew" || window.prompt() || "anonymous"

const socket = io({
  auth: { name }
})

socket.onAny((event, ...args) => {
  console.log("%c" + event, "color: yellow;", args)
})

function App() {
  const [room, setRoom] = useState()

  const joinRoom = (room) => {
    socket.emit("joinRoom", room)
  }

  useEffect(() => {
    const join = (val) => {
      setRoom(val)
    }
    socket.on("joinRoom", join)
    return () => {
      socket.off("joinRoom", join)
    }
  }, [socket])

  const disconnect = () => {
    socket.emit("leaveRoom", room)
    setRoom(undefined)
  }

  return (
    <div>
      <div>your name: {name}</div>
      {/* <button onClick={() => socket.emit("getRooms")}>update rooms</button> */}

      {!room && (
        <>
          <button onClick={() => joinRoom("a")}>join room A</button>
          <button onClick={() => joinRoom("b")}>join room B</button>
        </>
      )}
      {room && <div>your room: {room}</div>}
      <hr />
      {room && (
        <div>
          <button onClick={disconnect}>disconnect</button>
          <Chat />
        </div>
      )}
    </div>
  )
}

const Chat = () => {
  const inputRef = React.useRef()

  const submitForm = (e) => {
    e.preventDefault()
    const value = inputRef.current.value.trim()
    socket.emit("addChat", value)
    e.target.reset()
  }

  const [chat, setChat] = useState([])

  useEffect(() => {
    const getChat = (val) => setChat(val)
    socket.emit("getChat")
    socket.on("getChat", getChat)
    return () => {
      socket.off("getChat", getChat)
    }
  }, [socket])

  return (
    <>
      <form onSubmit={submitForm}>
        <input type="text" ref={inputRef} />
        <button type="submit">submit</button>
      </form>
      <ul>
        {chat.map((message) => (
          <li key={message.id}>
            {message.name} - {message.value}
          </li>
        ))}
      </ul>
    </>
  )
}

export default App
