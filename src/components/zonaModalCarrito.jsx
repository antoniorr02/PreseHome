import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, Trash2, CreditCard, Minus, Plus } from "lucide-react";

export default function CartSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);

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

  const updateCart = () => {
    const carrito = JSON.parse(localStorage.getItem("cart")) || [];
    setCartItems(carrito);
  };

  const handleRemoveItem = (id) => {
    const updated = cartItems.filter(item => item.producto_id !== id);
    localStorage.setItem("cart", JSON.stringify(updated));
    setCartItems(updated);
  };

  const updateItemQuantity = (id, delta) => {
    const updated = cartItems
      .map(item => {
        if (item.producto_id === id) {
          const newQuantity = item.quantity + delta;
          if (newQuantity <= 0) return null; // eliminar
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
      .filter(item => item !== null);
    
    localStorage.setItem("cart", JSON.stringify(updated));
    setCartItems(updated);
  };

  const precioFinal = (p) => {
    const precioUnidad = p.precio - (p.precio * (p.descuento / 100));
    return (precioUnidad * p.quantity).toFixed(2);
  };

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
                <a
                  href="/checkout"
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
