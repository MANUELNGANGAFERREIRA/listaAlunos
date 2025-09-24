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
const PDFDocument = require("pdfkit");

// rota para gerar o PDF
router.get("/pdf", async (req, res) => {
  try {
    const alunos = await githubService.getData(); // pega os alunos do JSON do GitHub

    // cria o PDF
    const doc = new PDFDocument();

    // configura headers pra download
    res.setHeader("Content-disposition", "attachment; filename=alunos.pdf");
    res.setHeader("Content-type", "application/pdf");

    doc.pipe(res);

    doc.fontSize(18).text("Lista de Alunos e Pagamentos", { align: "center" });
    doc.moveDown();

    alunos.forEach((aluno, i) => {
      doc.fontSize(12).text(
        `${i + 1}. ${aluno.nome} - Pagamento: ${aluno.pagamento || "Pendente"}`
      );
    });

    doc.end();
  } catch (err) {
    res.status(500).send("Erro ao gerar PDF");
  }
});

router.post("/pagar/:id", async (req, res) => {
  const { data, sha } = await getData();

  const aluno = data.find(a => a.id == req.params.id);
  if (aluno) aluno.pago = true;

  await saveData(data, sha);
  res.redirect("/alunos");
});

module.exports = router;
