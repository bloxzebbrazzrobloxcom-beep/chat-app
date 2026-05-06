const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const fs = require("fs");

// 📂 Ladda filer
let users = {};
let admins = {};

if (fs.existsSync("users.json")) {
  users = JSON.parse(fs.readFileSync("users.json"));
}

if (fs.existsSync("admins.json")) {
  admins = JSON.parse(fs.readFileSync("admins.json"));
}

// 💾 spara users
function saveUsers() {
  fs.writeFileSync("users.json", JSON.stringify(users, null, 2));
}

// 🌐 FRONTEND
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

    function signup() {
      const user = document.getElementById("user").value;
      const pass = document.getElementById("pass").value;

      socket.emit("signup", { user, pass }, (res) => {
        document.getElementById("msg").innerText = res.message;
      });
    }

    function login() {
      const user = document.getElementById("user").value;
      const pass = document.getElementById("pass").value;

      socket.emit("login", { user, pass }, (res) => {
        if (!res.ok) {
          document.getElementById("msg").innerText = res.message;
          return;
        }

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

      socket.emit("msg", { msg: text });
      document.getElementById("text").value = "";
    }
  </script>
  `);
});

// 🔐 SERVER
io.on("connection", (socket) => {

  // 📝 SIGN UP
  socket.on("signup", (data, cb) => {
    const user = data.user;
    const pass = data.pass;

    if (!user || !pass) {
      return cb({ ok: false, message: "Fill all fields" });
    }

    if (users[user] || admins[user]) {
      return cb({ ok: false, message: "Username already exists" });
    }

    users[user] = { password: pass };
    saveUsers();

    return cb({ ok: true, message: "Account created!" });
  });

  // 🔐 LOGIN
  socket.on("login", (data, cb) => {

    // 👑 ADMIN
    if (admins[data.user]) {
      if (admins[data.user].password !== data.pass) {
        return cb({ ok: false, message: "Wrong password" });
      }

      socket.user = data.user;
      socket.admin = true;

      return cb({ ok: true, message: "Admin login!" });
    }

    // 👤 USER
    if (users[data.user]) {
      if (users[data.user].password !== data.pass) {
        return cb({ ok: false, message: "Wrong password" });
      }

      socket.user = data.user;
      socket.admin = false;

      return cb({ ok: true, message: "Logged in!" });
    }

    return cb({ ok: false, message: "Account not found" });
  });

  // 💬 CHAT
  socket.on("msg", (data) => {
    if (!socket.user) return;
    if (!data.msg || !data.msg.trim()) return;

    io.emit("msg", {
      user: socket.admin ? "👑 " + socket.user : socket.user,
      msg: data.msg
    });
  });

});

http.listen(process.env.PORT || 3000, () =>
  console.log("Server running")
);
