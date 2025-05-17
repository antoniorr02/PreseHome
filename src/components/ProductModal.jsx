import { useState, useEffect } from 'react';

export default function ProductModal({ product, onClose }) {
  if (!product) return null;

  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(product.imagenes.find(imagen => imagen.principal)?.url);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [mediaEstrellas, setMediaEstrellas] = useState(0);
  const [cantidadValoraciones, setCantidadValoraciones] = useState(0);
  const [valoraciones, setValoraciones] = useState([]);

  useEffect(() => {
    if (product?.producto_id) {
      fetchMedia();
      fetchValoraciones();
    }
  }, [product?.producto_id]);  

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

  const fetchMedia = async () => {
    try {
      const res = await fetch(`http://localhost:5000/productos/${product.producto_id}/media-reseñas`);
      const data = await res.json();
      setMediaEstrellas(data.media);
      setCantidadValoraciones(data.cantidad);
    } catch (err) {
      console.error("Error al obtener media de reseñas:", err);
    }
  };

  const renderEstrellas = (valor) => {
    const estrellas = [];
    for (let i = 1; i <= 5; i++) {
      estrellas.push(
        <span key={i} className={i <= valor ? 'text-yellow-400' : 'text-gray-300'}>
          ★
        </span>
      );
    }
    return estrellas;
  };

  const fetchValoraciones = async () => {
    if (!product?.producto_id) return;
  
    try {
      const res = await fetch(`http://localhost:5000/valoraciones/${product.producto_id}`);
      const data = await res.json();
      setValoraciones(data.valoraciones);
    } catch (error) {
      console.error("Error al obtener valoraciones:", error);
    }
  };  

  const Star = ({ starId, marked }) => (
    <span
      className={`text-3xl cursor-pointer ${marked ? "text-yellow-400" : "text-gray-300"}`}
      onClick={() => setRating(starId)}
      onMouseEnter={() => setHoverRating(starId)}
      onMouseLeave={() => setHoverRating(0)}
    >
      ★
    </span>
  );

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

        <div className="mb-6 text-xl">
          {renderEstrellas(Math.round(mediaEstrellas))}
          <span className="ml-2 text-gray-600 text-sm">
            ({cantidadValoraciones} valoraciones)
          </span>
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

        <p className="text-black font-bold text-xl mt-6">Descripción del producto</p>
        <p className="text-gray-700 text-lg mb-4">{product.descripcion}</p>

        {valoraciones.length > 0 ? (
          <section className="mt-12">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">Opiniones de los usuarios</h3>
            <ul className="space-y-6">
              {valoraciones.map((val, index) => (
                <li
                  key={index}
                  className="bg-white border border-gray-200 rounded-xl p-5 shadow transition hover:shadow-md"
                >
                  <div className="text-md font-semibold text-gray-800">{val.nombre_usuario}</div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-yellow-500 text-xl">{renderEstrellas(Math.round(val.calificacion))}</div>
                  </div>
                  <p className="text-gray-700 leading-relaxed pl-4">{val.comentario || <i>Sin comentario</i>}</p>
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <p className="mt-12 text-gray-500 italic text-center">Todavía no hay reseñas para este producto.</p>
        )}

      </div>
    </div>
  );
}