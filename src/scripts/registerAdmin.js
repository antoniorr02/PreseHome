document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("register-admin");
    const errorMessage = document.getElementById("error-message");
  
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
  
      const formData = new FormData(form);
      const nombre = formData.get("nombre");
      const apellidos = formData.get("apellidos");
      const email = formData.get("email");
      const dni = formData.get("dni");
      const password = formData.get("password");
      const confirmPassword = formData.get("confirmPassword");
  
      if (password !== confirmPassword) {
        showError("Las contraseñas no coinciden");
        return;
      }
  
      const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*()_+[\]{};':"\\|,.<>/?]).{8,}$/;
      if (!passwordRegex.test(password)) {
        showError("La contraseña debe tener al menos 8 caracteres, un número y un carácter especial");
        return;
      }
  
      try {
        const response = await fetch("http://localhost:5000/admin", {
          method: "POST",
          credentials: 'include',
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nombre, apellidos, email, dni, password }),
        });
  
        const result = await response.json();
  
        if (!response.ok) {
          showError(result.error || "Error al registrar el usuario");
        } else {
          window.location.href = "/clientes";
        }
      } catch (error) {
        showError("Error de conexión con el servidor");
      }
    });
  
    function showError(message) {
      errorMessage.textContent = message;
      errorMessage.classList.remove("hidden");
    }
  });
  