async function checkAuth() {
    try {
        const response = await fetch("http://localhost:5000/rol-sesion", {
            method: "GET",
            credentials: "include"
        });

        if (response.ok) {
            const { rol } = await response.json();

            const authLink = document.getElementById("auth-link");
            if (authLink) {
                if (rol === 'Admin') {
                    authLink.href = "/administracion";
                    authLink.innerHTML = `
                        Administración
                        <span class="absolute left-0 bottom-0 w-full h-1 bg-red-500 transform scale-x-0 transition-transform duration-300 origin-left group-hover:scale-x-100"></span>
                    `;
                } else {
                    authLink.href = "/perfil";
                    authLink.innerHTML = `
                        Mi Perfil
                        <span class="absolute left-0 bottom-0 w-full h-1 bg-red-500 transform scale-x-0 transition-transform duration-300 origin-left group-hover:scale-x-100"></span>
                    `;
                }
            }
        }
    } catch (error) {
        console.error("Error verificando autenticación", error);
    }
}

document.addEventListener("DOMContentLoaded", checkAuth);
