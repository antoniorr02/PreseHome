import { useState, useEffect } from "react";

const Productos = () => {
  const [query, setQuery] = useState("");
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const searchInput = document.getElementById("search-input");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => setQuery(e.target.value));
    }

    return () => {
      if (searchInput) {
        searchInput.removeEventListener("input", (e) => setQuery(e.target.value));
      }
    };
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
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-4">
      {loading ? (
        <p>Cargando productos...</p>
      ) : (
        productos.map((producto) => (
          <div key={producto.producto_id} className="border p-4 mb-4 rounded shadow text-center">
            <a href="/">
              <img
                src={producto.imagenes.find((imagen) => imagen.principal)?.url}
                alt={producto.nombre}
                className="w-full h-48 object-cover rounded mb-2"
              />
              <h3 className="text-xl font-bold">{producto.nombre}</h3>
              {producto.descripcion && <p className="mt-2 text-gray-600">{producto.descripcion}</p>}
              <p className="text-lg text-gray-600 font-semibold">{producto.precio}€</p>
            </a>
            <button className="mt-4 w-full py-2 px-4 bg-red-300 text-white rounded hover:bg-red-400 transition-colors">
              Añadir al carrito
            </button>
          </div>
        ))
      )}
    </section>
  );
};

export default Productos;
