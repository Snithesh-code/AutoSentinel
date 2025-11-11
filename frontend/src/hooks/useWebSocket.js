import { useEffect, useState, useCallback, useRef } from 'react'
import { io } from 'socket.io-client'

export const useWebSocket = (options = {}) => {
  const [connected, setConnected] = useState(false)
  const socketRef = useRef(null)

  useEffect(() => {
    // Connect to WebSocket server
    const socket = io('http://localhost:5000', {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    socketRef.current = socket

    socket.on('connect', () => {
      console.log('WebSocket connected')
      setConnected(true)
      if (options.onConnect) options.onConnect()
    })

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected')
      setConnected(false)
      if (options.onDisconnect) options.onDisconnect()
    })

    socket.on('message', (data) => {
      if (options.onMessage) options.onMessage(data)
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  const sendMessage = useCallback((message) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('message', message)
    }
  }, [])

  return { connected, sendMessage }
}
