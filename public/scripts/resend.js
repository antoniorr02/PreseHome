document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("resend-form");
    const errorMessage = document.getElementById("error-message");
  
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
  
      const formData = new FormData(form);
      const email = formData.get("email");

      try {
        const response = await fetch("http://localhost:5000/reenviar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
  
        const result = await response.json();
  
        if (!response.ok) {
          errorMessage.textContent = result.error || "Error al reenviar correo de confirmación";
          errorMessage.classList.remove("hidden");
        } else {
          window.location.href = "/";
        }
      } catch (error) {
        errorMessage.textContent = "Error de conexión con el servidor";
        errorMessage.classList.remove("hidden");
      }
    });
  });
  