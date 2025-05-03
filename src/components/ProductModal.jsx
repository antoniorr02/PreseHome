import { useState } from 'react';

export default function ProductModal({ product, onClose }) {
  if (!product) return null;

  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(product.imagenes.find(imagen => imagen.principal)?.url);

  const handleBackgroundClick = (e) => {
    if (e.target.id === "modal-background") {
      onClose();
    }
  };

  const incrementQuantity = () => {
    setQuantity((prevQuantity) => prevQuantity + 1);
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity((prevQuantity) => prevQuantity - 1);
    }
  };

  const handleImageClick = (url) => {
    setSelectedImage(url);
  };

  // Calcular precio final del producto
  const precioFinal = product.descuento && product.descuento > 0
    ? product.precio - (product.precio * (product.descuento / 100))
    : product.precio;

  const handleAddToCart = async (producto) => {
    const imagenPrincipal = producto.imagenes?.find((img) => img.principal)?.url || "";
  
    try {
      const authRes = await fetch("http://localhost:5000/rol-sesion", {
        method: "GET",
        credentials: "include"
      });
  
      const isLoggedIn = authRes.ok;
  
      if (isLoggedIn) {
        const res = await fetch("http://localhost:5000/carrito", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "include",
          body: JSON.stringify({
            producto_id: producto.producto_id,
            cantidad: quantity
          })
        });
  
        const data = await res.json();
  
        if (!res.ok) {
          console.error("Error al añadir a carrito en BD:", data.error || "Error desconocido");
          return;
        }
      } else {
        const carrito = JSON.parse(localStorage.getItem("cart")) || [];
  
        const existing = carrito.find(p => p.producto_id === producto.producto_id);
  
        if (existing) {
          existing.quantity += quantity;
        } else {
          carrito.push({
            producto_id: producto.producto_id,
            nombre: producto.nombre,
            imagen: imagenPrincipal,
            precio: precioFinal,
            descuento: producto.descuento,
            quantity: quantity
          });
        }
  
        localStorage.setItem("cart", JSON.stringify(carrito));
      }
  
      document.dispatchEvent(new Event("openCartModal"));
      onClose();
    } catch (err) {
      console.error("Error al añadir al carrito:", err);
    }
  };
    

  return (
    <div
      id="modal-background"
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
      onClick={handleBackgroundClick}
    >
      <div
        className="bg-white p-8 rounded-2xl shadow-xl max-w-3xl w-full relative overflow-y-auto max-h-[80vh]"
        style={{ scrollbarWidth: 'none' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="absolute top-4 right-4 text-2xl text-gray-600 hover:text-gray-800 transition-colors" onClick={onClose}>✖</button>
        <h2 className="text-3xl font-bold mb-6">{product.nombre}</h2>

        <img
          src={selectedImage}
          alt={product.nombre}
          className="w-full h-auto max-h-96 object-contain rounded-lg shadow-md mb-6"
        />

        <div className="flex space-x-4 mb-6 overflow-x-auto">
          {product.imagenes.map((imagen) => (
            <img
              key={imagen.url}
              src={imagen.url}
              alt={`Imagen de ${product.nombre}`}
              className="w-32 h-32 object-contain rounded-lg cursor-pointer hover:opacity-75 transition-opacity"
              onClick={() => handleImageClick(imagen.url)}
            />
          ))}
        </div>

        <div className="text-lg text-gray-600 font-semibold space-x-2">
          {product.descuento && product.descuento > 0 ? (
            <>
              <span className="text-2xl text-red-500 font-bold">
                {precioFinal.toFixed(2)}€
              </span>
              <span className="text-sm text-red-500 font-semibold">
                (- {product.descuento}%)
              </span>
              <span className="line-through text-sm text-gray-500">
                {product.precio}€
              </span>
            </>
          ) : (
            <p className="text-2xl font-semibold">{product.precio}€</p>
          )}
        </div>

        <div className="flex items-center justify-between mt-6 border rounded-lg">
          <button
            onClick={decrementQuantity}
            className="px-6 py-3 bg-gray-200 rounded-lg text-2xl hover:bg-gray-300 transition-colors"
          >
            -
          </button>
          <span className="text-2xl">{quantity}</span>
          <button
            onClick={incrementQuantity}
            className="px-6 py-3 bg-gray-200 rounded-lg text-2xl hover:bg-gray-300 transition-colors"
          >
            +
          </button>
        </div>

        <div className="mt-6 flex justify-center">
          <button
            onClick={() => handleAddToCart(product)}
            className="w-full py-3 px-6 bg-red-300 text-white rounded-lg shadow-lg hover:bg-red-400 transition-colors"
          >
            Añadir al carrito
          </button>
        </div>

        <p className='text-black font-bold text-xl mt-3'>Descripción del producto</p>
        <p className="text-gray-700 text-lg mb-4">{product.descripcion}</p>
      </div>
    </div>
  );
}