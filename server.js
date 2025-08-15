require("dotenv").config();
const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
const app = express();

const corsOptions = {
  origin: "https://1lenin1dev.vercel.app/",
};

app.use(cors(corsOptions)); // Aplique a nova configuração

app.use(cors());
app.use(express.json());

app.post("/enviar-email", async (req, res) => {
  const { nome, email, mensagem } = req.body;

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Portfolio" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: `Nova mensagem de ${nome}`,
      html: `
        <h3>Você recebeu uma nova mensagem</h3>
        <p><strong>Nome:</strong> ${nome}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Mensagem:</strong> ${mensagem}</p>
      `,
    });

    res
      .status(200)
      .json({ sucesso: true, mensagem: "Email enviado com sucesso!" });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ sucesso: false, mensagem: "Erro ao enviar o email" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
