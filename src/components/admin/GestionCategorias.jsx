import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';

const GestionCategorias = () => {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [categoriaEditando, setCategoriaEditando] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    url_imagen: ''
  });

  useEffect(() => {
    fetchCategorias();
  }, []);

  const fetchCategorias = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/categorias`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Error al obtener categorías');
      }
      
      const data = await response.json();
      setCategorias(data);
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar las categorías');
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const abrirModalNuevaCategoria = () => {
    setCategoriaEditando(null);
    setFormData({
      nombre: '',
      url_imagen: ''
    });
    setModalAbierto(true);
  };

  const abrirModalEditarCategoria = (categoria) => {
    setCategoriaEditando(categoria);
    setFormData({
      nombre: categoria.nombre,
      url_imagen: categoria.url_imagen || ''
    });
    setModalAbierto(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validación básica de URL
    // if (!formData.url_imagen.startsWith('http://') && !formData.url_imagen.startsWith('https://')) {
    //   toast.error('La URL de la imagen debe comenzar con http:// o https://');
    //   return;
    // } // Descomentar en produccion
    
    try {
      const url = categoriaEditando 
        ? `/api/categorias/${categoriaEditando.categoria_id}`
        : '/api/categorias';
      
      const method = categoriaEditando ? 'PUT' : 'POST';
  
      setLoading(true);

      const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nombre: formData.nombre,
          url_imagen: formData.url_imagen
        })
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.error || 'Error en la solicitud');
      }
  
      toast.success(`Categoría ${categoriaEditando ? 'actualizada' : 'creada'} correctamente`);
      setModalAbierto(false);
      await fetchCategorias();
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.message || `Error al ${categoriaEditando ? 'actualizar' : 'crear'} la categoría`);
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = (categoriaId) => {
    confirmAlert({
      title: 'Confirmar eliminación',
      message: '¿Estás seguro que deseas eliminar esta categoría? Los productos asociados no se eliminarán, pero perderán esta categorización.',
      buttons: [
        {
          label: 'Sí, eliminar',
          onClick: async () => {
            try {
              const response = await fetch(`/api/categorias/${categoriaId}`, {
                method: 'DELETE',
                credentials: 'include',
              });

              if (!response.ok) {
                throw new Error('Error al eliminar la categoría');
              }

              toast.success('Categoría eliminada correctamente');
              fetchCategorias();
            } catch (error) {
              console.error('Error:', error);
              toast.error('Error al eliminar la categoría');
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

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Listado de Categorías</h2>
        <button
          onClick={abrirModalNuevaCategoria}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          + Nueva Categoría
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : categorias.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500">No hay categorías registradas</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Imagen
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categorias.map((categoria) => (
                <tr key={categoria.categoria_id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {categoria.categoria_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {categoria.nombre}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {categoria.url_imagen ? (
                      <a href={categoria.url_imagen} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        Ver imagen
                      </a>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => abrirModalEditarCategoria(categoria)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleEliminar(categoria.categoria_id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalAbierto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                {categoriaEditando ? 'Editar Categoría' : 'Nueva Categoría'}
              </h3>
              
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.nombre}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="url_imagen" className="block text-sm font-medium text-gray-700 mb-1">
                    URL de la Imagen *
                  </label>
                  <input
                    type="string" // Poner url en produccion
                    id="url_imagen"
                    name="url_imagen"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.url_imagen}
                    onChange={handleInputChange}
                    placeholder="https://ejemplo.com/imagen.jpg"
                  />
                  <p className="mt-1 text-sm text-gray-500">Ingrese la URL completa de la imagen (debe comenzar con http:// o https://)</p>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setModalAbierto(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                  >
                    {categoriaEditando ? 'Actualizar' : 'Crear'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionCategorias;