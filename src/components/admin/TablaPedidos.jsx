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
        const response = await fetch('http://localhost:5000/admin/pedidos', {
          credentials: 'include',
        });
        
        if (!response.ok) {
          throw new Error('Error al obtener los pedidos');
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
      const response = await fetch(`http://localhost:5000/admin/pedidos/${pedidoId}/estado`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ estado: nuevoEstado }),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar el estado del pedido');
      }

      const updatedPedido = await response.json();
      
      setPedidos(pedidos.map(pedido => 
        pedido.pedido_id === updatedPedido.pedido_id ? updatedPedido : pedido
      ));
    } catch (err) {
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

  const formatDireccion = (cliente) => {
    if (!cliente) return 'Dirección no disponible';
    return `${cliente.direccion || ''}, ${cliente.ciudad || ''}, ${cliente.provincia || ''}, ${cliente.codigo_postal || ''}`;
  };

  const filteredPedidos = pedidos.filter(pedido => {
    if (activeFilter === 'todos') return true;
    return pedido.estado === activeFilter;
  });

  if (loading) return <div className="text-center py-8">Cargando pedidos...</div>;
  if (error) return <div className="text-red-500 text-center py-8">Error: {error}</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Gestión de Pedidos</h1>
        
        <div className="flex space-x-2">
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
          <div className="text-center py-8 text-gray-500">
            No hay pedidos {activeFilter !== 'todos' ? `con estado ${activeFilter}` : ''}
          </div>
        ) : (
          filteredPedidos.map((pedido) => {
            const totalFormateado = parseFloat(pedido.total).toFixed(2);
            const isExpanded = expandedPedidos[pedido.pedido_id];
            
            return (
              <div key={pedido.pedido_id} className="border border-gray-300 rounded-lg overflow-hidden shadow-sm">
                <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-b">
                  <div className="flex items-center space-x-4">
                    <button 
                      onClick={() => togglePedidoExpand(pedido.pedido_id)}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      {isExpanded ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                    <div>
                      <span className="font-medium">Pedido #{pedido.pedido_id}</span>
                      <span className="text-sm text-gray-500 ml-4">
                        Cliente: {pedido.cliente.nombre} {pedido.cliente.apellidos}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
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
                  </div>
                </div>

                {isExpanded && (
                  <div className="bg-gray-50 px-6 py-3 border-b">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-700">Información del Cliente</h3>
                        <div className="mt-1 text-sm text-gray-600">
                          <p><span className="font-medium">Email:</span> {pedido.cliente.email}</p>
                          <p><span className="font-medium">Teléfono:</span> {pedido.cliente.telefono || 'No disponible'}</p>
                          <p><span className="font-medium">Dirección:</span> {formatDireccion(pedido.cliente)}</p>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-700">Detalles del Pedido</h3>
                        <div className="mt-1 text-sm text-gray-600">
                          <p><span className="font-medium">Fecha pedido:</span> {formatDate(pedido.fecha_pedido)}</p>
                          {pedido.fecha_recepcion && (
                            <p><span className="font-medium">Fecha recepción:</span> {formatDate(pedido.fecha_recepcion)}</p>
                          )}
                          <p><span className="font-medium">Total:</span> {totalFormateado}€</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-4">Productos</h3>
                  {pedido.detalle_pedido.map((detalle) => (
                    <div key={`${pedido.pedido_id}-${detalle.producto_id}`} className="flex items-start mb-6 last:mb-0">
                      {detalle.producto?.imagenes?.[0]?.url && (
                        <img
                          src={detalle.producto.imagenes[0].url}
                          alt={detalle.producto.nombre}
                          className="w-20 h-20 object-cover rounded-lg mr-4"
                        />
                      )}

                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{detalle.producto.nombre}</h4>
                        <div className="text-sm text-gray-600 mt-1">
                          <span>Cantidad: {detalle.cantidad}</span>
                          <span className="mx-2">•</span>
                          <span>Precio unitario: {parseFloat(detalle.precio_unitario * (100 - detalle.producto.descuento) / 100.00).toFixed(2)}€</span>
                        </div>
                        <div className="text-sm mt-1">
                          Estado producto: 
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
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-medium">
                          {parseFloat(detalle.precio_unitario * ((100 - detalle.producto.descuento) / 100.00) * detalle.cantidad).toFixed(2)}€
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="border-t pt-4 mt-4 flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      {pedido.estado === 'entregado' && pedido.fecha_recepcion && (
                        <div>Fecha recepción: {formatDate(pedido.fecha_recepcion)}</div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-lg font-semibold">
                        Total: {totalFormateado}€
                      </div>
                      
                      <div className="flex space-x-2">
                        {pedido.estado === 'pendiente' && (
                          <>
                            <button
                              onClick={() => handleEstadoChange(pedido.pedido_id, 'enviado')}
                              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm"
                            >
                              Marcar como Enviado
                            </button>
                            <button
                              onClick={() => handleEstadoChange(pedido.pedido_id, 'cancelado')}
                              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm"
                            >
                              Cancelar Pedido
                            </button>
                          </>
                        )}
                        {pedido.estado === 'enviado' && (
                          <>
                            <button
                              onClick={() => handleEstadoChange(pedido.pedido_id, 'entregado')}
                              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm"
                            >
                              Marcar como Entregado
                            </button>
                            <button
                              onClick={() => handleEstadoChange(pedido.pedido_id, 'cancelado')}
                              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm"
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