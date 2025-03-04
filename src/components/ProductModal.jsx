export default function ProductModal({ product, onClose }) {
  if (!product) return null;

  const handleBackgroundClick = (e) => {
    if (e.target.id === "modal-background") {
      onClose();
    }
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
        <img
          src={product.imagenes.find(imagen => imagen.principal)?.url}
          alt={product.nombre}
          className="w-full h-64 object-cover rounded mb-4"
        />
        <p className="text-gray-700">{product.descripcion}</p>
        <p className="text-lg font-semibold mt-2">{product.precio}€</p>
        <button
          onClick={() => console.log("Añadir al carrito", product)}
          className="mt-4 w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Añadir al carrito
        </button>
      </div>
    </div>
  );
}
