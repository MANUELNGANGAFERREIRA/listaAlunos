const express = require("express");
const router = express.Router();
const { getData, saveData } = require("../services/githubService");

// Middleware de validação
const validateAluno = (req, res, next) => {
  const { nome, contacto } = req.body;
  
  if (!nome || nome.trim().length < 2) {
    return res.status(400).json({ error: "Nome deve ter pelo menos 2 caracteres" });
  }
  
  if (!contacto || contacto.trim().length < 3) {
    return res.status(400).json({ error: "Contacto é obrigatório" });
  }
  
  next();
};

// Helper para calcular dias desde o pagamento
const calcularDiasDesdePagamento = (dataPagamento) => {
  if (!dataPagamento) return Infinity;
  const hoje = new Date();
  const dataPag = new Date(dataPagamento);
  return Math.floor((hoje - dataPag) / (1000 * 60 * 60 * 24));
};

// Helper para gerar ID único
const gerarIdUnico = () => Date.now() + Math.floor(Math.random() * 1000);

// Rota principal - Listar alunos
router.get("/", async (req, res) => {
  try {
    const { data: alunos, sha } = await getData();
    
    if (!Array.isArray(alunos)) {
      throw new Error("Dados inválidos do repositório");
    }

    const hoje = new Date();
    let houveAlteracao = false;
    const alunosAtualizados = alunos.map(aluno => {
      const alunoCopy = { ...aluno };
      
      // Verifica se passou 30 dias do pagamento
      if (alunoCopy.pago && alunoCopy.dataPagamento) {
        const diffDias = calcularDiasDesdePagamento(alunoCopy.dataPagamento);
        
        if (diffDias >= 30) {
          alunoCopy.pago = false;
          alunoCopy.dataPagamento = null;
          alunoCopy.ultimaAtualizacao = hoje.toISOString();
          houveAlteracao = true;
        }
      }
      
      // Adiciona informação de dias desde o pagamento
      alunoCopy.diasDesdePagamento = alunoCopy.pago ? 
        calcularDiasDesdePagamento(alunoCopy.dataPagamento) : null;
      
      return alunoCopy;
    });

    // Salva apenas se houve alterações
    if (houveAlteracao) {
      await saveData(alunosAtualizados, sha);
    }

    res.render("alunos", { 
      alunos: alunosAtualizados,
      success: req.query.success,
      error: req.query.error
    });
    
  } catch (err) {
    console.error("Erro ao listar alunos:", err);
    res.status(500).render("error", { 
      message: "Erro ao carregar lista de alunos",
      error: process.env.NODE_ENV === 'development' ? err : {}
    });
  }
});

// Adicionar aluno
router.post("/add", validateAluno, async (req, res) => {
  try {
    const { data: alunos, sha } = await getData();
    const { nome, contacto } = req.body;

    // Verifica se aluno já existe
    const alunoExistente = alunos.find(a => 
      a.nome.toLowerCase() === nome.toLowerCase().trim()
    );
    
    if (alunoExistente) {
      return res.redirect("/alunos?error=Aluno já existe");
    }

    const novoAluno = {
      id: gerarIdUnico(),
      nome: nome.trim(),
      contacto: contacto.trim(),
      pago: false,
      dataPagamento: null,
      dataInicio: new Date().toISOString(),
      ultimaAtualizacao: new Date().toISOString()
    };

    const novosAlunos = [...alunos, novoAluno];
    await saveData(novosAlunos, sha);

    res.redirect("/alunos?success=Aluno adicionado com sucesso");
    
  } catch (err) {
    console.error("Erro ao adicionar aluno:", err);
    res.redirect("/alunos?error=Erro ao adicionar aluno");
  }
});

// Eliminar aluno
router.post("/delete/:id", async (req, res) => {
  try {
    const { data: alunos, sha } = await getData();
    const alunoId = parseInt(req.params.id);
    
    if (isNaN(alunoId)) {
      return res.redirect("/alunos?error=ID inválido");
    }

    const aluno = alunos.find(a => a.id === alunoId);
    if (!aluno) {
      return res.redirect("/alunos?error=Aluno não encontrado");
    }

    const novosAlunos = alunos.filter(a => a.id !== alunoId);
    await saveData(novosAlunos, sha);

    res.redirect("/alunos?success=Aluno eliminado com sucesso");
    
  } catch (err) {
    console.error("Erro ao eliminar aluno:", err);
    res.redirect("/alunos?error=Erro ao eliminar aluno");
  }
});

// Marcar pagamento
router.post("/pagar/:id", async (req, res) => {
  try {
    const { data: alunos, sha } = await getData();
    const alunoId = parseInt(req.params.id);
    
    if (isNaN(alunoId)) {
      return res.redirect("/alunos?error=ID inválido");
    }

    const alunoIndex = alunos.findIndex(a => a.id === alunoId);
    if (alunoIndex === -1) {
      return res.redirect("/alunos?error=Aluno não encontrado");
    }

    const alunoAtualizado = {
      ...alunos[alunoIndex],
      pago: true,
      dataPagamento: new Date().toISOString(),
      ultimaAtualizacao: new Date().toISOString()
    };

    const novosAlunos = [...alunos];
    novosAlunos[alunoIndex] = alunoAtualizado;
    
    await saveData(novosAlunos, sha);

    res.redirect("/alunos?success=Pagamento registado com sucesso");
    
  } catch (err) {
    console.error("Erro ao marcar pagamento:", err);
    res.redirect("/alunos?error=Erro ao registrar pagamento");
  }
});

// Rota para API JSON (opcional)
router.get("/api", async (req, res) => {
  try {
    const { data: alunos } = await getData();
    res.json({ alunos });
  } catch (err) {
    res.status(500).json({ error: "Erro ao carregar dados" });
  }
});

module.exports = router;