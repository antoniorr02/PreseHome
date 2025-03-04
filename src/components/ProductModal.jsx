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
      <div
        className="bg-white p-8 rounded-2xl shadow-xl max-w-3xl w-full relative overflow-y-auto max-h-[80vh]"
        style={{
          scrollbarWidth: 'none',
        }}
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

        <p className="text-2xl font-semibold mt-4">{product.precio}€</p>

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
            onClick={() => console.log("Añadir al carrito", product, quantity)}
            className="w-full py-3 px-6 bg-red-500 text-white rounded-lg shadow-lg hover:bg-red-600 transition-colors transform hover:scale-105"
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
