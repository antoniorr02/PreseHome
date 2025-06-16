import React from 'react';
import { useState, useEffect } from 'react';

const PedidosPendientes = () => {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});

  useEffect(() => {
    fetch('http://localhost/rol-sesion', {
      credentials: 'include',
    })
      .then((res) => {
        if (!res.ok) {
          window.location.href = '/';
          throw new Error('No autorizado');
        }
        return res.json();
      })
      .then(({ rol }) => {
        if (rol !== 'Admin') {
          window.location.href = '/';
        }
      })
      .catch(() => {
        window.location.href = '/';
      });
  }, []);
  
  useEffect(() => {
    const fetchPedidos = async () => {
      try {
        const response = await fetch(`http://localhost/admin/pedidos?estado=pendiente`, {
          credentials: 'include',
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Error al obtener los pedidos');
        }
        
        const data = await response.json();
        setPedidos(data);
      } catch (err) {
        console.error('Error fetching pedidos:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPedidos();
  }, []);

  const toggleRowExpand = (pedidoId) => {
    setExpandedRows(prev => ({
      ...prev,
      [pedidoId]: !prev[pedidoId]
    }));
  };

  const handleEstadoChange = async (pedidoId, nuevoEstado) => {
    try {
      const response = await fetch(`http://localhost/admin/pedidos/${pedidoId}/estado`, {
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

      setPedidos(pedidos.map(pedido => 
        pedido.pedido_id === pedidoId ? { ...pedido, estado: nuevoEstado } : pedido
      ));
      
      if (nuevoEstado === 'enviado' || nuevoEstado === 'cancelado') {
        setPedidos(pedidos.filter(pedido => pedido.pedido_id !== pedidoId));
      }
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

  if (loading) return <div className="text-center py-4">Cargando pedidos pendientes...</div>;
  if (error) return <div className="text-red-500 text-center py-4">Error: {error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Pedidos Pendientes</h1>
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-3 px-4 text-left"></th>
              <th className="py-3 px-4 text-left">ID</th>
              <th className="py-3 px-4 text-left">Fecha Pedido</th>
              <th className="py-3 px-4 text-left">Cliente</th>
              <th className="py-3 px-4 text-left">Total</th>
              <th className="py-3 px-4 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pedidos.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-4 text-center text-gray-500">
                  No hay pedidos pendientes
                </td>
              </tr>
            ) : (
              pedidos.map((pedido) => (
                <React.Fragment key={pedido.pedido_id}>
                  <tr className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <button 
                        onClick={() => toggleRowExpand(pedido.pedido_id)}
                        className="text-gray-600 hover:text-gray-900 focus:outline-none"
                      >
                        {expandedRows[pedido.pedido_id] ? '▼' : '►'}
                      </button>
                    </td>
                    <td className="py-3 px-4">#{pedido.pedido_id}</td>
                    <td className="py-3 px-4">{formatDate(pedido.fecha_pedido)}</td>
                    <td className="py-3 px-4">
                      {pedido.cliente.nombre} {pedido.cliente.apellidos}
                    </td>
                    <td className="py-3 px-4">{formatCurrency(pedido.total)}</td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEstadoChange(pedido.pedido_id, 'enviado')}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                        >
                          Enviar
                        </button>
                        <button
                          onClick={() => handleEstadoChange(pedido.pedido_id, 'cancelado')}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                        >
                          Cancelar
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedRows[pedido.pedido_id] && (
                    <tr className="bg-gray-50">
                      <td colSpan="6" className="px-4 py-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h3 className="font-semibold mb-2">Información del Cliente</h3>
                            <p><span className="font-medium">Email:</span> {pedido.cliente.email}</p>
                            <p><span className="font-medium">Teléfono:</span> {pedido.cliente.telefono || 'No disponible'}</p>
                            <p><span className="font-medium">Dirección:</span> {formatDireccion(pedido.direccion)}</p>
                          </div>
                          <div>
                            <h3 className="font-semibold mb-2">Detalles del Pedido</h3>
                            <div className="space-y-2">
                              {pedido.detalle_pedido.map((detalle) => (
                                <div key={detalle.detalle_id} className="flex justify-between">
                                  <span>
                                    {detalle.producto.nombre} x {detalle.cantidad}
                                  </span>
                                  <span>{formatCurrency(detalle.precio_unitario * (100 - detalle.producto.descuento)/100.0)}</span>
                                </div>
                              ))}
                              <div className="border-t pt-2 font-medium">
                                Total: {formatCurrency(pedido.total)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PedidosPendientes;