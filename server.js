const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  // Initialize Socket.IO
  const io = new Server(server);

  // Socket.IO event handlers
  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // Event for draft picks updates
    socket.on("draftPickUpdate", (data) => {
      // Broadcast the update to all other clients
      socket.broadcast.emit("draftPickUpdate", data);
    });

    // Event for player scores updates
    socket.on("playerScoreUpdate", (data) => {
      socket.broadcast.emit("playerScoreUpdate", data);
    });

    // Event for draft status updates
    socket.on("draftStatusUpdate", (data) => {
      socket.broadcast.emit("draftStatusUpdate", data);
    });

    // Disconnect event
    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  server.listen(3000, (err) => {
    if (err) throw err;
    console.log("> Ready on http://localhost:3000");
  });
});
