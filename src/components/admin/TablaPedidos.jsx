import React, { useState, useEffect } from 'react';

const TablaPedidos = () => {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('todos');
  const [expandedPedidos, setExpandedPedidos] = useState({});

  useEffect(() => {
    const fetchPedidos = async () => {
      try {
        const response = await fetch(`/api/admin/pedidos`, {
          credentials: 'include',
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Error al obtener los pedidos');
        }
        
        const data = await response.json();
        setPedidos(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPedidos();
  }, []);

  const togglePedidoExpand = (pedidoId) => {
    setExpandedPedidos(prev => ({
      ...prev,
      [pedidoId]: !prev[pedidoId]
    }));
  };

  const handleEstadoChange = async (pedidoId, nuevoEstado) => {
    try {
      const response = await fetch(`/api/admin/pedidos/${pedidoId}/estado`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ estado: nuevoEstado }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar el estado del pedido');
      }

      const updatedPedido = await response.json();
      
      setPedidos(pedidos.map(pedido => 
        pedido.pedido_id === pedidoId ? {
          ...updatedPedido,
          detalle_pedido: pedido.detalle_pedido.map(detalle => ({
            ...detalle,
            estado: nuevoEstado === 'entregado' ? 'entregado' : 
                   nuevoEstado === 'enviado' ? 'enviado' :
                   nuevoEstado === 'cancelado' ? 'cancelado' : detalle.estado
          }))
        } : pedido
      ));
    } catch (err) {
      console.error('Error al actualizar estado:', err);
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
    return `${direccion.calle || ''} ${direccion.numero || ''}, ${direccion.piso || ''}, ${direccion.ciudad || ''}, ${direccion.cod_postal || ''}, ${direccion.pais || ''}`;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-ES', { 
      style: 'currency', 
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const calcularPrecioConDescuento = (precio, descuento) => {
    return precio * (100 - (descuento || 0)) / 100;
  };

  const filteredPedidos = pedidos.filter(pedido => {
    if (activeFilter === 'todos') return true;
    return pedido.estado === activeFilter;
  });

  if (loading) return <div className="text-center py-8">Cargando pedidos...</div>;
  if (error) return <div className="text-red-500 text-center py-8">Error: {error}</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-semibold">Gestión de Pedidos</h1>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveFilter('todos')}
            className={`px-4 py-2 rounded-full text-sm ${activeFilter === 'todos' ? 'bg-black text-white' : 'bg-gray-200'}`}
          >
            Todos
          </button>
          <button
            onClick={() => setActiveFilter('pendiente')}
            className={`px-4 py-2 rounded-full text-sm ${activeFilter === 'pendiente' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-200'}`}
          >
            Pendientes
          </button>
          <button
            onClick={() => setActiveFilter('enviado')}
            className={`px-4 py-2 rounded-full text-sm ${activeFilter === 'enviado' ? 'bg-blue-100 text-blue-800' : 'bg-gray-200'}`}
          >
            Enviados
          </button>
          <button
            onClick={() => setActiveFilter('entregado')}
            className={`px-4 py-2 rounded-full text-sm ${activeFilter === 'entregado' ? 'bg-green-100 text-green-800' : 'bg-gray-200'}`}
          >
            Entregados
          </button>
          <button
            onClick={() => setActiveFilter('cancelado')}
            className={`px-4 py-2 rounded-full text-sm ${activeFilter === 'cancelado' ? 'bg-red-100 text-red-800' : 'bg-gray-200'}`}
          >
            Cancelados
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {filteredPedidos.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-white rounded-lg shadow-sm">
            No hay pedidos {activeFilter !== 'todos' ? `con estado ${activeFilter}` : ''}
          </div>
        ) : (
          filteredPedidos.map((pedido) => {
            const isExpanded = expandedPedidos[pedido.pedido_id];
            
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
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      pedido.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                      pedido.estado === 'enviado' ? 'bg-blue-100 text-blue-800' :
                      pedido.estado === 'entregado' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {pedido.estado}
                    </span>
                    <span className="font-medium">
                      {formatCurrency(pedido.total)}
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
                          <p><span className="font-medium">Total:</span> {formatCurrency(pedido.total)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-4">Productos</h3>
                  <div className="space-y-4">
                    {pedido.detalle_pedido.map((detalle) => {
                      const precioConDescuento = calcularPrecioConDescuento(
                        parseFloat(detalle.precio_unitario),
                        detalle.producto?.descuento
                      );
                      const subtotal = precioConDescuento * detalle.cantidad;

                      return (
                        <div key={`${pedido.pedido_id}-${detalle.producto_id}`} className="flex flex-col sm:flex-row gap-4">
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
                              <p>
                                Precio unitario: {formatCurrency(precioConDescuento)}
                                {detalle.producto.descuento > 0 && (
                                  <span className="ml-2 text-gray-500 line-through">
                                    {formatCurrency(detalle.precio_unitario)}
                                  </span>
                                )}
                              </p>
                            </div>
                            <div className="text-sm mt-2">
                              <span>Estado: </span>
                              <span className={`${
                                detalle.estado === 'pendiente' ? 'text-yellow-600' :
                                detalle.estado === 'enviado' ? 'text-blue-600' :
                                detalle.estado === 'entregado' ? 'text-green-600' :
                                detalle.estado === 'cancelado' ? 'text-red-600' :
                                'text-gray-600'
                              }`}>
                                {detalle.estado}
                              </span>
                            </div>
                          </div>

                          <div className="sm:text-right">
                            <div className="font-medium">
                              {formatCurrency(subtotal)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="border-t pt-4 mt-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="text-sm text-gray-600">
                      {pedido.estado === 'entregado' && pedido.fecha_recepcion && (
                        <p>Fecha recepción: {formatDate(pedido.fecha_recepcion)}</p>
                      )}
                    </div>
                    
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full md:w-auto">
                      <div className="text-lg font-semibold md:ml-auto">
                        Total: {formatCurrency(pedido.total)}
                      </div>
                      
                      <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
                        {pedido.estado === 'pendiente' && (
                          <>
                            <button
                              onClick={() => handleEstadoChange(pedido.pedido_id, 'enviado')}
                              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm whitespace-nowrap"
                            >
                              Marcar como Enviado
                            </button>
                            <button
                              onClick={() => handleEstadoChange(pedido.pedido_id, 'cancelado')}
                              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm whitespace-nowrap"
                            >
                              Cancelar Pedido
                            </button>
                          </>
                        )}
                        {pedido.estado === 'enviado' && (
                          <>
                            <button
                              onClick={() => handleEstadoChange(pedido.pedido_id, 'entregado')}
                              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm whitespace-nowrap"
                            >
                              Marcar como Entregado
                            </button>
                            <button
                              onClick={() => handleEstadoChange(pedido.pedido_id, 'cancelado')}
                              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm whitespace-nowrap"
                            >
                              Cancelar Pedido
                            </button>
                          </>
                        )}
                      </div>
                    </div>
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

export default TablaPedidos;