const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const path = require("path");

// Carrega variáveis de ambiente (localmente)
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const app = express();

// Configura EJS e pasta pública
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../views"));
app.use(express.static(path.join(__dirname, "../public")));
app.use(bodyParser.urlencoded({ extended: true }));

// Sessão (funciona local e no Vercel, mas no Vercel expira rápido)
app.use(
  session({
    secret: process.env.SESSION_SECRET || "chave_secreta",
    resave: false,
    saveUninitialized: true,
  })
);

// Middleware de autenticação
function auth(req, res, next) {
  if (req.session && req.session.loggedIn) return next();
  res.redirect("/login");
}

// Rota de login
app.get("/login", (req, res) => {
  res.render("index"); // renderiza views/index.ejs
});

app.post("/login", (req, res) => {
  const { user, pass } = req.body;

  if (
    user === process.env.ADMIN_USER &&
    pass === process.env.ADMIN_PASS
  ) {
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

// 🚀 Se rodar localmente (não no Vercel), sobe servidor
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
  });
}

// Exporta para o Vercel
module.exports = app;
