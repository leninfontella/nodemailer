# Nodemailer Backend

Servidor rodando em: ==> Available at your primary URL https://nodemailer-backend-iweb.onrender.com

Este projeto é um backend simples para envio de e-mails, utilizando o Nodemailer. Ele fornece uma API REST para que outros serviços possam solicitar o envio de e-mails de forma fácil e segura.

## 🚀 Funcionalidades

  * **Envio de e-mail**: Envia e-mails com HTML, texto simples e anexos.
  * **API REST**: Interface simples para integração com outros serviços.
  * **Configurável**: Permite a configuração de diferentes provedores de e-mail (Gmail, Outlook, etc.).
  * **Seguro**: Utiliza variáveis de ambiente para armazenar credenciais sensíveis.

## ⚙️ Pré-requisitos

Antes de começar, certifique-se de ter o seguinte instalado:

  * [Node.js](https://nodejs.org/en/)
  * [npm](https://www.npmjs.com/)

## 🛠️ Instalação

1.  Clone o repositório:

<!-- end list -->

```bash
git clone https://github.com/seu-usuario/seu-repositorio.git
```

2.  Navegue até o diretório do projeto:

<!-- end list -->

```bash
cd seu-repositorio
```

3.  Instale as dependências:

<!-- end list -->

```bash
npm install
```

## 📝 Configuração

Crie um arquivo `.env` na raiz do projeto e adicione as seguintes variáveis:

```
# Credenciais do provedor de e-mail
EMAIL_USER=seu-email@gmail.com
EMAIL_PASS=sua-senha-de-aplicativo

# Informações do servidor SMTP (pode variar dependendo do provedor)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
```

**Atenção**: Para o Gmail, é necessário gerar uma "senha de aplicativo". Consulte a [documentação oficial do Google](https://support.google.com/accounts/answer/185833?hl=pt) para saber como fazer isso.

## ▶️ Como Rodar

Inicie o servidor com o seguinte comando:

```bash
npm start
```

O servidor estará rodando em `http://localhost:3000`.

-----

## 📚 Endpoints da API

### `POST /send-email`

Envia um e-mail com os dados fornecidos no corpo da requisição.

#### Corpo da requisição

```json
{
  "to": "destinatario@exemplo.com",
  "subject": "Assunto do E-mail",
  "text": "Olá, este é um e-mail de teste.",
  "html": "<h1>Olá, este é um e-mail de teste em HTML.</h1>",
  "attachments": [
    {
      "filename": "anexo.txt",
      "content": "Conteúdo do anexo"
    }
  ]
}
```

-----

## 🤝 Contribuição

Sinta-se à vontade para contribuir com melhorias, correções de bugs ou novas funcionalidades. Para isso, siga os passos abaixo:

1.  Faça um fork do projeto.
2.  Crie uma nova branch para sua feature (`git checkout -b feature/nova-feature`).
3.  Commit suas mudanças (`git commit -m 'feat: Adiciona nova feature'`).
4.  Envie para a branch (`git push origin feature/nova-feature`).
5.  Abra um **Pull Request**.

## 📝 Licença

Este projeto está sob a licença [MIT](https://opensource.org/licenses/MIT).

-----

Feito com ❤️ por [Seu Nome](https://www.google.com/search?q=https://github.com/seu-usuario)
