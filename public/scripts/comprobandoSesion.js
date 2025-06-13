async function checkAuth() {
    try {
        const response = await fetch(`/api/rol-sesion`, {
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
                    authLink.href = "javascript:void(0);";
                    authLink.innerHTML = `
                        Mi cuenta
                        <span class="absolute left-0 bottom-0 w-full h-1 bg-red-500 transform scale-x-0 transition-transform duration-300 origin-left group-hover:scale-x-100"></span>
                    `;

                    setTimeout(() => {
                        const newAuthLink = document.getElementById("auth-link");
                        if (newAuthLink) {
                            newAuthLink.addEventListener("click", () => {
                                console.log("🔹 Disparando evento openUserModal");
                                const modalEvent = new CustomEvent("openUserModal");
                                document.dispatchEvent(modalEvent);
                            });
                        }
                    }, 0);
                }
            }
        }
    } catch (error) {
        console.error("Error verificando autenticación", error);
    }
}

document.addEventListener("DOMContentLoaded", checkAuth);
