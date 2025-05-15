import { Server } from "socket.io";

// Set up Socket.IO server
const SocketHandler = (req, res) => {
  // Check if Socket.IO server is already initialized
  if (res.socket.server.io) {
    console.log("Socket is already running, reusing existing socket");
    res.end();
    return;
  }

  console.log("Setting up new socket.io server");
  const io = new Server(res.socket.server);
  res.socket.server.io = io;

  // Define socket event handlers
  io.on("connection", (socket) => {
    const clientCount = io.engine.clientsCount;
    console.log(
      `Client connected: ${socket.id} (total clients: ${clientCount})`,
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
        `playerScoreUpdate event from ${socket.id}: ${eventType} for ${data.playerName} in ${data.round}`,
      );
      socket.broadcast.emit("playerScoreUpdate", data);
    });

    // Event for draft status updates
    socket.on("draftStatusUpdate", (data) => {
      console.log(
        `draftStatusUpdate event from ${socket.id}`,
        data.isDraftFinished ? "finished" : "reset",
      );
      socket.broadcast.emit("draftStatusUpdate", data);
    });

    // Event for team updates
    socket.on("teamUpdate", (data) => {
      console.log(
        `teamUpdate event from ${socket.id}`,
        data.action,
        data.teamName ? `team: ${data.teamName}` : "all teams",
      );
      socket.broadcast.emit("teamUpdate", data);
    });

    // Event for selected player updates
    socket.on("selectedPlayerUpdate", (data) => {
      console.log(
        `selectedPlayerUpdate event from ${socket.id}`,
        data.player ? `player: ${data.player.name}` : "cleared selection",
      );
      socket.broadcast.emit("selectedPlayerUpdate", data);
    });

    // Disconnect event
    socket.on("disconnect", () => {
      const clientCount = io.engine.clientsCount;
      console.log(
        `Client disconnected: ${socket.id} (remaining clients: ${clientCount})`,
      );
    });
  });

  console.log("Socket server started successfully");
  res.end();
};

export default SocketHandler;
