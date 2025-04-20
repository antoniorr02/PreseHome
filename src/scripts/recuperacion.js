document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("recovery-form");
    const errorMessage = document.getElementById("error-message");

    form.addEventListener("submit", async (event) => {
        event.preventDefault();  // Prevenir el comportamiento predeterminado de redirección

        // Verifica que se esté ejecutando este código
        console.log("Formulario enviado");
        
        const formData = new FormData(form);
        const email = formData.get("email");

        try {
            console.log("Enviando correo para recuperar contraseña:", email); // Verifica el correo enviado
            const response = await fetch('http://localhost:5000/recuperar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const result = await response.json();

            if (response.ok) {
                console.log("Correo enviado correctamente");
                window.location.href ="/recuperacion";
            } else {
                console.error("Error al enviar correo de recuperación:", result.error || "Error desconocido");
                errorMessage.textContent = result.error || "Error al solicitar cambio de contraseña";
                errorMessage.classList.remove("hidden");
            }
        } catch (error) {
            console.error("Error al enviar la solicitud:", error);
            errorMessage.textContent = "Error del servidor al solicitar cambio de contraseña";
            errorMessage.classList.remove("hidden");
        }
    });
});
