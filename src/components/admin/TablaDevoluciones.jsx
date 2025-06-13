import React, { useState, useEffect } from 'react';

const TablaDevoluciones = () => {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedPedidos, setExpandedPedidos] = useState({});
  const [activeFilter, setActiveFilter] = useState('solicitada');

  useEffect(() => {
    const fetchPedidosConDevoluciones = async () => {
      try {
        const response = await fetch(`/api/admin/devoluciones`, {
          credentials: 'include',
        });
        
        if (!response.ok) {
            let errorMsg = 'Error al obtener las devoluciones';
            try {
              const errorData = await response.json();
              errorMsg = errorData.error || errorMsg;
            } catch (e) {
              errorMsg = `${response.status} ${response.statusText}`;
            }
            throw new Error(errorMsg);
          }
          
        
        const data = await response.json();
        setPedidos(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPedidosConDevoluciones();
  }, []);

  const togglePedidoExpand = (pedidoId) => {
    setExpandedPedidos(prev => ({
      ...prev,
      [pedidoId]: !prev[pedidoId]
    }));
  };

  const handleEstadoDevolucion = async (pedidoId, productoId, nuevoEstado) => {
    try {
      const response = await fetch(
        `/api/admin/devoluciones/${pedidoId}/producto/${productoId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ estado: nuevoEstado }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar la devolución');
      }

      setPedidos(pedidos.map(pedido => {
        if (pedido.pedido_id === pedidoId) {
          return {
            ...pedido,
            detalle_pedido: pedido.detalle_pedido.map(detalle => {
              if (detalle.producto_id === productoId) {
                return {
                  ...detalle,
                  estado: nuevoEstado
                };
              }
              return detalle;
            })
          };
        }
        return pedido;
      }));
    } catch (err) {
      console.error('Error al actualizar devolución:', err);
      setError(err.message);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDireccion = (direccion) => {
    if (!direccion) return 'Dirección no disponible';
    return `${direccion.calle || ''} ${direccion.numero || ''}, ${direccion.piso || ''}, ${direccion.ciudad || ''}, ${direccion.cod_postal || ''}`;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-ES', { 
      style: 'currency', 
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const filteredPedidos = pedidos.filter(pedido => 
    pedido.detalle_pedido.some(detalle => 
      activeFilter === 'todos' ? 
      ['solicitada', 'devolución', 'devuelto', 'cancelado'].includes(detalle.estado) : 
      detalle.estado === activeFilter
    )
  );

  if (loading) return <div className="text-center py-8">Cargando devoluciones...</div>;
  if (error) return <div className="text-red-500 text-center py-8">Error: {error}</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-semibold">Gestión de Devoluciones</h1>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveFilter('todos')}
            className={`px-4 py-2 rounded-full text-sm ${activeFilter === 'todos' ? 'bg-black text-white' : 'bg-gray-200'}`}
          >
            Todas
          </button>
          <button
            onClick={() => setActiveFilter('solicitada')}
            className={`px-4 py-2 rounded-full text-sm ${activeFilter === 'solicitada' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-200'}`}
          >
            Solicitadas
          </button>
          <button
            onClick={() => setActiveFilter('devolución')}
            className={`px-4 py-2 rounded-full text-sm ${activeFilter === 'devolución' ? 'bg-blue-100 text-blue-800' : 'bg-gray-200'}`}
          >
            En proceso
          </button>
          <button
            onClick={() => setActiveFilter('devuelto')}
            className={`px-4 py-2 rounded-full text-sm ${activeFilter === 'devuelto' ? 'bg-green-100 text-green-800' : 'bg-gray-200'}`}
          >
            Completadas
          </button>
          <button
            onClick={() => setActiveFilter('cancelado')}
            className={`px-4 py-2 rounded-full text-sm ${activeFilter === 'cancelado' ? 'bg-red-100 text-red-800' : 'bg-gray-200'}`}
          >
            Canceladas
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {filteredPedidos.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-white rounded-lg shadow-sm">
            No hay devoluciones {activeFilter !== 'todos' ? `con estado ${activeFilter}` : ''}
          </div>
        ) : (
          filteredPedidos.map((pedido) => {
            const isExpanded = expandedPedidos[pedido.pedido_id];
            const productosDevolucion = pedido.detalle_pedido.filter(
              detalle => ['solicitada', 'devolución', 'devuelto', 'cancelado'].includes(detalle.estado)
            );
            
            return (
              <div key={pedido.pedido_id} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm bg-white">
                <div className="px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => togglePedidoExpand(pedido.pedido_id)}
                      className="text-gray-600 hover:text-gray-900 flex-shrink-0"
                      aria-label={isExpanded ? 'Ocultar detalles' : 'Mostrar detalles'}
                    >
                      {isExpanded ? '▼' : '►'}
                    </button>
                    <div>
                      <span className="font-medium">Pedido #{pedido.pedido_id}</span>
                      <span className="text-sm text-gray-500 ml-2 sm:ml-4">
                        Cliente: {pedido.cliente.nombre} {pedido.cliente.apellidos}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6">
                    <span className="text-sm text-gray-600">
                      {formatDate(pedido.fecha_pedido)}
                    </span>
                    <span className="text-sm font-medium">
                      {productosDevolucion.length} producto(s) en devolución
                    </span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-6 py-4 border-b bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Información del Cliente</h3>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p><span className="font-medium">Email:</span> {pedido.cliente.email}</p>
                          <p><span className="font-medium">Teléfono:</span> {pedido.cliente.telefono || 'No disponible'}</p>
                          <p><span className="font-medium">Dirección:</span> {formatDireccion(pedido.direccion)}</p>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Detalles del Pedido</h3>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p><span className="font-medium">Fecha pedido:</span> {formatDate(pedido.fecha_pedido)}</p>
                          {pedido.fecha_recepcion && (
                            <p><span className="font-medium">Fecha recepción:</span> {formatDate(pedido.fecha_recepcion)}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-4">Productos en devolución</h3>
                  <div className="space-y-4">
                    {productosDevolucion.map((detalle) => (
                      <div key={`${pedido.pedido_id}-${detalle.producto_id}`} className="flex flex-col sm:flex-row gap-4 border-b pb-4 last:border-0">
                        {detalle.producto?.imagenes?.[0]?.url && (
                          <img
                            src={detalle.producto.imagenes[0].url}
                            alt={detalle.producto.nombre}
                            className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                          />
                        )}

                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{detalle.producto.nombre}</h4>
                          <div className="text-sm text-gray-600 mt-1 space-y-1">
                            <p>Cantidad: {detalle.cantidad}</p>
                            <p>Precio unitario: {formatCurrency(detalle.precio_unitario)}</p>
                            <p>Subtotal: {formatCurrency(detalle.precio_unitario * detalle.cantidad)}</p>
                          </div>
                          <div className="text-sm mt-2">
                            <span>Estado: </span>
                            <span className={`${
                              detalle.estado === 'solicitada' ? 'text-yellow-600' :
                              detalle.estado === 'devolución' ? 'text-blue-600' :
                              detalle.estado === 'devuelto' ? 'text-green-600' :
                              detalle.estado === 'cancelado' ? 'text-red-600' :
                              'text-gray-600'
                            }`}>
                              {detalle.estado}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                          {detalle.estado === 'solicitada' && (
                            <>
                              <button
                                onClick={() => handleEstadoDevolucion(pedido.pedido_id, detalle.producto_id, 'devolución')}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm whitespace-nowrap"
                              >
                                Aceptar Devolución
                              </button>
                              <button
                                onClick={() => handleEstadoDevolucion(pedido.pedido_id, detalle.producto_id, 'cancelado')}
                                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm whitespace-nowrap"
                              >
                                Rechazar Devolución
                              </button>
                            </>
                          )}
                          {detalle.estado === 'devolución' && (
                            <button
                              onClick={() => handleEstadoDevolucion(pedido.pedido_id, detalle.producto_id, 'devuelto')}
                              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm whitespace-nowrap"
                            >
                              Marcar como Devuelto
                            </button>
                          )}
                          {detalle.estado === 'devuelto' && (
                            <span className="text-sm text-green-600">
                              Devolución completada
                            </span>
                          )}
                          {detalle.estado === 'cancelado' && (
                            <span className="text-sm text-red-600">
                              Devolución cancelada
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TablaDevoluciones;