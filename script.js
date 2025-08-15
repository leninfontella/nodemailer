// Aguarda o carregamento completo da página
document.addEventListener("DOMContentLoaded", () => {
  // Seleciona o formulário
  const form = document.querySelector("form");
  // Seleciona o elemento para exibir a mensagem de feedback
  const feedbackMessage = document.getElementById("feedback-message");

  // Adiciona um "ouvinte de evento" para o envio do formulário
  form.addEventListener("submit", async (event) => {
    event.preventDefault(); // Impede o envio padrão do formulário

    // Pega os valores dos campos do formulário
    const nome = document.getElementById("nome").value;
    const email = document.getElementById("email").value;
    const mensagem = document.getElementById("mensagem").value;

    // URL do seu backend no Render.
    // Certifique-se de que a URL está correta e completa.

    try {
      // Faz a requisição POST para o backend
      const response = await fetch(
        "https://nodemailer-backend-iweb.onrender.com/enviar-email",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nome,
            email,
            mensagem,
          }),
        }
      );

      // Converte a resposta para JSON
      const data = await response.json();

      // Verifica se a requisição foi bem-sucedida
      if (response.ok) {
        // Exibe a mensagem de sucesso
        feedbackMessage.textContent = data.mensagem;
        feedbackMessage.style.color = "green";
        form.reset(); // Limpa o formulário
      } else {
        // Exibe a mensagem de erro
        feedbackMessage.textContent =
          data.mensagem || "Erro ao enviar o email.";
        feedbackMessage.style.color = "red";
      }
    } catch (error) {
      console.error("Erro na requisição:", error);
      feedbackMessage.textContent =
        "Ocorreu um erro. Tente novamente mais tarde.";
      feedbackMessage.style.color = "red";
    }
  });
});
