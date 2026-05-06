const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

// 🧠 lagring i minnet (enkelt system)
const users = new Set();

function isValidName(name) {
  if (!name) return false;

  const lower = name.toLowerCase();

  // 👑 admin exception
  if (name === "BLOXZEBBRAZZYT") return true;

  // 🚫 förbjudna basnamn
  if (lower.includes("bloxzebbrazz") && name !== "BLOXZEBBRAZZYT") return false;
  if (lower.includes("zebbrazz")) return false;

  return true;
}

app.get("/", (req, res) => {
  res.send(`
  <h2>Chat App</h2>

  <div id="login">
    <input id="username" placeholder="Skapa username">
    <button onclick="join()">Join</button>
    <p id="error"></p>
  </div>

  <div id="chatBox" style="display:none;">
    <div id="chat"></div>

    <input id="msg" placeholder="Meddelande">
    <button onclick="send()">Send</button>
  </div>

  <script src="/socket.io/socket.io.js"></script>
  <script>
    const socket = io();
    let user = "";

    function join() {
      const name = document.getElementById("username").value;

      socket.emit("join", name, (res) => {
        if (!res.ok) {
          document.getElementById("error").innerText = res.error;
          return;
        }

        user = name;
        document.getElementById("login").style.display = "none";
        document.getElementById("chatBox").style.display = "block";
      });
    }

    socket.on("msg", data => {
      document.getElementById("chat").innerHTML +=
        "<p><b>" + data.name + ":</b> " + data.msg + "</p>";
    });

    function send() {
      const msg = document.getElementById("msg").value;

      if (!msg) return;

      socket.emit("msg", { name: user, msg });
      document.getElementById("msg").value = "";
    }
  </script>
  `);
});

// 👤 LOGIN SYSTEM
io.on("connection", (socket) => {

  socket.on("join", (name, cb) => {
    if (!isValidName(name)) {
      return cb({ ok: false, error: "Ogiltigt username" });
    }

    if (users.has(name)) {
      return cb({ ok: false, error: "Namnet är redan taget" });
    }

    users.add(name);
    socket.username = name;

    cb({ ok: true });
  });

  // 💬 CHAT
  socket.on("msg", (data) => {
    if (!data.msg || !data.msg.trim()) return;

    io.emit("msg", data);
  });

});

http.listen(process.env.PORT || 3000, () =>
  console.log("Server started")
);
