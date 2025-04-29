import { useEffect } from "react";

export default function SincronizarCarritoGoogle() {
  useEffect(() => {
    const sincronizarCarrito = async () => {
      const carritoLocal = JSON.parse(localStorage.getItem("cart")) || [];

      if (carritoLocal.length === 0) return;

      try {
        const authRes = await fetch("http://localhost:5000/rol-sesion", {
          method: "GET",
          credentials: "include"
        });

        if (!authRes.ok) return;

        for (const item of carritoLocal) {
          await fetch("http://localhost:5000/carrito", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({
              producto_id: item.producto_id,
              cantidad: item.quantity
            })
          });
        }

        localStorage.removeItem("cart");
      } catch (err) {
        console.error("Error al sincronizar carrito tras login con Google:", err);
      }
    };

    sincronizarCarrito();
  }, []);

  return null; // No renderiza nada visible
}
