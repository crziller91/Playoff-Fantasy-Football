const { createServer } = require("http");
const { Server } = require("socket.io");

// Get port from environment variable or default to 3001
const PORT = process.env.PORT || 3001;

// Get allowed origins from environment variable
// In production, this should be your Vercel app URL
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ["http://localhost:3000", "http://localhost:3001"];

// Create HTTP server
const server = createServer((req, res) => {
  // Health check endpoint for deployment platforms
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('WebSocket server is running');
    return;
  }

  res.writeHead(404);
  res.end();
});

// Initialize Socket.IO with CORS configuration
const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ["GET", "POST"],
    credentials: true
  },
  // Configure transports and other options
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Socket.IO event handlers
io.on("connection", (socket) => {
  const clientCount = io.engine.clientsCount;
  console.log(
    `Client connected: ${socket.id} (total clients: ${clientCount})`
  );

  // Event for draft picks updates
  socket.on("draftPickUpdate", (data) => {
    console.log(`draftPickUpdate event from ${socket.id}`, data.action);
    // Broadcast the update to all other clients
    socket.broadcast.emit("draftPickUpdate", data);
  });

  // Event for player scores updates
  socket.on("playerScoreUpdate", (data) => {
    let eventType = "update";
    if (data.isDeleted) {
      eventType = "delete";
    } else if (data.scoreData && data.scoreData.isDisabled === false) {
      eventType = "reactivate";
    }
    console.log(
      `playerScoreUpdate event from ${socket.id}: ${eventType} for ${data.playerName} in ${data.round}`
    );
    socket.broadcast.emit("playerScoreUpdate", data);
  });

  // Event for draft status updates
  socket.on("draftStatusUpdate", (data) => {
    console.log(
      `draftStatusUpdate event from ${socket.id}`,
      data.isDraftFinished ? "finished" : "reset"
    );
    socket.broadcast.emit("draftStatusUpdate", data);
  });

  // Event for team updates
  socket.on("teamUpdate", (data) => {
    console.log(
      `teamUpdate event from ${socket.id}`,
      data.action,
      data.teamName ? `team: ${data.teamName}` : "all teams"
    );
    socket.broadcast.emit("teamUpdate", data);
  });

  // Event for selected player updates
  socket.on("selectedPlayerUpdate", (data) => {
    console.log(
      `selectedPlayerUpdate event from ${socket.id}`,
      data.player ? `player: ${data.player.name}` : "cleared selection"
    );
    socket.broadcast.emit("selectedPlayerUpdate", data);
  });

  // Disconnect event
  socket.on("disconnect", () => {
    const clientCount = io.engine.clientsCount;
    console.log(
      `Client disconnected: ${socket.id} (remaining clients: ${clientCount})`
    );
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`> WebSocket server ready on port ${PORT}`);
  console.log(`> Allowed origins: ${ALLOWED_ORIGINS.join(', ')}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing WebSocket server');
  server.close(() => {
    console.log('WebSocket server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing WebSocket server');
  server.close(() => {
    console.log('WebSocket server closed');
    process.exit(0);
  });
});
