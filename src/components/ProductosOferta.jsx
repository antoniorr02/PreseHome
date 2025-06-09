import { useState, useEffect } from "react";
import ProductModal from "./ProductModal";

const Productos = () => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    fetchProductos();
  }, []); 

  const fetchProductos = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/productos");
      const data = await response.json();
      setProductos(data);
    } catch (error) {
      console.error("Error al buscar productos:", error);
    } finally {
      setLoading(false);
    }
  };

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
            cantidad: 1
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
          existing.quantity += 1;
        } else {
          carrito.push({
            producto_id: producto.producto_id,
            nombre: producto.nombre,
            imagen: imagenPrincipal,
            precio: producto.precio,
            descuento: producto.descuento,
            quantity: 1
          });
        }
  
        localStorage.setItem("cart", JSON.stringify(carrito));
      }
  
      document.dispatchEvent(new Event("openCartModal"));
    } catch (err) {
      console.error("Error al añadir al carrito:", err);
    }
  };

  const productosConDescuento = productos.filter(
    (producto) => producto.descuento && producto.descuento > 0
  );

  return (
    <section className="min-h-screen grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-4">
      {loading ? (
        <p>Cargando productos...</p>
      ) : productosConDescuento.length > 0 ? (
        productosConDescuento.map((producto) => {
          const precioFinal = producto.precio - (producto.precio * (producto.descuento / 100));
          return (
            <div className="product-card" key={producto.producto_id}>
              <div className="border p-4 mb-4 rounded shadow text-center">
                <div
                  className="border p-4 rounded shadow text-center cursor-pointer duration-300 filter hover:brightness-75"
                  onClick={() => setSelectedProduct(producto)}
                >
                  <img
                    src={producto.imagenes?.find((imagen) => imagen.principal)?.url}
                    alt={producto.nombre}
                    className="w-full h-48 object-cover rounded mb-2"
                  />
                  <h3 className="text-xl font-bold">{producto.nombre}</h3>
                  <div className="text-lg text-gray-600 font-semibold space-x-2">
                    <span className="text-2xl text-red-500 font-bold">
                      {precioFinal.toFixed(2)}€
                    </span>
                    <span className="text-sm text-red-500 font-semibold">
                      (- {producto.descuento}%)
                    </span>
                    <span className="line-through text-sm text-gray-500">
                      {producto.precio}€
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleAddToCart(producto)}
                  className="mt-4 w-full py-2 px-4 bg-red-300 text-white rounded hover:bg-red-400 transition-colors"
                >
                  Añadir al carrito
                </button>
              </div>
            </div>
          );
        })
      ) : (
        <p className="text-center">No se encontraron productos en oferta.</p>
      )}
      <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
    </section>
  );
};

export default Productos;
