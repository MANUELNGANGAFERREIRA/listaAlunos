const express = require("express");
const router = express.Router();
const { getData, saveData } = require("../services/githubService");

// rota para listar alunos
router.get("/", async (req, res) => {
  const { data, sha } = await getData();

  // verifica se passou 30 dias dos pagamentos
  const hoje = new Date();
  data.forEach(aluno => {
    if (aluno.pago && aluno.dataPagamento) {
      const dataPag = new Date(aluno.dataPagamento);
      const diffDias = Math.floor((hoje - dataPag) / (1000 * 60 * 60 * 24));
      if (diffDias >= 30) {
        aluno.pago = false;
        delete aluno.dataPagamento; // remove data do pagamento
      }
    }
  });

  // salva se houve alterações
  await saveData(data, sha);

  res.render("alunos", { alunos: data });
});

// adicionar aluno
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

// marcar pagamento
router.post("/pagar/:id", async (req, res) => {
  const { data, sha } = await getData();

  const aluno = data.find(a => a.id == req.params.id);
  if (aluno) {
    aluno.pago = true;
    aluno.dataPagamento = new Date().toISOString(); // salva data do pagamento
  }

  await saveData(data, sha);
  res.redirect("/alunos");
});

module.exports = router;
