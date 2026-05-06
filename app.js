const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.get("/", (req, res) => {
  res.send(`
  <h2>Chat App</h2>
  <div id="chat"></div>

  <input id="name" placeholder="Namn">
  <input id="msg" placeholder="Meddelande">
  <button onclick="send()">Send</button>

  <script src="/socket.io/socket.io.js"></script>
  <script>
    const socket = io();

    socket.on("msg", data => {
      document.getElementById("chat").innerHTML +=
        "<p><b>" + data.name + ":</b> " + data.msg + "</p>";
    });

    function send() {
      socket.emit("msg", {
        name: document.getElementById("name").value,
        msg: document.getElementById("msg").value
      });
    }
  </script>
  `);
});

io.on("connection", socket => {
  socket.on("msg", data => {
    io.emit("msg", data);
  });
});

http.listen(3000, () => console.log("http://localhost:3000"));
