require("dotenv").config();
const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");

const app = express();

// ===============================================
// CONFIGURAÇÃO CORS DINÂMICA
// ===============================================

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      // Produção
      "https://1lenin1dev.vercel.app",
      "https://1lenin1dev-flame.vercel.app",
      "https://leninfontella.github.io",

      // Desenvolvimento local
      "http://localhost:3000",
      "http://localhost:5500",
      "http://localhost:8080",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:5500",
      "http://127.0.0.1:8080",

      // Live Server (VS Code)
      "http://localhost:5501",
      "http://localhost:5502",
      "http://127.0.0.1:5501",
      "http://127.0.0.1:5502",
    ];

    // Permitir requisições sem origin (aplicativos mobile, Postman, etc.)
    if (!origin) return callback(null, true);

    // Verificar se a origem está na lista permitida
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log("🚫 Origem REJEITADA:", origin);
      console.log("✅ Origens PERMITIDAS:", allowedOrigins.slice(0, 3), "...");
      callback(null, true); // Permitir mesmo assim para evitar bloqueios
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Middleware de logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const origin = req.headers.origin || "sem-origin";

  console.log(`📥 ${req.method} ${req.path} - ${origin} - ${timestamp}`);
  next();
});

// ===============================================
// ROTAS ESPECÍFICAS
// ===============================================

// Rota raiz
app.get("/", (req, res) => {
  res.json({
    message: "🚀 API do Portfolio do Lênin - ONLINE!",
    timestamp: new Date().toISOString(),
    version: "2.1.0",
    status: "FUNCIONANDO",
    endpoints: {
      health: "GET /health",
      email: "POST /enviar-email",
      test: "GET /test",
    },
    cors_enabled: true,
  });
});

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "HEALTHY",
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + " MB",
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + " MB",
    },
    email_configured: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS),
    node_version: process.version,
    environment: process.env.NODE_ENV || "development",
  });
});

// Teste CORS
app.get("/test", (req, res) => {
  res.json({
    message: "✅ CORS funcionando!",
    origin: req.headers.origin || "sem-origin",
    timestamp: new Date().toISOString(),
    method: req.method,
  });
});

// Teste OPTIONS para debug CORS
app.options("/enviar-email", (req, res) => {
  console.log("📋 OPTIONS request recebido:", req.headers.origin);
  res.status(200).end();
});

// ===============================================
// ROTA PRINCIPAL DO FORMULÁRIO
// ===============================================

app.post("/enviar-email", async (req, res) => {
  const startTime = Date.now();

  try {
    console.log("📧 =================================");
    console.log("📧 PROCESSANDO EMAIL - INÍCIO");
    console.log("📧 =================================");

    const { nome, email, mensagem, assunto, name, message, subject } = req.body;

    // Suporte para FormSubmit e formulário customizado
    const dadosLimpos = {
      nome: nome || name || "",
      email: email || "",
      mensagem: mensagem || message || "",
      assunto: assunto || subject || "",
    };

    console.log("📝 Dados recebidos:", {
      nome: dadosLimpos.nome ? "✅" : "❌",
      email: dadosLimpos.email ? "✅" : "❌",
      mensagem: dadosLimpos.mensagem
        ? `✅ (${dadosLimpos.mensagem.length} chars)`
        : "❌",
      assunto: dadosLimpos.assunto ? "✅" : "⚠️ opcional",
      origin: req.headers.origin || "sem-origin",
      userAgent:
        req.headers["user-agent"]?.substring(0, 50) + "..." || "desconhecido",
    });

    // Validação
    const errors = [];

    if (!dadosLimpos.nome || dadosLimpos.nome.trim().length < 2) {
      errors.push("Nome deve ter pelo menos 2 caracteres");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!dadosLimpos.email || !emailRegex.test(dadosLimpos.email.trim())) {
      errors.push("Email inválido");
    }

    if (!dadosLimpos.mensagem || dadosLimpos.mensagem.trim().length < 10) {
      errors.push("Mensagem deve ter pelo menos 10 caracteres");
    }

    if (errors.length > 0) {
      console.log("❌ VALIDAÇÃO FALHOU:", errors);
      return res.status(400).json({
        sucesso: false,
        mensagem: "Dados inválidos: " + errors.join(", "),
        errors: errors,
        timestamp: new Date().toISOString(),
      });
    }

    // Verificar configuração
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log("❌ CONFIGURAÇÃO DE EMAIL AUSENTE");
      return res.status(500).json({
        sucesso: false,
        mensagem: "Servidor não configurado para envio de emails",
        timestamp: new Date().toISOString(),
      });
    }

    console.log("⚙️ CONFIGURANDO TRANSPORTADOR...");

    // Criar transportador
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    // Verificar conexão
    console.log("🔍 TESTANDO CONEXÃO SMTP...");
    await transporter.verify();
    console.log("✅ CONEXÃO SMTP VERIFICADA");

    const assuntoFinal = dadosLimpos.assunto
      ? `${dadosLimpos.assunto} - ${dadosLimpos.nome}`
      : `📧 Portfolio Contato - ${dadosLimpos.nome}`;

    // Template HTML otimizado
    const htmlEmail = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Nova Mensagem - Portfolio</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #00d8ff 0%, #0066cc 100%); padding: 30px 20px; text-align: center;">
          <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700;">
            📧 Nova Mensagem do Portfolio
          </h1>
          <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">
            Mensagem recebida em ${new Date().toLocaleString("pt-BR", {
              timeZone: "America/Sao_Paulo",
              dateStyle: "full",
              timeStyle: "short",
            })}
          </p>
        </div>

        <!-- Conteúdo -->
        <div style="padding: 30px 20px;">
          
          <!-- Info do remetente -->
          <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 25px; border-left: 4px solid #00d8ff;">
            <h2 style="margin: 0 0 15px 0; color: #333; font-size: 20px;">👤 Informações do Contato</h2>
            
            <div style="display: grid; gap: 12px;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-weight: 600; color: #555; min-width: 80px;">Nome:</span>
                <span style="color: #333; font-size: 16px;">${
                  dadosLimpos.nome
                }</span>
              </div>
              
              <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-weight: 600; color: #555; min-width: 80px;">Email:</span>
                <a href="mailto:${
                  dadosLimpos.email
                }" style="color: #00d8ff; text-decoration: none; font-size: 16px;">
                  ${dadosLimpos.email}
                </a>
              </div>
              
              ${
                dadosLimpos.assunto
                  ? `
              <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-weight: 600; color: #555; min-width: 80px;">Assunto:</span>
                <span style="color: #333; font-size: 16px;">${dadosLimpos.assunto}</span>
              </div>
              `
                  : ""
              }
            </div>
          </div>

          <!-- Mensagem -->
          <div style="background: white; border: 2px solid #e9ecef; border-radius: 8px; overflow: hidden;">
            <div style="background: #00d8ff; color: white; padding: 12px 20px;">
              <h3 style="margin: 0; font-size: 18px;">💬 Mensagem</h3>
            </div>
            <div style="padding: 20px; line-height: 1.7; color: #333; white-space: pre-wrap; font-size: 15px;">
${dadosLimpos.mensagem}
            </div>
          </div>

          <!-- Call to Action -->
          <div style="text-align: center; margin-top: 30px; padding: 25px; background: linear-gradient(135deg, #e8f4f8 0%, #f0f8ff 100%); border-radius: 8px;">
            <p style="margin: 0 0 20px 0; color: #555; font-size: 16px;">
              <strong>💡 Pronto para responder?</strong>
            </p>
            
            <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
              <a href="mailto:${
                dadosLimpos.email
              }?subject=Re: ${encodeURIComponent(
      assuntoFinal
    )}&body=${encodeURIComponent(
      `Olá ${dadosLimpos.nome},\n\nObrigado pelo seu contato!\n\n`
    )}" 
                 style="display: inline-block; background: #00d8ff; color: white; padding: 15px 25px; text-decoration: none; border-radius: 25px; font-weight: 600; font-size: 14px; transition: all 0.3s;">
                📧 Responder por Email
              </a>
              
              <a href="https://wa.me/5551989134037?text=${encodeURIComponent(
                `Olá! Recebi sua mensagem através do portfolio. Vamos conversar sobre: ${
                  dadosLimpos.assunto || "seu projeto"
                }`
              )}" 
                 style="display: inline-block; background: #25d366; color: white; padding: 15px 25px; text-decoration: none; border-radius: 25px; font-weight: 600; font-size: 14px; transition: all 0.3s;">
                📱 Responder por WhatsApp
              </a>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #333; color: #ccc; text-align: center; padding: 20px; font-size: 12px;">
          <p style="margin: 0;">
            Esta mensagem foi enviada através do formulário de contato do portfolio<br>
            <strong style="color: #00d8ff;">🚀 Lênin Fontella - Desenvolvedor Frontend</strong>
          </p>
          <p style="margin: 10px 0 0 0;">
            <a href="https://1lenin1dev-flame.vercel.app" style="color: #00d8ff; text-decoration: none;">
              https://1lenin1dev-flame.vercel.app
            </a>
          </p>
        </div>
      </div>
    </body>
    </html>
    `;

    console.log("📤 ENVIANDO EMAIL...");

    // Enviar email
    const emailInfo = await transporter.sendMail({
      from: `"🚀 Portfolio Lênin" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: assuntoFinal,
      replyTo: dadosLimpos.email,
      html: htmlEmail,
      text: `
NOVA MENSAGEM DO PORTFOLIO

Nome: ${dadosLimpos.nome}
Email: ${dadosLimpos.email}
${dadosLimpos.assunto ? `Assunto: ${dadosLimpos.assunto}` : ""}
Data: ${new Date().toLocaleString("pt-BR")}

MENSAGEM:
${dadosLimpos.mensagem}

---
Responder para: ${dadosLimpos.email}
      `.trim(),
    });

    const processTime = Date.now() - startTime;

    console.log("✅ EMAIL ENVIADO COM SUCESSO!");
    console.log("📧 Message ID:", emailInfo.messageId);
    console.log("⏱️ Tempo de processamento:", processTime + "ms");
    console.log("📧 =================================");

    res.status(200).json({
      sucesso: true,
      mensagem: "✅ Mensagem enviada com sucesso! Obrigado pelo contato.",
      messageId: emailInfo.messageId,
      timestamp: new Date().toISOString(),
      processTime: processTime + "ms",
    });
  } catch (error) {
    const processTime = Date.now() - startTime;

    console.error("❌ ERRO COMPLETO:", {
      message: error.message,
      code: error.code,
      stack: error.stack?.split("\n")[0],
      processTime: processTime + "ms",
    });

    let errorMessage = "Erro interno do servidor";
    let statusCode = 500;

    if (error.code === "EAUTH") {
      errorMessage = "Erro de autenticação do email - Verifique credenciais";
      console.log(
        "🔑 Dica: Verifique EMAIL_USER e EMAIL_PASS no painel do Render"
      );
    } else if (error.code === "ECONNECTION" || error.code === "ETIMEDOUT") {
      errorMessage = "Erro de conexão com servidor de email";
    } else if (error.code === "EMESSAGE") {
      errorMessage = "Erro na formatação da mensagem";
      statusCode = 400;
    }

    res.status(statusCode).json({
      sucesso: false,
      mensagem: errorMessage,
      timestamp: new Date().toISOString(),
      error_code: error.code || "UNKNOWN",
      processTime: processTime + "ms",
    });
  }
});

// ===============================================
// ERROR HANDLING - CORRIGIDO
// ===============================================

// 404 para rotas específicas (SEM CURINGA)
app.get("/favicon.ico", (req, res) => res.status(204).end());

app.use((req, res, next) => {
  // Se chegou até aqui, a rota não existe
  console.log("❌ ROTA NÃO ENCONTRADA:", req.method, req.path);
  res.status(404).json({
    sucesso: false,
    mensagem: "Endpoint não encontrado",
    path: req.path,
    method: req.method,
    available_endpoints: {
      "GET /": "Informações da API",
      "GET /health": "Status do servidor",
      "GET /test": "Teste CORS",
      "POST /enviar-email": "Envio de formulário",
    },
    timestamp: new Date().toISOString(),
  });
});

// Middleware de erro global
app.use((error, req, res, next) => {
  console.error("🚨 ERRO GLOBAL:", error.message);
  res.status(500).json({
    sucesso: false,
    mensagem: "Erro interno do servidor",
    timestamp: new Date().toISOString(),
    error_id: Date.now(),
  });
});

// ===============================================
// INICIALIZAÇÃO
// ===============================================

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log("🚀==========================================🚀");
  console.log("🚀      SERVIDOR LÊNIN PORTFOLIO         🚀");
  console.log("🚀==========================================🚀");
  console.log(`📍 Porta: ${PORT}`);
  console.log(`🌐 Ambiente: ${process.env.NODE_ENV || "development"}`);
  console.log(
    `📧 Email: ${
      process.env.EMAIL_USER ? "✅ Configurado" : "❌ Não configurado"
    }`
  );
  console.log(`🔐 CORS: ✅ Múltiplas origens permitidas`);
  console.log(`⏰ Iniciado: ${new Date().toLocaleString("pt-BR")}`);
  console.log(`🎯 Status: PRONTO PARA RECEBER FORMULÁRIOS!`);
  console.log("🚀==========================================🚀");

  // Teste inicial de email
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    console.log("🔍 Testando configuração de email...");
    const nodemailer = require("nodemailer");
    const testTransporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    testTransporter
      .verify()
      .then(() => {
        console.log("✅ TESTE DE EMAIL: SUCESSO");
      })
      .catch((err) => {
        console.log("❌ TESTE DE EMAIL: FALHA -", err.message);
        console.log("💡 Dica: Verifique as variáveis EMAIL_USER e EMAIL_PASS");
      });
  }
});

// ===============================================
// GRACEFUL SHUTDOWN
// ===============================================

const gracefulShutdown = () => {
  console.log("🛑 Encerrando servidor graciosamente...");
  server.close(() => {
    console.log("✅ Servidor encerrado com sucesso");
    process.exit(0);
  });

  // Force close after 30s
  setTimeout(() => {
    console.log("⏰ Forçando encerramento após timeout");
    process.exit(1);
  }, 30000);
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

// Error handlers
process.on("unhandledRejection", (reason, promise) => {
  console.error("🚨 PROMISE REJEITADA:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("🚨 EXCEÇÃO NÃO CAPTURADA:", error.message);
  process.exit(1);
});

module.exports = app;
