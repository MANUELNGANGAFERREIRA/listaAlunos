const express = require("express");
const router = express.Router();
const { getData, saveData } = require("../services/githubService");

router.get("/", async (req, res) => {
  const { data } = await getData();
  res.render("alunos", { alunos: data });
});

router.post("/add", async (req, res) => {
  const { data, sha } = await getData();

  const novoAluno = {
    id: Date.now(),
    nome: req.body.nome,
    contacto: req.body.contacto,
    pago: false,
    dataInicio: new Date().toISOString()
  };

  data.push(novoAluno);
  await saveData(data, sha);

  res.redirect("/alunos");
});

router.post("/pagar/:id", async (req, res) => {
  const { data, sha } = await getData();

  const aluno = data.find(a => a.id == req.params.id);
  if (aluno) aluno.pago = true;

  await saveData(data, sha);
  res.redirect("/alunos");
});

module.exports = router;
