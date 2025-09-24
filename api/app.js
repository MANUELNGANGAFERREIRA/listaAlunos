const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const path = require("path");

require("dotenv").config();

const app = express();

// Configura EJS e public
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../views"));
app.use(express.static(path.join(__dirname, "../public")));
app.use(bodyParser.urlencoded({ extended: true }));

// Sessão simples (⚠️ no Vercel pode expirar rápido)
app.use(
  session({
    secret: process.env.SESSION_SECRET || "chave_secreta",
    resave: false,
    saveUninitialized: true
  })
);

function auth(req, res, next) {
  if (req.session && req.session.loggedIn) return next();
  res.redirect("/login");
}

// Login
app.get("/login", (req, res) => {
  res.render("index");
});

app.post("/login", (req, res) => {
  const { user, pass } = req.body;
  if (user === "prof" && pass === "1234") {
    req.session.loggedIn = true;
    res.redirect("/alunos");
  } else {
    res.send("Credenciais inválidas");
  }
});

// Rotas de alunos
const alunosRoutes = require("../routes/alunos");
app.use("/alunos", auth, alunosRoutes);

// Rota raiz
app.get("/", (req, res) => res.redirect("/login"));

// Exporta para Vercel
module.exports = app;
