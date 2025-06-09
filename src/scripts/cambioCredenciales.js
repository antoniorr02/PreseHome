document.getElementById("reset-password-form").addEventListener("submit", async function (e) {
    e.preventDefault();

    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const errorEl = document.getElementById("error-message");

    if (password !== confirmPassword) {
      errorEl.textContent = "Las contraseñas no coinciden.";
      errorEl.classList.remove("hidden");
      return;
    }

    const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*()_+[\]{};':"\\|,.<>/?]).{8,}$/;
    if (!passwordRegex.test(password)) {
      showError("La contraseña debe tener al menos 8 caracteres, un número y un carácter especial");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/restablecer-credenciales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, nuevaContrasena: password }),
      });

      const data = await res.json();

      if (!res.ok) {
        errorEl.textContent = data.error || "Error al cambiar la contraseña.";
        errorEl.classList.remove("hidden");
        return;
      }

      alert("Contraseña actualizada correctamente. Ahora puedes iniciar sesión.");
      window.location.href = "/identificate";
    } catch (err) {
      errorEl.textContent = "Error al conectar con el servidor.";
      errorEl.classList.remove("hidden");
    }
  });