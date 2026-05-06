const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

// 👑 OWNER
const OWNER_NAME = "BLOXZEBBRAZZYT";

// 💾 memory storage
const users = {};
const onlineUsers = new Set();

// 🚫 namn-regler
function isValidName(name) {
  if (!name) return false;

  const lower = name.toLowerCase();

  // 👑 OWNER bypass
  if (name === OWNER_NAME) return true;

  if (lower.includes("bloxzebbrazz")) return false;
  if (lower.includes("zebbrazz")) return false;

  return true;
}

// 🌐 frontend
app.get("/", (req, res) => {
  res.send(`
  <h2>Chat App</h2>

  <div id="auth">
    <input id="user" placeholder="Username">
    <input id="pass" placeholder="Password">

    <button onclick="signup()">Sign up</button>
    <button onclick="login()">Login</button>

    <p id="msg"></p>
  </div>

  <div id="chatBox" style="display:none;">
    <div id="chat"></div>

    <input id="text" placeholder="Message">
    <button onclick="send()">Send</button>
  </div>

  <script src="/socket.io/socket.io.js"></script>
  <script>
    const socket = io();
    let currentUser = "";

    function signup() {
      socket.emit("signup", {
        user: user.value,
        pass: pass.value
      }, res => {
        msg.innerText = res.message;
      });
    }

    function login() {
      socket.emit("login", {
        user: user.value,
        pass: pass.value
      }, res => {
        if (!res.ok) {
          msg.innerText = res.message;
          return;
        }

        currentUser = user.value;
        document.getElementById("auth").style.display = "none";
        document.getElementById("chatBox").style.display = "block";
      });
    }

    socket.on("msg", data => {
      document.getElementById("chat").innerHTML +=
        "<p><b>" + data.user + ":</b> " + data.msg + "</p>";
    });

    function send() {
      const text = document.getElementById("text").value;

      if (!text.trim()) return;

      socket.emit("msg", {
        user: currentUser,
        msg: text
      });

      document.getElementById("text").value = "";
    }
  </script>
  `);
});

// 🔐 SERVER LOGIC
io.on("connection", (socket) => {

  // SIGN UP
  socket.on("signup", (data, cb) => {
    if (!isValidName(data.user)) {
      return cb({ ok: false, message: "Invalid username" });
    }

    if (users[data.user]) {
      return cb({ ok: false, message: "Username already exists" });
    }

    users[data.user] = data.pass;

    return cb({ ok: true, message: "Account created!" });
  });

  // LOGIN
  socket.on("login", (data, cb) => {
    if (!users[data.user]) {
      return cb({ ok: false, message: "Account not found" });
    }

    if (users[data.user] !== data.pass) {
      return cb({ ok: false, message: "Wrong password" });
    }

    if (onlineUsers.has(data.user)) {
      return cb({ ok: false, message: "Already online" });
    }

    onlineUsers.add(data.user);
    socket.user = data.user;

    return cb({ ok: true, message: "Logged in!" });
  });

  // 💬 CHAT
  socket.on("msg", (data) => {
    if (!data.msg || !data.msg.trim()) return;

    io.emit("msg", {
      user: data.user === OWNER_NAME ? "👑 " + data.user : data.user,
      msg: data.msg
    });
  });

});

http.listen(process.env.PORT || 3000, () =>
  console.log("Server running")
);
