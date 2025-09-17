require("dotenv").config();
const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");

const app = express();

// Configuração do CORS corrigida para permitir múltiplos domínios
const corsOptions = {
  origin: [
    "https://1lenin1dev.vercel.app",
    "https://1lenin1dev-flame.vercel.app",
    "https://leninfontella.github.io",
    "http://localhost:3000",
    "http://localhost:5500",
    "http://127.0.0.1:5500",
  ],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Middleware para logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log("Origin:", req.headers.origin);
  next();
});

// Rota de teste
app.get("/", (req, res) => {
  res.json({
    message: "API do Portfolio do Lênin funcionando!",
    timestamp: new Date().toISOString(),
    cors: corsOptions.origin,
  });
});

// Rota para health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

// Rota principal do formulário
app.post("/enviar-email", async (req, res) => {
  try {
    const { nome, email, mensagem, assunto } = req.body;

    // Validação dos dados
    if (!nome || !email || !mensagem) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Todos os campos obrigatórios devem ser preenchidos",
      });
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Formato de email inválido",
      });
    }

    console.log("Dados recebidos:", {
      nome,
      email,
      assunto,
      mensagem: mensagem.substring(0, 50) + "...",
    });

    // Configuração do transportador de email
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

    // Verificar conexão antes de enviar
    await transporter.verify();
    console.log("Conexão SMTP verificada");

    const assuntoFinal = assunto
      ? `${assunto} - de ${nome}`
      : `Nova mensagem de ${nome}`;

    // Enviar email
    const info = await transporter.sendMail({
      from: `"Portfolio Lênin" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: assuntoFinal,
      replyTo: email,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 10px;">
          <div style="background: linear-gradient(135deg, #00d8ff 0%, #0066cc 100%); padding: 20px; border-radius: 10px; margin-bottom: 20px;">
            <h2 style="color: white; margin: 0; text-align: center;">📧 Nova Mensagem do Portfolio</h2>
          </div>
          
          <div style="background: white; padding: 25px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h3 style="color: #333; margin-top: 0;">Informações do Contato:</h3>
            
            <div style="margin: 15px 0; padding: 15px; background: #f0f8ff; border-left: 4px solid #00d8ff; border-radius: 5px;">
              <p style="margin: 5px 0;"><strong>👤 Nome:</strong> ${nome}</p>
              <p style="margin: 5px 0;"><strong>📧 Email:</strong> <a href="mailto:${email}" style="color: #00d8ff;">${email}</a></p>
              ${
                assunto
                  ? `<p style="margin: 5px 0;"><strong>📝 Assunto:</strong> ${assunto}</p>`
                  : ""
              }
              <p style="margin: 5px 0;"><strong>🕐 Data/Hora:</strong> ${new Date().toLocaleString(
                "pt-BR",
                { timeZone: "America/Sao_Paulo" }
              )}</p>
            </div>

            <h3 style="color: #333;">💬 Mensagem:</h3>
            <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; border-left: 4px solid #00bcd4; white-space: pre-wrap; line-height: 1.6;">
              ${mensagem}
            </div>

            <div style="margin-top: 30px; padding: 20px; background: #e8f4f8; border-radius: 8px; text-align: center;">
              <p style="margin: 0; color: #666;">
                <strong>💡 Dica:</strong> Você pode responder diretamente clicando no email acima ou usar o botão abaixo:
              </p>
              <a href="mailto:${email}?subject=Re: ${assuntoFinal}" 
                 style="display: inline-block; margin-top: 15px; background: #00d8ff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 25px; font-weight: bold;">
                📧 Responder Agora
              </a>
            </div>
          </div>

          <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
            <p>Esta mensagem foi enviada através do formulário de contato do portfolio</p>
            <p>🚀 <strong>Portfolio Lênin Dev</strong> - Desenvolvedor Frontend</p>
          </div>
        </div>
      `,
    });

    console.log("Email enviado com sucesso:", info.messageId);

    res.status(200).json({
      sucesso: true,
      mensagem: "Email enviado com sucesso! Obrigado pelo contato.",
      messageId: info.messageId,
    });
  } catch (error) {
    console.error("Erro ao enviar email:", error);

    // Diferentes tipos de erro
    let errorMessage = "Erro interno do servidor";

    if (error.code === "EAUTH") {
      errorMessage = "Erro de autenticação do email";
    } else if (error.code === "ECONNECTION") {
      errorMessage = "Erro de conexão com servidor de email";
    } else if (error.code === "EMESSAGE") {
      errorMessage = "Erro na formatação da mensagem";
    }

    res.status(500).json({
      sucesso: false,
      mensagem: errorMessage,
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Middleware para capturar rotas não encontradas
app.use("*", (req, res) => {
  res.status(404).json({
    sucesso: false,
    mensagem: "Endpoint não encontrado",
    path: req.path,
    method: req.method,
  });
});

// Middleware para tratamento de erros globais
app.use((error, req, res, next) => {
  console.error("Erro global capturado:", error);
  res.status(500).json({
    sucesso: false,
    mensagem: "Erro interno do servidor",
    timestamp: new Date().toISOString(),
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`🌐 Ambiente: ${process.env.NODE_ENV || "development"}`);
  console.log(
    `📧 Email configurado: ${process.env.EMAIL_USER ? "Sim" : "Não"}`
  );
  console.log(`🔐 CORS origins: ${corsOptions.origin.join(", ")}`);
});

// Tratamento graceful de shutdown
process.on("SIGTERM", () => {
  console.log("🛑 Recebido SIGTERM, encerrando servidor...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("🛑 Recebido SIGINT, encerrando servidor...");
  process.exit(0);
});
