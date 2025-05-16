import React, { useState, useEffect } from 'react';
import FormEdiccionModal from './FormEdiccionModal';
import FormEditarReview from './FormEditarReview';

const PedidosUser = () => {
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState('orders');
    const [reviews, setReviews] = useState([]);
    const [loadingReviews, setLoadingReviews] = useState(false);
    const [pedidos, setPedidos] = useState([]);
    const [isEditarReview, setEditarReview] = useState(false);
    const [reviewAEditar, setReviewAEditar] = useState(null);
    const [productosMap, setProductosMap] = useState({});

    useEffect(() => {
      if (activeSection === 'orders') {
        const fetchPedidos = async () => {
          try {
              const response = await fetch('http://localhost:5000/pedidos-cliente', {
              method: 'GET',
              credentials: 'include',
              });
              if (response.status === 401) {
              window.location.href = '/';
              return;
              }
              if (response.ok) {
                const data = await response.json();
                setPedidos(data.pedidos || []);
              } else {
              console.error('Error al obtener los datos');
              }
          } catch (error) {
              console.error('Error al hacer la solicitud:', error);
          } finally {
              setLoading(false);
          }
        };

        fetchPedidos();
      }
    }, [activeSection]);

    useEffect(() => {
        if (activeSection === 'reviews') {
          const fetchReviews = async () => {
            setLoadingReviews(true);
            try {
              const res = await fetch('http://localhost:5000/valoraciones-usuarios', {
                method: 'GET',
                credentials: 'include',
              });
              if (res.ok) {
                const data = await res.json();
                setReviews(data.valoraciones || []);

                const productoIds = [...new Set(data.valoraciones.map(r => r.producto_id))];

                // Hacer peticiones en paralelo para cada producto
                const fetchedProductos = await Promise.all(
                    productoIds.map(async (id) => {
                    const resProd = await fetch(`http://localhost:5000/productos/${id}`);
                    if (resProd.ok) {
                        const dataProd = await resProd.json();
                        return [id, dataProd];
                    }
                    return [id, null];
                    })
                );

                // Crear un mapa producto_id => datos del producto
                const productoMap = Object.fromEntries(fetchedProductos);
                setProductosMap(productoMap);
              } else {
                console.error('Error al obtener las reseñas');
              }
            } catch (err) {
              console.error('Error en la solicitud de reseñas:', err);
            } finally {
              setLoadingReviews(false);
            }
          };
    
          fetchReviews();
        }
    }, [activeSection]);
    
    if (loading) {
    return <div>Loading...</div>;
    }


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

    const handleDeleteReview = async (reviewId) => {      
        try {
          const response = await fetch(`http://localhost:5000/review/${reviewId}`, {
            method: 'DELETE',
            credentials: 'include',
          });
      
          if (response.ok) {
            window.location.href = "/pedidos";
          } else {
            console.error('Error al eliminar la reseña');
          }
        } catch (error) {
          console.error('Error de red al eliminar la reseña:', error);
        }
    };
      
    const renderSection = () => {
        switch (activeSection) {
          case 'orders':
            return (
              <div className="space-y-4">
                {pedidos.length === 0 ? (
                  <p>No tienes pedidos todavía.</p>
                ) : (
                  pedidos.map((pedido) => {
                    // Formatear el total a 2 decimales
                    const totalFormateado = parseFloat(pedido.total).toFixed(2);
                    
                    return (
                      <div key={pedido.pedido_id} className="border border-gray-400 p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="font-semibold">Pedido #{pedido.pedido_id}</h3>
                          <span className="text-sm text-gray-600">
                            {new Date(pedido.fecha_pedido).toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        
                        {pedido.detalle_pedido.map((detalle) => {
                          // Asegurar 2 decimales para todos los precios
                          const precioUnitario = parseFloat(detalle.precio_unitario).toFixed(2);
                          const precioConDescuento = detalle.precio_con_descuento 
                            ? parseFloat(detalle.precio_con_descuento).toFixed(2)
                            : null;
                          const precioOriginal = detalle.precio_original 
                            ? parseFloat(detalle.precio_original).toFixed(2)
                            : null;

                          return (
                            <div key={`${pedido.pedido_id}-${detalle.producto_id}`} className="flex items-start mb-4">
                              {/* Imagen */}
                              {detalle.producto?.imagenes?.[0]?.url && (
                                <img
                                  src={detalle.producto.imagenes[0].url}
                                  alt={detalle.producto.nombre}
                                  className="w-24 h-24 object-cover rounded-lg mr-4"
                                />
                              )}

                              {/* Info producto */}
                              <div className="flex-1">
                                <h4 className="text-md font-semibold text-gray-900">{detalle.producto.nombre}</h4>
                                <p className="text-sm text-gray-700">Cantidad: {detalle.cantidad}</p>
                                
                                {/* Mostrar precio con descuento si aplica */}
                                {detalle.descuento_aplicado > 0 ? (
                                  <>
                                    <p className="text-sm text-gray-500 line-through">
                                      Precio original: ${precioOriginal}
                                    </p>
                                    <p className="text-sm text-green-600 font-semibold">
                                      Precio con {detalle.descuento_aplicado}% descuento: ${precioConDescuento}
                                    </p>
                                  </>
                                ) : (
                                  <p className="text-sm text-gray-700">
                                    Precio unitario: {precioUnitario}€
                                  </p>
                                )}
                                
                                <p className="text-sm text-gray-500">Estado: {pedido.estado}</p>
                              </div>

                              {/* Acciones */}
                              <div className="flex flex-col space-y-2">
                                <button className="bg-gray-200 hover:bg-gray-300 text-sm px-3 py-1 rounded">
                                  Devolver
                                </button>
                              </div>
                            </div>
                          );
                        })}
                        
                        <div className="flex justify-end mt-2 border-t pt-2">
                          <p className="font-semibold">Total: {totalFormateado}€</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            );
            case 'reviews':
                return (
                    <div className="border border-gray-400 p-4 rounded-lg">
                      {loadingReviews ? (
                        <p>Cargando reseñas...</p>
                      ) : reviews.length === 0 ? (
                        <p>No tienes reseñas todavía.</p>
                      ) : (
                        <ul className="space-y-6">
                            {reviews.map((review, index) => {
                                const producto = productosMap[review.producto_id];
                                return (
                                <li key={index} className="border border-gray-200 rounded-xl shadow-sm p-5 bg-white bg-opacity-40">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center sm:space-x-6 space-y-4 sm:space-y-0">
                                    
                                    {/* Columna 1: Imagen */}
                                    {producto?.imagenes?.[0]?.url && (
                                        <img
                                        src={producto.imagenes[0].url}
                                        alt={producto.nombre}
                                        className="w-32 h-32 object-cover rounded-lg"
                                        />
                                    )}

                                    {/* Columna 2: Información de la reseña */}
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-1">
                                        {producto ? producto.nombre : 'Producto no disponible'}
                                        </h3>
                                        <div className="text-yellow-500 text-xl mb-1">
                                        {renderEstrellas(Math.round(review.calificacion))}
                                        </div>
                                        <p className="text-gray-700">
                                        <strong>Comentario:</strong> {review.comentario || 'Sin comentario'}
                                        </p>
                                    </div>

                                    {/* Columna 3: Botones */}
                                    <div className="flex flex-col space-y-2">
                                        <button
                                        className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-4 py-2 rounded"
                                        onClick={() => {setEditarReview(true); 
                                            setReviewAEditar(review);
                                            console.log('Reseña a editar:', review);
                                        }}
                                        >
                                        Modificar
                                        </button>
                                        <button
                                        className="bg-red-500 hover:bg-red-600 text-white text-sm px-4 py-2 rounded"
                                        onClick={() => handleDeleteReview(review.reseña_id)}
                                        >
                                        Eliminar
                                        </button>
                                    </div>
                                    </div>
                                </li>
                                );
                            })}
                            </ul>
                      )}
                      <FormEdiccionModal isOpen={isEditarReview} onClose={() => setEditarReview(false)}>
                        {reviewAEditar && (
                            <FormEditarReview
                            review={reviewAEditar}
                            onSubmit={(updatedReview) => {
                                setReviews((prev) =>
                                  prev.map((r) => (r.reseña_id === updatedReview.reseña_id ? updatedReview : r))
                                );
                                setEditarReview(false);
                              }}                              
                            />
                        )}
                        </FormEdiccionModal>
                    </div>
                );       
          case 'returns':
            return (
                <div className="border border-gray-400 p-4 rounded-lg">

                
                </div>
            );
          default:
            return <div>Sección no encontrada</div>;
        }
      };
    
      return (
        <div className="max-w-4xl mx-auto p-6">
          <h1 className="text-2xl font-semibold">Compras</h1>
          <p className="text-gray-600">Aquí podrás ver todo lo relacionado con tus compras.</p>
    
          <div className="border-b border-gray-400 flex space-x-6 mb-6">
            <button
              className={`py-2 px-4 font-semibold ${activeSection === 'orders' ? 'border-b-2 border-black' : 'text-gray-600'}`}
              onClick={() => setActiveSection('orders')}
            >
              Pedidos
            </button>
            <button
              className={`py-2 px-4 font-semibold ${activeSection === 'reviews' ? 'border-b-2 border-black' : 'text-gray-600'}`}
              onClick={() => setActiveSection('reviews')}
            >
              Reseñas
            </button>
            <button
              className={`py-2 px-4 font-semibold ${activeSection === 'returns' ? 'border-b-2 border-black' : 'text-gray-600'}`}
              onClick={() => setActiveSection('returns')}
            >
              Devoluciones
            </button>
          </div>
    
          {renderSection()}
        </div>
      );
    };
  
  export default PedidosUser;
  