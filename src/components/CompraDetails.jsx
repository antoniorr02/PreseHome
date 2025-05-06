import { useEffect, useState } from "react";

export default function CompraDetails() {
  const [cartItems, setCartItems] = useState([]);
  const [envio, setEnvio] = useState(4.99); // fijo por ahora

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const res = await fetch("http://localhost:5000/rol-sesion", {
          credentials: "include",
        });

        if (res.ok) {
          const { rol } = await res.json();
          if (["Cliente", "Admin"].includes(rol)) {
            const carritoRes = await fetch("http://localhost:5000/carrito", {
              credentials: "include",
            });
            const data = await carritoRes.json();
            setCartItems(data);
            return;
          }
        }

        // En cualquier otro caso, usamos el localStorage
        const localCart = JSON.parse(localStorage.getItem("cart")) || [];
        setCartItems(localCart);
      } catch (error) {
        console.error("Error al cargar el carrito:", error);
        const fallback = JSON.parse(localStorage.getItem("cart")) || [];
        setCartItems(fallback);
      }
    };

    fetchCart();
  }, []);

  const calcularPrecio = (item) => {
    const precioDescuento = item.precio - (item.precio * item.descuento) / 100;
    return precioDescuento * item.quantity;
  };

  const calcularAhorro = (item) => {
    const precioOriginal = item.precio;
    const precioDescuento = item.precio - (item.precio * item.descuento) / 100;
    return (precioOriginal - precioDescuento) * item.quantity;
  };
  
  const totalAhorro = cartItems.reduce((acc, item) => acc + calcularAhorro(item), 0);  
  const subtotal = cartItems.reduce((acc, item) => acc + calcularPrecio(item), 0);
  const total = (subtotal + envio).toFixed(2);

  return (
    <section className="min-h-screen max-w-3xl mx-auto p-4 space-y-8">
      <h1 className="text-3xl font-semibold text-center text-black">Resumen de tu compra</h1>

      {cartItems.length === 0 ? (
        <p className="text-center text-gray-600">No hay productos en tu carrito.</p>
      ) : (
        <>
          <ul className="space-y-4">
            {cartItems.map((item) => (
              <li
                key={item.producto_id}
                className="flex justify-between items-center border-b pb-4"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={item.imagen}
                    alt={item.nombre}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div>
                    <p className="font-medium">{item.nombre}</p>
                    <p className="text-sm text-gray-600">
                      {item.quantity} × {(item.precio - item.precio * item.descuento / 100).toFixed(2)}€
                    </p>
                  </div>
                </div>
                <p className="font-semibold">{calcularPrecio(item).toFixed(2)}€</p>
              </li>
            ))}
          </ul>

          <div className="border-t pt-6 space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{subtotal.toFixed(2)}€</span>
            </div>
            {totalAhorro > 0 && (
              <div className="flex justify-between text-green-600 font-medium">
                <span>Descuento aplicado</span>
                <span>-{totalAhorro.toFixed(2)}€</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Envío</span>
              <span>{envio.toFixed(2)}€</span>
            </div>
            <hr />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>{total}€</span>
            </div>
          </div>

          <button
            onClick={() => alert("Aquí iría la lógica de pago")}
            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition-colors"
          >
            Pagar ahora
          </button>
        </>
      )}
    </section>
  );
}
