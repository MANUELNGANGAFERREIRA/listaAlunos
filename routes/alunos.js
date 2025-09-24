const express = require("express");
const router = express.Router();
const { getData, saveData } = require("../services/githubService");
const PDFDocument = require("pdfkit");

// rota principal - listar alunos
router.get("/", async (req, res) => {
  try {
    const { data } = await getData();
    res.render("alunos", { alunos: data });
  } catch (err) {
    console.error("Erro ao carregar alunos:", err);
    res.status(500).send("Erro ao carregar alunos");
  }
});

// adicionar novo aluno
router.post("/add", async (req, res) => {
  try {
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
  } catch (err) {
    console.error("Erro ao adicionar aluno:", err);
    res.status(500).send("Erro ao adicionar aluno");
  }
});

// rota para gerar PDF da lista de alunos
router.get("/pdf", async (req, res) => {
  try {
    const { data } = await getData(); // pega o array de alunos do GitHub

    // cria o PDF
    const doc = new PDFDocument();

    // configura headers para download
    res.setHeader("Content-disposition", "attachment; filename=alunos.pdf");
    res.setHeader("Content-type", "application/pdf");

    doc.pipe(res);

    doc.fontSize(18).text("Lista de Alunos e Pagamentos", { align: "center" });
    doc.moveDown();

    data.forEach((aluno, i) => {
      doc
        .fontSize(12)
        .text(`${i + 1}. ${aluno.nome} - Pagamento: ${aluno.pago ? "Pago" : "Pendente"}`);
    });

    doc.end();
  } catch (err) {
    console.error("Erro ao gerar PDF:", err);
    res.status(500).send("Erro ao gerar PDF");
  }
});

// marcar aluno como pago
router.post("/pagar/:id", async (req, res) => {
  try {
    const { data, sha } = await getData();

    const aluno = data.find(a => a.id == req.params.id);
    if (aluno) aluno.pago = true;

    await saveData(data, sha);
    res.redirect("/alunos");
  } catch (err) {
    console.error("Erro ao atualizar pagamento:", err);
    res.status(500).send("Erro ao atualizar pagamento");
  }
});

module.exports = router;
