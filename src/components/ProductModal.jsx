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

  return (
    <div
      id="modal-background"
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
      onClick={handleBackgroundClick}
    >
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full relative" onClick={(e) => e.stopPropagation()}>
        <button className="absolute top-2 right-2 text-xl" onClick={onClose}>✖</button>
        <h2 className="text-2xl font-bold mb-4">{product.nombre}</h2>

        {/* Imagen principal */}
        <img
          src={selectedImage}
          alt={product.nombre}
          className="w-full h-64 object-cover rounded mb-4"
        />

        {/* Galería de imágenes */}
        <div className="flex space-x-2 mb-4">
          {product.imagenes.map((imagen) => (
            <img
              key={imagen.url}
              src={imagen.url}
              alt={`Imagen de ${product.nombre}`}
              className="w-20 h-20 object-cover rounded cursor-pointer hover:opacity-75"
              onClick={() => handleImageClick(imagen.url)}
            />
          ))}
        </div>

        <p className="text-gray-700">{product.descripcion}</p>
        <p className="text-lg font-semibold mt-2">{product.precio}€</p>

        {/* Controles de cantidad */}
        <div className="flex items-center justify-between mt-4 border rounded">
          <button
            onClick={decrementQuantity}
            className="px-4 py-2 bg-gray-300 rounded text-xl hover:brightness-75"
          >
            -
          </button>
          <span className="text-xl">{quantity}</span>
          <button
            onClick={incrementQuantity}
            className="px-4 py-2 bg-gray-300 rounded text-xl hover:brightness-75"
          >
            +
          </button>
        </div>
        
        <button
          onClick={() => console.log("Añadir al carrito", product, quantity)}
          className="mt-4 w-full py-2 px-4 bg-red-300 text-white rounded hover:bg-red-400 transition-colors"
        >
          Añadir al carrito
        </button>
      </div>
    </div>
  );
}
