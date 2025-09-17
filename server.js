require("dotenv").config();
const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");

const app = express();

// ===============================================
// CONFIGURAÇÃO CORS DINÂMICA - SOLUÇÃO DEFINITIVA
// ===============================================

const corsOptions = {
  origin: function (origin, callback) {
    // Lista de origens permitidas
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
      // Log da origem rejeitada para debug
      console.log("🚫 Origem REJEITADA:", origin);
      console.log("✅ Origens PERMITIDAS:", allowedOrigins);
      callback(new Error("Não permitido pelo CORS"), false);
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
  preflightContinue: false,
};

// Middleware CORS
app.use(cors(corsOptions));

// Middleware para parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Middleware de logging detalhado
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const origin = req.headers.origin || "sem-origin";
  const userAgent = req.headers["user-agent"] || "desconhecido";

  console.log("📥 REQUISIÇÃO RECEBIDA:");
  console.log(`   Timestamp: ${timestamp}`);
  console.log(`   Método: ${req.method}`);
  console.log(`   Path: ${req.path}`);
  console.log(`   Origin: ${origin}`);
  console.log(`   User-Agent: ${userAgent.substring(0, 100)}...`);
  console.log("---");

  next();
});

// ===============================================
// ROTAS
// ===============================================

// Rota raiz - informações do servidor
app.get("/", (req, res) => {
  res.json({
    message: "🚀 API do Portfolio do Lênin - FUNCIONANDO!",
    timestamp: new Date().toISOString(),
    version: "2.0.0",
    endpoints: {
      health: "/health",
      email: "/enviar-email (POST)",
      test: "/test",
    },
    cors: {
      enabled: true,
      note: "CORS configurado dinamicamente para múltiplas origens",
    },
    status: "ONLINE",
  });
});

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "HEALTHY",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    email_configured: !!process.env.EMAIL_USER,
  });
});

// Rota de teste CORS
app.get("/test", (req, res) => {
  res.json({
    message: "CORS funcionando!",
    origin: req.headers.origin,
    timestamp: new Date().toISOString(),
  });
});

// Rota principal do formulário
app.post("/enviar-email", async (req, res) => {
  try {
    console.log("📧 INICIANDO PROCESSAMENTO DE EMAIL");

    const { nome, email, mensagem, assunto } = req.body;

    console.log("📝 Dados recebidos:", {
      nome: nome || "NÃO FORNECIDO",
      email: email || "NÃO FORNECIDO",
      assunto: assunto || "NÃO FORNECIDO",
      mensagem_length: mensagem ? mensagem.length : 0,
    });

    // Validação rigorosa
    const errors = [];

    if (!nome || nome.trim().length < 2) {
      errors.push("Nome deve ter pelo menos 2 caracteres");
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push("Email inválido");
    }

    if (!mensagem || mensagem.trim().length < 10) {
      errors.push("Mensagem deve ter pelo menos 10 caracteres");
    }

    if (errors.length > 0) {
      console.log("❌ VALIDAÇÃO FALHOU:", errors);
      return res.status(400).json({
        sucesso: false,
        mensagem: "Dados inválidos: " + errors.join(", "),
        errors: errors,
      });
    }

    // Verificar configuração do email
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log("❌ CONFIGURAÇÃO DE EMAIL AUSENTE");
      return res.status(500).json({
        sucesso: false,
        mensagem: "Servidor não configurado corretamente",
      });
    }

    console.log("⚙️ CONFIGURANDO TRANSPORTADOR DE EMAIL");

    // Configuração do transportador
    const transporter = nodemailer.createTransporter({
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
    console.log("🔍 VERIFICANDO CONEXÃO SMTP...");
    await transporter.verify();
    console.log("✅ CONEXÃO SMTP VERIFICADA");

    const assuntoFinal = assunto
      ? `${assunto} - ${nome}`
      : `📧 Contato Portfolio - ${nome}`;

    // Template de email melhorado
    const htmlTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Nova Mensagem - Portfolio</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      
      <div style="background: linear-gradient(135deg, #00d8ff 0%, #0066cc 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
        <h1 style="color: white; margin: 0; font-size: 24px;">📧 Nova Mensagem do Portfolio</h1>
      </div>

      <div style="background: #f9f9f9; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
        <h2 style="color: #333; margin-top: 0;">👤 Informações do Contato</h2>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold; width: 30%;">Nome:</td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${nome}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">Email:</td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">
              <a href="mailto:${email}" style="color: #00d8ff; text-decoration: none;">${email}</a>
            </td>
          </tr>
          ${
            assunto
              ? `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">Assunto:</td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${assunto}</td>
          </tr>
          `
              : ""
          }
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">Data/Hora:</td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">
              ${new Date().toLocaleString("pt-BR", {
                timeZone: "America/Sao_Paulo",
                dateStyle: "full",
                timeStyle: "medium",
              })}
            </td>
          </tr>
        </table>
      </div>

      <div style="background: white; padding: 20px; border-radius: 10px; border-left: 5px solid #00d8ff; margin-bottom: 20px;">
        <h2 style="color: #333; margin-top: 0;">💬 Mensagem</h2>
        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; white-space: pre-wrap; line-height: 1.8;">
${mensagem}
        </div>
      </div>

      <div style="background: #e8f4f8; padding: 20px; border-radius: 10px; text-align: center;">
        <p style="margin: 0 0 15px 0; color: #555;">
          <strong>💡 Responder:</strong> Clique no email acima ou use o botão abaixo
        </p>
        <a href="mailto:${email}?subject=Re: ${assuntoFinal}&body=Olá ${nome},%0A%0AObrigado pelo seu contato!%0A%0A" 
           style="display: inline-block; background: #00d8ff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 25px; font-weight: bold;">
          📧 Responder Agora
        </a>
      </div>

      <div style="text-align: center; margin-top: 30px; padding: 20px; color: #666; font-size: 12px; border-top: 1px solid #ddd;">
        <p>Esta mensagem foi enviada através do formulário de contato do portfolio</p>
        <p style="margin: 10px 0 0 0;">
          🚀 <strong>Portfolio Lênin Fontella</strong> - Desenvolvedor Frontend<br>
          <a href="https://1lenin1dev-flame.vercel.app" style="color: #00d8ff;">https://1lenin1dev-flame.vercel.app</a>
        </p>
      </div>

    </body>
    </html>
    `;

    console.log("📤 ENVIANDO EMAIL...");

    // Enviar email
    const info = await transporter.sendMail({
      from: `"🚀 Portfolio Lênin" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: assuntoFinal,
      replyTo: email,
      html: htmlTemplate,
      text: `
Nova mensagem do portfolio:

Nome: ${nome}
Email: ${email}
${assunto ? `Assunto: ${assunto}` : ""}
Data: ${new Date().toLocaleString("pt-BR")}

Mensagem:
${mensagem}

---
Responder para: ${email}
      `.trim(),
    });

    console.log("✅ EMAIL ENVIADO COM SUCESSO!");
    console.log("📧 Message ID:", info.messageId);

    res.status(200).json({
      sucesso: true,
      mensagem: "✅ Mensagem enviada com sucesso! Obrigado pelo contato.",
      messageId: info.messageId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ ERRO COMPLETO:", error);

    let errorMessage = "Erro interno do servidor";
    let statusCode = 500;

    if (error.code === "EAUTH") {
      errorMessage = "Erro de autenticação do email";
      console.log("🔑 Verifique EMAIL_USER e EMAIL_PASS");
    } else if (error.code === "ECONNECTION" || error.code === "ETIMEDOUT") {
      errorMessage = "Erro de conexão com servidor de email";
      console.log("🌐 Problema de conectividade");
    } else if (error.code === "EMESSAGE") {
      errorMessage = "Erro na formatação da mensagem";
      statusCode = 400;
    }

    res.status(statusCode).json({
      sucesso: false,
      mensagem: errorMessage,
      timestamp: new Date().toISOString(),
      error_code: error.code || "UNKNOWN",
      debug:
        process.env.NODE_ENV === "development"
          ? {
              message: error.message,
              stack: error.stack,
            }
          : undefined,
    });
  }
});

// ===============================================
// ERROR HANDLING
// ===============================================

// 404 - Rota não encontrada
app.use("*", (req, res) => {
  console.log("❌ ROTA NÃO ENCONTRADA:", req.method, req.path);
  res.status(404).json({
    sucesso: false,
    mensagem: "Endpoint não encontrado",
    path: req.path,
    method: req.method,
    available_endpoints: ["/", "/health", "/test", "/enviar-email"],
    timestamp: new Date().toISOString(),
  });
});

// Middleware de erro global
app.use((error, req, res, next) => {
  console.error("🚨 ERRO GLOBAL CAPTURADO:", error);
  res.status(500).json({
    sucesso: false,
    mensagem: "Erro interno do servidor",
    timestamp: new Date().toISOString(),
    error_id: Date.now(),
  });
});

// ===============================================
// INICIALIZAÇÃO DO SERVIDOR
// ===============================================

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log("🚀=================================🚀");
  console.log("🚀  SERVIDOR INICIADO COM SUCESSO  🚀");
  console.log("🚀=================================🚀");
  console.log(`📍 Porta: ${PORT}`);
  console.log(`🌐 Ambiente: ${process.env.NODE_ENV || "development"}`);
  console.log(
    `📧 Email configurado: ${process.env.EMAIL_USER ? "✅ SIM" : "❌ NÃO"}`
  );
  console.log(`🔐 CORS: ✅ DINÂMICO (múltiplas origens)`);
  console.log(`⏰ Iniciado em: ${new Date().toLocaleString("pt-BR")}`);
  console.log("🚀=================================🚀");

  // Testar conexão de email na inicialização
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    const nodemailer = require("nodemailer");
    const testTransporter = nodemailer.createTransporter({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    testTransporter
      .verify()
      .then(() => {
        console.log("✅ CONEXÃO DE EMAIL: FUNCIONANDO");
      })
      .catch((err) => {
        console.log("❌ CONEXÃO DE EMAIL: FALHA -", err.message);
      });
  }
});

// ===============================================
// GRACEFUL SHUTDOWN
// ===============================================

process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM recebido, encerrando servidor graciosamente...");
  server.close(() => {
    console.log("✅ Servidor encerrado");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("🛑 SIGINT recebido, encerrando servidor graciosamente...");
  server.close(() => {
    console.log("✅ Servidor encerrado");
    process.exit(0);
  });
});

// Capturar erros não tratados
process.on("unhandledRejection", (reason, promise) => {
  console.error("🚨 PROMISE REJEITADA:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("🚨 EXCEÇÃO NÃO CAPTURADA:", error);
  process.exit(1);
});

module.exports = app;
