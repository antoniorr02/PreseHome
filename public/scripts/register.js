document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("register-form");
    const errorMessage = document.getElementById("error-message");
  
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
  
      const formData = new FormData(form);
      const nombre = formData.get("nombre");
      const apellidos = formData.get("apellidos")
      const email = formData.get("email");
      const password = formData.get("password");
      const confirmPassword = formData.get("confirmPassword");
  
      if (password != confirmPassword) {
        errorMessage.textContent = "Las contraseñas no coinciden";
        errorMessage.classList.remove("hidden");
        return;
      }
          
      try {
        const response = await fetch("http://localhost:5000/clientes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nombre, apellidos, email, password }),
        });
  
        const result = await response.json();
  
        if (!response.ok) {
          errorMessage.textContent = result.error || "Error al registrar el usuario";
          errorMessage.classList.remove("hidden");
        } else {
          window.location.href = "/identificate";
        }
      } catch (error) {
        errorMessage.textContent = "Error de conexión con el servidor";
        errorMessage.classList.remove("hidden");
      }
    });
  });
  