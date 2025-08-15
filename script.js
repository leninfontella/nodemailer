document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("#contact-form");
  const feedbackMessage = document.getElementById("feedback-message");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const nome = document.getElementById("nome").value;
    const email = document.getElementById("email").value;
    const mensagem = document.getElementById("mensagem").value;

    const url = "https://nodemailer-backend-iweb.onrender.com/enviar-email";

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome,
          email,
          mensagem,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        feedbackMessage.textContent = data.mensagem;
        feedbackMessage.style.color = "green";
        form.reset();
      } else {
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
