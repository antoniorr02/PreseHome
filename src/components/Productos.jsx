import { useState, useEffect } from "react";
import ProductModal from './ProductModal';

const Productos = () => {
  const [query, setQuery] = useState("");
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const searchQuery = params.get("query") || "";
    setQuery(searchQuery);
  }, []);

  useEffect(() => {
    if (query.length > 2) {
      fetchProductos(query);
    } else {
      setProductos([]);
    }
  }, [query]);

  const fetchProductos = async (searchTerm) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/productos?search=${searchTerm}`);
      const data = await response.json();
      setProductos(data);
    } catch (error) {
      console.error("Error al buscar productos:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-screen grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-4">
      {loading ? (
        <p>Cargando productos...</p>
      ) : productos.length > 0 ? (
        productos.map((producto) => (
          <div className="product-card block transition-all duration-300 filter hover:brightness-75">
            <div key={producto.producto_id} className="border p-4 mb-4 rounded shadow text-center">
              <div
                key={producto.producto_id}
                className="border p-4 rounded shadow text-center cursor-pointer hover:bg-gray-100 transition"
                onClick={() => setSelectedProduct(producto)}
              >
                <img
                  src={producto.imagenes.find(imagen => imagen.principal)?.url}
                  alt={producto.nombre}
                  className="w-full h-48 object-cover rounded mb-2"
                />
                <h3 className="text-xl font-bold">{producto.nombre}</h3>
                <p className="text-lg text-gray-600 font-semibold">{producto.precio}€</p>
              </div>
              <button
                onClick={() => handleAddToCart(producto)}
                className="mt-4 w-full py-2 px-4 bg-red-300 text-white rounded hover:bg-red-400 transition-colors"
              >
                Añadir al carrito
              </button>
            </div>
          </div>
        ))
      ) : (
        <p className="text-center">No se encontraron productos.</p>
      )}
    <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
    </section>
  );
};

export default Productos;
