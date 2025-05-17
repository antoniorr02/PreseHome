import React, { useState, useEffect } from 'react';
import FormEdiccionModal from './FormEdiccionModal';
import FormEditarReview from './FormEditarReview';
import ValorarProductoModal from './valorarProductoModal';

const PedidosUser = () => {
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState('orders');
    const [reviews, setReviews] = useState([]);
    const [loadingReviews, setLoadingReviews] = useState(false);
    const [pedidos, setPedidos] = useState([]);
    const [isEditarReview, setEditarReview] = useState(false);
    const [reviewAEditar, setReviewAEditar] = useState(null);
    const [productosMap, setProductosMap] = useState({});
    const [isValorarModalOpen, setIsValorarModalOpen] = useState(false);
    const [productoAValorar, setProductoAValorar] = useState(null);

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
      
    // Cancelar pedido completo (solo si está pendiente)
    const handleCancelarPedido = async (pedidoId) => {
      try {
          const response = await fetch(`http://localhost:5000/pedidos/${pedidoId}/cancelar`, {
              method: 'PUT',
              credentials: 'include',
          });

          if (response.ok) {
              setPedidos(pedidos.map(pedido => 
                  pedido.pedido_id === pedidoId 
                      ? { ...pedido, estado: 'cancelado' } 
                      : pedido
              ));
          }
      } catch (error) {
          console.error('Error al cancelar el pedido:', error);
      }
    };

    // Devolver producto individual
    const handleDevolverProducto = async (pedidoId, productoId) => {
      try {
          const response = await fetch(`http://localhost:5000/pedidos/${pedidoId}/productos/${productoId}/devolver`, {
              method: 'PUT',
              credentials: 'include',
          });

          const data = await response.json();

          if (response.ok) {
              // Actualizar el estado del producto en el pedido
              setPedidos(pedidos.map(pedido => 
                  pedido.pedido_id === pedidoId
                      ? {
                          ...pedido,
                          detalle_pedido: pedido.detalle_pedido.map(item =>
                              item.producto_id === productoId
                                  ? { ...item, estado: 'devolución' }
                                  : item
                          )
                      }
                      : pedido
              ));
              
              // Mostrar alerta con el mensaje del backend
              alert(data.mensaje);
          } else {
              alert(data.error || 'Error al solicitar devolución');
          }
      } catch (error) {
          console.error('Error al solicitar devolución:', error);
          alert('Error al conectar con el servidor');
      }
    };

    // Función para verificar si ha pasado el límite de 15 días desde la recepción
    const puedeDevolver = (fechaRecepcion) => {
      if (!fechaRecepcion) return false; // Si no hay fecha de recepción, no se puede devolver
      
      const fechaRecepcionDate = new Date(fechaRecepcion);
      const hoy = new Date();
      const diferenciaDias = (hoy - fechaRecepcionDate) / (1000 * 60 * 60 * 24);
      return diferenciaDias <= 15;
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
                    const totalFormateado = parseFloat(pedido.total).toFixed(2);
                    const fechaPedido = new Date(pedido.fecha_pedido);
                    const puedeDevolverPedido = puedeDevolver(pedido.fecha_recepcion);
                    
                    return (
                      <div key={pedido.pedido_id} className="border border-gray-400 p-4 rounded-lg">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-semibold">Pedido #{pedido.pedido_id}</h3>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-4">
                              <span className="text-sm text-gray-600">
                                {fechaPedido.toLocaleDateString('es-ES', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                              <span className={`px-3 py-1 rounded-full text-xs ${
                                pedido.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                                pedido.estado === 'enviado' ? 'bg-blue-100 text-blue-800' :
                                pedido.estado === 'entregado' ? 'bg-green-100 text-green-800' :
                                pedido.estado === 'cancelado' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {pedido.estado}
                              </span>
                            </div>
                            {/* Botón de cancelar debajo del estado, pero alineado a la derecha */}
                            {pedido.estado === 'pendiente' && (
                              <button 
                                onClick={() => handleCancelarPedido(pedido.pedido_id)}
                                className="bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-1 rounded"
                              >
                                Cancelar pedido completo
                              </button>
                            )}
                          </div>
                        </div>
                        {pedido.detalle_pedido.map((detalle) => {
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
                                      Precio original: {precioOriginal}€
                                    </p>
                                    <p className="text-sm text-green-600 font-semibold">
                                      Precio con {detalle.descuento_aplicado}% descuento: {precioConDescuento}€
                                    </p>
                                  </>
                                ) : (
                                  <p className="text-sm text-gray-700">
                                    Precio unitario: {precioUnitario}€
                                  </p>
                                )}
                                
                                {/* Estado del producto */}
                                <p className="text-sm">
                                  Estado: 
                                  <span className={`ml-2 ${
                                    detalle.estado === 'pendiente' ? 'text-yellow-600' :
                                    detalle.estado === 'enviado' ? 'text-blue-600' :
                                    detalle.estado === 'entregado' ? 'text-green-600' :
                                    detalle.estado === 'cancelado' ? 'text-red-600' :
                                    detalle.estado === 'devolución' ? 'text-purple-600' :
                                    'text-gray-600'
                                  }`}>
                                    {detalle.estado}
                                  </span>
                                </p>
                              </div>

                              {/* Acciones - Solo botones de devolución por producto */}
                              <div className="flex flex-col space-y-2 min-w-[120px]">
                                {detalle.estado === 'entregado' && (
                                  <button
                                    onClick={() => {
                                      setProductoAValorar(detalle.producto);
                                      setIsValorarModalOpen(true);
                                    }}
                                    className="bg-green-500 hover:bg-green-600 text-white text-sm px-3 py-1 rounded"
                                  >
                                    Valorar producto
                                  </button>
                                )}
                                {/* Botón para devolver producto individual */}
                                {puedeDevolverPedido && 
                                (detalle.estado === 'entregado') && (
                                  <button
                                    onClick={() => handleDevolverProducto(pedido.pedido_id, detalle.producto_id)}
                                    className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-1 rounded"
                                  >
                                    Devolver producto
                                  </button>
                                )}
                                
                                {detalle.estado === 'devolución' && (
                                  <span className="text-sm text-gray-500">Devolución en proceso</span>
                                )}
                                
                                {detalle.estado === 'cancelado' && (
                                  <span className="text-sm text-gray-500">Producto cancelado</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        
                        <div className="flex justify-between items-center mt-2 border-t pt-2">
                          <p className="text-sm text-gray-500">
                            {pedido.fecha_recepcion 
                              ? (puedeDevolverPedido 
                                  ? `Plazo de devolución válido (hasta ${new Date(new Date(pedido.fecha_recepcion).getTime() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString('es-ES')})`
                                  : "Plazo de devolución expirado")
                              : "Pedido no recibido aún"}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <ValorarProductoModal 
                  isOpen={isValorarModalOpen}
                  onClose={() => setIsValorarModalOpen(false)}
                  product={productoAValorar}
                />
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
                <div className="space-y-4">
                  {pedidos.length === 0 ? (
                    <p>No tienes pedidos todavía.</p>
                  ) : (
                    <>
                      <h2 className="text-xl font-semibold mb-4">Tus devoluciones</h2>
                      {pedidos
                        .filter(pedido => 
                          pedido.detalle_pedido.some(
                            detalle => ['devolución', 'devuelto'].includes(detalle.estado)
                          )
                        )
                        .map((pedido) => {
                          const fechaPedido = new Date(pedido.fecha_pedido);
                          const fechaRecepcion = pedido.fecha_recepcion ? new Date(pedido.fecha_recepcion) : null;
                          
                          return (
                            <div key={pedido.pedido_id} className="border border-gray-400 p-4 rounded-lg">
                              <div className="flex justify-between items-start mb-4">
                                <div>
                                  <h3 className="font-semibold">Pedido #{pedido.pedido_id}</h3>
                                  <p className="text-sm text-gray-600">
                                    Fecha pedido: {fechaPedido.toLocaleDateString('es-ES')}
                                  </p>
                                  {fechaRecepcion && (
                                    <p className="text-sm text-gray-600">
                                      Fecha recepción: {fechaRecepcion.toLocaleDateString('es-ES')}
                                    </p>
                                  )}
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs ${
                                  pedido.estado === 'devolución' ? 'bg-purple-100 text-purple-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {pedido.estado}
                                </span>
                              </div>
        
                              {pedido.detalle_pedido
                                .filter(detalle => ['devolución', 'devuelto'].includes(detalle.estado))
                                .map((detalle) => {
                                  const precioUnitario = parseFloat(detalle.precio_unitario).toFixed(2);
                                  
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
                                        <p className="text-sm text-gray-700">
                                          Precio unitario: {precioUnitario}€
                                        </p>
                                        
                                        {/* Estado del producto */}
                                        <p className="text-sm">
                                          Estado: 
                                          <span className={`ml-2 ${
                                            detalle.estado === 'devolución' ? 'text-purple-600' :
                                            'text-gray-600'
                                          }`}>
                                            {detalle.estado}
                                          </span>
                                        </p>
                                      </div>
        
                                      {/* Acciones */}
                                      <div className="flex flex-col space-y-2 min-w-[120px]">
                                        {detalle.estado === 'devolución' && (
                                          <span className="text-sm text-gray-500">Devolución en proceso</span>
                                        )}
                                        {detalle.estado === 'devuelto' && (
                                          <span className="text-sm text-green-600">Producto devuelto</span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })
                              }
                            </div>
                          );
                        })
                      }
                    </>
                  )}
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