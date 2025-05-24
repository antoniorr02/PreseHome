import React from 'react';
import { useState, useEffect } from 'react';

const PedidosPendientes = () => {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});

  useEffect(() => {
    const fetchPedidos = async () => {
      try {
        const response = await fetch('http://localhost:5000/admin/pedidos?estado=pendiente', {
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

      // Actualizar el estado localmente
      setPedidos(pedidos.filter(pedido => pedido.pedido_id !== pedidoId));
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

  if (loading) return <div className="text-center py-4">Cargando pedidos pendientes...</div>;
  if (error) return <div className="text-red-500 text-center py-4">Error: {error}</div>;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200">
        <thead>
          <tr className="bg-gray-100">
            <th className="py-2 px-4 border-b"></th>
            <th className="py-2 px-4 border-b">ID</th>
            <th className="py-2 px-4 border-b">Fecha Pedido</th>
            <th className="py-2 px-4 border-b">Cliente</th>
            <th className="py-2 px-4 border-b">Total</th>
            <th className="py-2 px-4 border-b">Acciones</th>
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
                <tr className="hover:bg-gray-50">
                  <td className="py-2 px-4 border-b text-center">
                    <button 
                      onClick={() => toggleRowExpand(pedido.pedido_id)}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      {expandedRows[pedido.pedido_id] ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  </td>
                  <td className="py-2 px-4 border-b text-center">{pedido.pedido_id}</td>
                  <td className="py-2 px-4 border-b text-center">{formatDate(pedido.fecha_pedido)}</td>
                  <td className="py-2 px-4 border-b text-center">
                    {pedido.cliente.nombre} {pedido.cliente.apellidos}
                  </td>
                  <td className="py-2 px-4 border-b text-center">{pedido.total}€</td>
                  <td className="py-2 px-4 border-b text-center">
                    <div className="flex justify-center space-x-2">
                      <button
                        onClick={() => handleEstadoChange(pedido.pedido_id, 'enviado')}
                        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm"
                      >
                        Marcar como Enviado
                      </button>
                      <button
                        onClick={() => handleEstadoChange(pedido.pedido_id, 'cancelado')}
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm"
                      >
                        Cancelar
                      </button>
                    </div>
                  </td>
                </tr>
                {expandedRows[pedido.pedido_id] && (
                  <tr className="bg-gray-50">
                    <td colSpan="6" className="px-4 py-3 border-b">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-sm mb-1">Información del Cliente</h4>
                          <p className="text-sm"><span className="font-medium">Email:</span> {pedido.cliente.email}</p>
                          <p className="text-sm"><span className="font-medium">Teléfono:</span> {pedido.cliente.telefono || 'No disponible'}</p>
                          <p className="text-sm"><span className="font-medium">Dirección:</span> {formatDireccion(pedido.cliente)}</p>
                        </div>
                        <div>
                          <h4 className="font-medium text-sm mb-1">Detalles del Pedido</h4>
                          <p className="text-sm"><span className="font-medium">Productos:</span> {pedido.detalle_pedido.length}</p>
                          <p className="text-sm"><span className="font-medium">Estado:</span> <span className="capitalize">{pedido.estado}</span></p>
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
  );
};

export default PedidosPendientes;