import { useState, useEffect } from 'react';
import ProductModal from './ProductModal';

const API_CATEGORIAS = 'http://localhost:5000/categorias';
const API_PRODUCTOS_POR_CATEGORIA = (categoriaId) => `http://localhost:5000/categorias/${categoriaId}/productos`;

export default function CategoryView() {
  const [categorias, setCategorias] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [productos, setProductos] = useState([]);
  const [loadingCategorias, setLoadingCategorias] = useState(true);
  const [loadingProductos, setLoadingProductos] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const response = await fetch(API_CATEGORIAS);
        const data = await response.json();
        setCategorias(data);
        setLoadingCategorias(false);

        const categoryIdFromLocalStorage = localStorage.getItem('selectedCategory');
        if (categoryIdFromLocalStorage) {
          setSelectedCategory(Number(categoryIdFromLocalStorage));
        } else {
          setSelectedCategory(1);
        }
      } catch (error) {
        console.error('Error al obtener las categorías:', error);
        setLoadingCategorias(false);
      }
    };

    fetchCategorias();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      const fetchProductos = async () => {
        setLoadingProductos(true);
        try {
          const response = await fetch(API_PRODUCTOS_POR_CATEGORIA(selectedCategory));
          const data = await response.json();
          setProductos(data);
          setLoadingProductos(false);
        } catch (error) {
          console.error('Error al obtener los productos:', error);
          setLoadingProductos(false);
        }
      };

      fetchProductos();
    }
  }, [selectedCategory]);

  const calcularPrecioFinal = (producto) => {
    return producto.descuento && producto.descuento > 0
      ? producto.precio - (producto.precio * (producto.descuento / 100))
      : producto.precio;
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

  return (
    <div className="flex">
      <aside className="w-64 h-[calc(100vh-160px)] overflow-y-auto">
        <h3 className="text-xl font-bold mb-4">Categorías</h3>
        {loadingCategorias ? (
          <p>Cargando categorías...</p>
        ) : (
          <ul>
            {categorias.map((categoria) => (
              <li key={categoria.categoria_id}>
                <button
                  onClick={() => setSelectedCategory(categoria.categoria_id)}
                  className={`flex items-center justify-between w-full p-2 hover:bg-gray-200 transition-colors ${
                    selectedCategory === categoria.categoria_id ? 'bg-gray-300 font-bold' : ''
                  }`}
                >
                  <span>{categoria.nombre}</span>
                  <img
                    src={`/assets/categorias/${categoria.nombre.toLowerCase()}.jpg`}
                    alt={categoria.nombre}
                    className="w-8 h-8 object-cover rounded"
                  />
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mx-auto max-w-screen-xl">
        {loadingProductos ? (
          <p>Cargando productos...</p>
        ) : productos.length > 0 ? (
          productos.map((producto) => {
            const precioFinal = calcularPrecioFinal(producto);

            return (
              <div className="product-card" key={producto.producto_id}>
                <div className="border p-4 mb-4 rounded shadow text-center">
                  <div
                    className="border p-4 rounded shadow text-center cursor-pointer duration-300 filter hover:brightness-75"
                    onClick={() => setSelectedProduct(producto)}
                  >
                    <img
                      src={producto.imagenes.find(imagen => imagen.principal)?.url}
                      alt={producto.nombre}
                      className="w-full h-48 object-cover rounded mb-2"
                    />
                    <h3 className="text-xl font-bold">{producto.nombre}</h3>

                    <div className="text-lg text-gray-600 font-semibold space-x-2">
                      {producto.descuento && producto.descuento > 0 ? (
                        <>
                          <span className="text-2xl text-red-500 font-bold">
                            {precioFinal.toFixed(2)}€
                          </span>
                          <span className="text-sm text-red-500 font-semibold">
                            (- {producto.descuento}%)
                          </span>
                          <span className="line-through text-sm text-gray-500">
                            {producto.precio}€
                          </span>
                        </>
                      ) : (
                        <p className="text-2xl font-semibold">{producto.precio}€</p>
                      )}
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
          <p>No hay productos para esta categoría.</p>
        )}
      </section>
      <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
    </div>
  );
}
