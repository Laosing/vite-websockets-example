import React, { useEffect, useState } from "react"
import logo from "./logo.svg"
import "./App.css"
import { io } from "socket.io-client"

const name = window.prompt() || "anonymous"

function App() {
  const [socket, setSocket] = useState()
  const [room, setRoom] = useState()

  useEffect(() => {
    if (room) {
      const socket = io({
        auth: { name },
        query: { room }
      })
      socket.onAny((event, ...args) => {
        console.log("%c" + event, "color: yellow;", args)
      })
      setSocket(socket)
    }
    return () => {
      if (socket) {
        socket.close()
      }
    }
  }, [room])

  const disconnect = () => {
    socket.close()
    setRoom(undefined)
    setSocket(undefined)
  }

  return (
    <div>
      <div>your name: {name}</div>
      {!room && (
        <>
          <button onClick={() => setRoom("a")}>join room A</button>
          <button onClick={() => setRoom("b")}>join room B</button>
        </>
      )}
      {room && <div>your room: {room}</div>}
      <hr />
      {room && socket && (
        <div>
          <button onClick={disconnect}>disconnect</button>
          <Chat socket={socket} />
        </div>
      )}
    </div>
  )
}

const Chat = ({ socket }) => {
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
