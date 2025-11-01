import { useEffect, useState, useRef } from 'react';
import io, { Socket } from 'socket.io-client';

// Create a variable outside the hook to track if we've initialized the socket
let socketInitialized = false;
let globalSocket: Socket | null = null;

// Get WebSocket server URL from environment variable
// Falls back to localhost for local development
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

export const useSocket = () => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const socketInitializer = useRef<Promise<void> | null>(null);

    useEffect(() => {
        // Only initialize the socket once
        if (!socketInitialized && !socketInitializer.current) {
            // Create a promise to handle initialization
            socketInitializer.current = (async () => {
                try {
                    // Create socket connection only if it doesn't exist
                    if (!globalSocket) {
                        console.log('Creating new socket connection to:', SOCKET_URL);
                        const socketConnection = io(SOCKET_URL, {
                            reconnectionAttempts: 5,
                            reconnectionDelay: 1000,
                            transports: ['websocket', 'polling'],
                        });

                        socketConnection.on('connect', () => {
                            console.log('Socket connected:', socketConnection.id);
                            setIsConnected(true);
                        });

                        socketConnection.on('disconnect', () => {
                            console.log('Socket disconnected');
                            setIsConnected(false);
                        });

                        socketConnection.on('connect_error', (error) => {
                            console.error('Socket connection error:', error);
                        });

                        globalSocket = socketConnection;
                        socketInitialized = true;
                    }

                    setSocket(globalSocket);
                } catch (error) {
                    console.error('Socket initialization error:', error);
                    socketInitialized = false;
                    globalSocket = null;
                }
            })();
        }

        // Use the existing socket if we already initialized
        if (socketInitialized && globalSocket) {
            setSocket(globalSocket);
            setIsConnected(globalSocket.connected);
        }

        // Cleanup function
        return () => {
            // We don't want to disconnect the socket on component unmount
            // as we're reusing it across components
            // Just clear the local reference
            setSocket(null);
        };
    }, []);

    // Only disconnect the socket when the application is closing
    useEffect(() => {
        const handleBeforeUnload = () => {
            if (globalSocket) {
                console.log('Application closing, disconnecting socket');
                globalSocket.disconnect();
                globalSocket = null;
                socketInitialized = false;
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []);

    return { socket, isConnected };
};