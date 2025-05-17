import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, Trash2, CreditCard, Minus, Plus } from "lucide-react";

export default function CartSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const openModal = () => {
      setIsOpen(true);
      updateCart(); 
    };

    document.addEventListener("openCartModal", openModal);

    return () => {
      document.removeEventListener("openCartModal", openModal);
    };
  }, []);

  const updateCart = async () => {
    try {
      const response = await fetch("http://localhost:5000/rol-sesion", {
        method: "GET",
        credentials: "include",
      });
  
      if (response.ok) {
        const { rol } = await response.json();
        setIsLoggedIn(true);
        if (rol === "Cliente" || rol === "Admin") {
          const carritoRes = await fetch("http://localhost:5000/carrito", {
            method: "GET",
            credentials: "include",
          });
  
          if (carritoRes.ok) {
            const dbCart = await carritoRes.json();
            console.log("Carrito desde BD:", dbCart);
            setCartItems(dbCart);
          } else {
            console.warn("No se pudo obtener el carrito desde la BD.");
            setCartItems([]);
          }
        } else {
          const localCart = JSON.parse(localStorage.getItem("cart")) || [];
          console.log("Carrito desde localStorage:", localCart);
          setCartItems(localCart);
        }
      } else {
        const localCart = JSON.parse(localStorage.getItem("cart")) || [];
        console.log("Carrito desde localStorage (no sesión):", localCart);
        setCartItems(localCart);
      }
    } catch (error) {
      console.error("Error al obtener el carrito:", error);
      const fallbackCart = JSON.parse(localStorage.getItem("cart")) || [];
      setCartItems(fallbackCart);
    }
  };
  
  const handleRemoveItem = async (producto_id) => {
    try {
      const sesionRes = await fetch("http://localhost:5000/rol-sesion", {
        credentials: "include"
      });
  
      if (sesionRes.ok) {
        const deleteRes = await fetch(`http://localhost:5000/carrito/${producto_id}`, {
          method: "DELETE",
          credentials: "include",
        });
  
        if (deleteRes.ok) {
          const updated = cartItems.filter(item => item.producto_id !== producto_id);
          setCartItems(updated);
        } else {
          console.error("No se pudo eliminar el producto del carrito remoto");
        }
      } else {
        const updated = cartItems.filter(item => item.producto_id !== producto_id);
        localStorage.setItem("cart", JSON.stringify(updated));
        setCartItems(updated);
      }
    } catch (error) {
      console.error("Error al eliminar del carrito:", error);
    }
  };
  

  const updateItemQuantity = async (id, delta) => {
    try {
      const authRes = await fetch("http://localhost:5000/rol-sesion", {
        method: "GET",
        credentials: "include"
      });
  
      const isLoggedIn = authRes.ok;
  
      if (isLoggedIn) {
        const res = await fetch(`http://localhost:5000/carrito/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "include",
          body: JSON.stringify({ delta })
        });
      
        const data = await res.json();
      
        if (!res.ok) {
          console.error("Error al actualizar cantidad:", data.error || "Error desconocido");
          return;
        }
      
        if (data.carritoActualizado) {
          setCartItems(data.carritoActualizado);
        } else {
          console.warn("Respuesta sin carrito actualizado. Considera hacer una recarga del carrito.");
        }
      } else {
        const updated = cartItems
          .map(item => {
            if (item.producto_id === id) {
              const newQuantity = item.quantity + delta;
              if (newQuantity <= 0) return null;
              return { ...item, quantity: newQuantity };
            }
            return item;
          })
          .filter(item => item !== null);
  
        localStorage.setItem("cart", JSON.stringify(updated));
        setCartItems(updated);
      }
    } catch (err) {
      console.error("Error al actualizar cantidad:", err);
    }
  };
  

  const precioFinal = (p) => {
    const precioUnidad = p.precio - (p.precio * (p.descuento / 100));
    return (precioUnidad * p.quantity).toFixed(2);
  };

  const ahorro = (p) => {
    const precioUnidad = p.precio;
    const precioConDescuento = precioUnidad - (precioUnidad * (p.descuento / 100));
    return (precioUnidad - precioConDescuento) * p.quantity;
  };

  const totalCarrito = cartItems.reduce(
    (acc, item) => acc + parseFloat(precioFinal(item)),
    0
  );

  const totalAhorro = cartItems.reduce(
    (acc, item) => acc + parseFloat(ahorro(item)),
    0
  );

  return (
    <div>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50"
          onClick={() => setIsOpen(false)}
        >
          <motion.div
            initial={{ x: +300 }}
            animate={{ x: 0 }}
            exit={{ x: +300 }}
            transition={{ duration: 0.3 }}
            className="fixed right-0 top-0 h-full w-80 bg-white shadow-lg p-4 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <ShoppingCart size={20} /> Mi carrito
            </h2>

            <div className="space-y-4">
              {cartItems.length === 0 ? (
                <p className="text-gray-500">Tu carrito está vacío.</p>
              ) : (
                cartItems.map((item) => (
                  <div
                    key={item.producto_id}
                    className="flex justify-between items-center border-b pb-2"
                  >
                    <div className="flex gap-2">
                      <img
                        src={item.imagen}
                        alt={item.nombre}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div>
                        <p className="font-medium">{item.nombre}</p>
                        <div className="flex items-center gap-2 my-1">
                          <button
                            onClick={() => updateItemQuantity(item.producto_id, -1)}
                            className="px-1 text-gray-700 hover:text-gray-900"
                          >
                            <Minus size={16} />
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            onClick={() => updateItemQuantity(item.producto_id, 1)}
                            className="px-1 text-gray-700 hover:text-gray-900"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                        <p className="text-sm text-gray-700">
                          Total: {precioFinal(item)}€
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveItem(item.producto_id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {cartItems.length > 0 && (
              <>
                <hr className="my-4" />
                <p className="text-lg font-bold text-right mb-2">
                  Total: {totalCarrito.toFixed(2)}€
                </p>
                <p className="text-sm text-right text-gray-500 mb-4">
                  Ahorro en descuentos: {totalAhorro.toFixed(2)}€
                </p>
                <a
                  href={isLoggedIn ? "/compra" : "/identificate"}
                  className="flex items-center gap-3 justify-center bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  onClick={() => setIsOpen(false)}
                >
                  <CreditCard size={20} /> Ir al pago
                </a>
              </>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
