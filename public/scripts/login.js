document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("login-form");

    const errorMessage = document.getElementById("error-message");

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        
        const formData = new FormData(form);
        const email = formData.get("email");
        const password = formData.get("password");

        try {
        const response = await fetch('http://localhost:5000/login', {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
            credentials: "include"
        });
    
        const result = await response.json();
    
        if (response.ok) {
            window.location.href = '/';
        } else {
            errorMessage.textContent = result.error || "Error al registrar el usuario";
            errorMessage.classList.remove("hidden");
        }
        } catch (error) {
            errorMessage.textContent = "Error del servidor al iniciar sesión";
            errorMessage.classList.remove("hidden");
        }
    });
});
  