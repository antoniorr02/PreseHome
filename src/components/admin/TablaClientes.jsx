import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';

const TablaClientes = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    nombre: '',
    apellidos: '',
    estado: '',
    rol: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });
  const [sortConfig, setSortConfig] = useState({
    field: 'fecha_registro',
    direction: 'desc'
  });

  useEffect(() => {
    fetchClientes();
  }, [filters, pagination.page, pagination.limit, sortConfig]);

  const fetchClientes = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        search: filters.search,
        nombre: filters.nombre,
        apellidos: filters.apellidos,
        estado: filters.estado,
        rol: filters.rol,
        sortField: sortConfig.field,
        sortOrder: sortConfig.direction
      }).toString();

      const response = await fetch(`http://localhost:5000/clientes?${queryParams}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Error al obtener clientes');
      }
      
      const { data, pagination: paginationData } = await response.json();
      setClientes(data);
      setPagination(prev => ({
        ...prev,
        total: paginationData.total,
        totalPages: paginationData.totalPages
      }));
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar los clientes');
      setLoading(false);
    }
  };

  const handleSort = (field) => {
    let direction = 'asc';
    if (sortConfig.field === field && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ field, direction });
  };

  const handleBanear = (clienteId, banear) => {
    confirmAlert({
      title: 'Confirmar acción',
      message: `¿Estás seguro que deseas ${banear ? 'banear' : 'desbanear'} este cliente?`,
      buttons: [
        {
          label: 'Sí',
          onClick: async () => {
            try {
              const response = await fetch(`http://localhost:5000/clientes/${clienteId}/ban`, {
                method: 'PATCH',
                credentials: 'include',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ banear }),
              });

              if (!response.ok) {
                throw new Error('Error al actualizar el estado');
              }

              // Refrescar los datos
              fetchClientes();
              toast.success(`Cliente ${banear ? 'baneado' : 'desbaneado'} correctamente`);
            } catch (error) {
              console.error('Error:', error);
              toast.error('Error al actualizar el estado del cliente');
            }
          }
        },
        {
          label: 'No',
          onClick: () => {}
        }
      ]
    });
  };

  const handleEliminar = (clienteId) => {
    confirmAlert({
      title: 'Confirmar eliminación',
      message: '¿Estás seguro que deseas eliminar este cliente permanentemente? Esta acción no se puede deshacer.',
      buttons: [
        {
          label: 'Sí, eliminar',
          onClick: async () => {
            try {
              const response = await fetch(`http://localhost:5000/clientes/${clienteId}`, {
                method: 'DELETE',
                credentials: 'include',
              });

              if (!response.ok) {
                throw new Error('Error al eliminar el cliente');
              }

              // Refrescar los datos
              fetchClientes();
              toast.success('Cliente eliminado correctamente');
            } catch (error) {
              console.error('Error:', error);
              toast.error('Error al eliminar el cliente');
            }
          }
        },
        {
          label: 'Cancelar',
          onClick: () => {}
        }
      ]
    });
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const SortIndicator = ({ field }) => {
    if (sortConfig.field !== field) return null;
    return sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
            Buscar (email/DNI):
          </label>
          <input
            type="text"
            id="search"
            name="search"
            placeholder="Buscar..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filters.search}
            onChange={handleFilterChange}
          />
        </div>
        
        <div>
          <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
            Nombre:
          </label>
          <input
            type="text"
            id="nombre"
            name="nombre"
            placeholder="Filtrar por nombre"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filters.nombre}
            onChange={handleFilterChange}
          />
        </div>
        
        <div>
          <label htmlFor="apellidos" className="block text-sm font-medium text-gray-700 mb-1">
            Apellidos:
          </label>
          <input
            type="text"
            id="apellidos"
            name="apellidos"
            placeholder="Filtrar por apellidos"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filters.apellidos}
            onChange={handleFilterChange}
          />
        </div>
        
        <div>
          <label htmlFor="estado" className="block text-sm font-medium text-gray-700 mb-1">
            Estado:
          </label>
          <select
            id="estado"
            name="estado"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filters.estado}
            onChange={handleFilterChange}
          >
            <option value="">Todos</option>
            <option value="baneado">Baneados</option>
            <option value="activo">Activos</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="rol" className="block text-sm font-medium text-gray-700 mb-1">
            Rol:
          </label>
          <select
            id="rol"
            name="rol"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filters.rol}
            onChange={handleFilterChange}
          >
            <option value="">Todos</option>
            <option value="Admin">Admin</option>
            <option value="Cliente">Cliente</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="limit" className="block text-sm font-medium text-gray-700 mb-1">
            Items por página:
          </label>
          <select
            id="limit"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={pagination.limit}
            onChange={(e) => setPagination(prev => ({
              ...prev,
              limit: parseInt(e.target.value),
              page: 1
            }))}
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('cliente_id')}
              >
                ID <SortIndicator field="cliente_id" />
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('nombre')}
              >
                Nombre <SortIndicator field="nombre" />
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('apellidos')}
              >
                Apellidos <SortIndicator field="apellidos" />
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('email')}
              >
                Email <SortIndicator field="email" />
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('rol')}
              >
                Rol <SortIndicator field="rol" />
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('fecha_registro')}
              >
                Fecha Registro <SortIndicator field="fecha_registro" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="8" className="px-6 py-4 text-center">
                  <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                </td>
              </tr>
            ) : clientes.length > 0 ? (
              clientes.map((cliente) => (
                <tr key={cliente.cliente_id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {cliente.cliente_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {cliente.nombre}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {cliente.apellidos}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {cliente.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {cliente.rol}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(cliente.fecha_registro).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {cliente.baneado ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        Baneado
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Activo
                      </span>
                    )}
                    {!cliente.confirmado && (
                      <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        No confirmado
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {cliente.baneado ? (
                      <button
                        onClick={() => handleBanear(cliente.cliente_id, false)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        Desbanear
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBanear(cliente.cliente_id, true)}
                        className="text-red-600 hover:text-red-900 mr-3"
                      >
                        Banear
                      </button>
                    )}
                    <button
                      onClick={() => handleEliminar(cliente.cliente_id)}
                      className="text-gray-600 hover:text-gray-900 ml-2"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500">
                  No se encontraron clientes con los filtros aplicados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <div>
            <span className="text-sm text-gray-700">
              Mostrando {(pagination.page - 1) * pagination.limit + 1} a{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
              {pagination.total} clientes
            </span>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handlePageChange(1)}
              disabled={pagination.page === 1}
              className={`px-3 py-1 rounded-md ${pagination.page === 1 ? 'bg-gray-200 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
            >
              «
            </button>
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className={`px-3 py-1 rounded-md ${pagination.page === 1 ? 'bg-gray-200 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
            >
              ‹
            </button>
            
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              let pageNum;
              if (pagination.totalPages <= 5) {
                pageNum = i + 1;
              } else if (pagination.page <= 3) {
                pageNum = i + 1;
              } else if (pagination.page >= pagination.totalPages - 2) {
                pageNum = pagination.totalPages - 4 + i;
              } else {
                pageNum = pagination.page - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`px-3 py-1 rounded-md ${pagination.page === pageNum ? 'bg-blue-700 text-white' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className={`px-3 py-1 rounded-md ${pagination.page === pagination.totalPages ? 'bg-gray-200 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
            >
              ›
            </button>
            <button
              onClick={() => handlePageChange(pagination.totalPages)}
              disabled={pagination.page === pagination.totalPages}
              className={`px-3 py-1 rounded-md ${pagination.page === pagination.totalPages ? 'bg-gray-200 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
            >
              »
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TablaClientes;