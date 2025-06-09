import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';

const TablaProductos = () => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    minPrice: '',
    maxPrice: '',
    category: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });
  const [sortConfig, setSortConfig] = useState({
    field: 'producto_id',
    direction: 'desc'
  });
  const [categories, setCategories] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [newProduct, setNewProduct] = useState({
    nombre: '',
    marca: '',
    descripcion: '',
    precio: '',
    stock: '',
    descuento: 0,
    categorias: [],
    imagenes: [{ url: '', principal: true }]
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [productoEnEdicion, setProductoEnEdicion] = useState(null);

  

  const openModal = (producto = null) => {
    if (producto) {
      setIsEditMode(true);
      setProductoEnEdicion(producto);
      setNewProduct({
        nombre: producto.nombre,
        marca: producto.marca,
        descripcion: producto.descripcion || '',
        precio: producto.precio.toString(),
        stock: producto.stock.toString(),
        descuento: producto.descuento?.toString() || '0',
        categorias: producto.categorias.map(c => c.categoria_id),
        imagenes: producto.imagenes.map(img => ({
          url: img.url,
          principal: img.principal
        }))
      });
      setSelectedCategories(producto.categorias.map(c => c.categoria.categoria_id));
    } else {
      setIsEditMode(false);
      setProductoEnEdicion(null);
      setNewProduct({
        nombre: '',
        marca: '',
        descripcion: '',
        precio: '',
        stock: '',
        descuento: 0,
        categorias: [],
        imagenes: [{ url: '', principal: true }]
      });
      setSelectedCategories([]);
    }
  
    setIsModalOpen(true);
  };
  

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setNewProduct({
      nombre: '',
      marca: '',
      descripcion: '',
      precio: '',
      stock: '',
      descuento: 0,
      categorias: [],
      imagenes: [{ url: '', principal: true }]
    });
    setSelectedCategories([]);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProduct(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (index, field, value) => {
    const updatedImages = [...newProduct.imagenes];
    updatedImages[index] = {
      ...updatedImages[index],
      [field]: field === 'principal' ? value === 'true' : value
    };
    setNewProduct(prev => ({
      ...prev,
      imagenes: updatedImages
    }));
  };

  const addImageField = () => {
    setNewProduct(prev => ({
      ...prev,
      imagenes: [...prev.imagenes, { url: '', principal: false }]
    }));
  };

  const removeImageField = (index) => {
    const updatedImages = newProduct.imagenes.filter((_, i) => i !== index);
    if (updatedImages.length > 0 && !updatedImages.some(img => img.principal)) {
      updatedImages[0].principal = true;
    }
    setNewProduct(prev => ({
      ...prev,
      imagenes: updatedImages
    }));
  };

  const handleCategoryChange = (e) => {
    const { value, checked } = e.target;
    if (checked) {
      setSelectedCategories([...selectedCategories, parseInt(value)]);
    } else {
      setSelectedCategories(selectedCategories.filter(id => id !== parseInt(value)));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const method = isEditMode ? 'PUT' : 'POST';
    const endpoint = isEditMode 
      ? `http://localhost:5000/admin/productos/${productoEnEdicion.producto_id}` 
      : 'http://localhost:5000/admin/productos';
  
    try {
      if (!newProduct.nombre || !newProduct.marca || !newProduct.precio || !newProduct.stock) {
        toast.error('Por favor complete todos los campos requeridos');
        return;
      }
  
      if (newProduct.imagenes.length === 0 || !newProduct.imagenes.some(img => img.url)) {
        toast.error('Debe agregar al menos una imagen con URL válida');
        return;
      }
      
      const categoriasFiltradas = selectedCategories.filter(id => Number.isInteger(id));

      const response = await fetch(endpoint, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newProduct,
          precio: parseFloat(newProduct.precio),
          stock: parseInt(newProduct.stock),
          descuento: parseFloat(newProduct.descuento),
          categorias: categoriasFiltradas,
          imagenes: newProduct.imagenes.filter(img => img.url)
        })
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al guardar el producto');
      }
  
      toast.success(isEditMode ? 'Producto actualizado' : 'Producto creado');
      closeModal();
      fetchProductos();
    } catch (error) {
      console.error('Error en submit:', error);
      toast.error(error.message || 'Error al guardar el producto');
    }
  };  

  useEffect(() => {
    fetchProductos();
    fetchCategories();
  }, [filters, pagination.page, pagination.limit, sortConfig]);

  const fetchProductos = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        search: filters.search,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        category: filters.category,
        sortField: sortConfig.field,
        sortOrder: sortConfig.direction
      }).toString();

      const response = await fetch(`http://localhost:5000/admin/productos?${queryParams}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Error al obtener productos');
      }
      
      const { data, pagination: paginationData } = await response.json();
      setProductos(data);
      setPagination(prev => ({
        ...prev,
        total: paginationData.total,
        totalPages: paginationData.totalPages
      }));
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar los productos');
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:5000/categorias', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    }
  };

  const handleSort = (field) => {
    let direction = 'asc';
    if (sortConfig.field === field && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ field, direction });
  };

  const handleEliminar = (productoId) => {
    confirmAlert({
      title: 'Confirmar eliminación',
      message: '¿Estás seguro que deseas eliminar este producto? Esta acción no se puede deshacer.',
      buttons: [
        {
          label: 'Sí, eliminar',
          onClick: async () => {
            try {
              const response = await fetch(`http://localhost:5000/admin/productos/${productoId}`, {
                method: 'DELETE',
                credentials: 'include',
              });

              if (!response.ok) {
                throw new Error('Error al eliminar el producto');
              }

              toast.success('Producto eliminado correctamente');
              fetchProductos();
            } catch (error) {
              console.error('Error:', error);
              toast.error('Error al eliminar el producto');
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

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Gestión de Productos</h2>
        <button
          onClick={() => openModal(null)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
           Añadir Producto
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {isEditMode ? 'Editar Producto' : 'Añadir Nuevo Producto'}
              </h3>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre*</label>
                  <input
                    type="text"
                    name="nombre"
                    value={newProduct.nombre}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Marca*</label>
                  <input
                    type="text"
                    name="marca"
                    value={newProduct.marca}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Precio*</label>
                  <input
                    type="number"
                    name="precio"
                    value={newProduct.precio}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock*</label>
                  <input
                    type="number"
                    name="stock"
                    value={newProduct.stock}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descuento (%)</label>
                  <input
                    type="number"
                    name="descuento"
                    value={newProduct.descuento}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    min="0"
                    max="100"
                    step="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                  <textarea
                    name="descripcion"
                    value={newProduct.descripcion}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows="2"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Categorías</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {categories.map(category => (
                    <div key={category.categoria_id} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`cat-${category.categoria_id}`}
                        value={category.categoria_id}
                        checked={selectedCategories.includes(category.categoria_id)}
                        onChange={handleCategoryChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`cat-${category.categoria_id}`} className="ml-2 text-sm text-gray-700">
                        {category.nombre}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Imágenes</label>
                {newProduct.imagenes.map((image, index) => (
                  <div key={index} className="flex items-center mb-2">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="URL de la imagen"
                        value={image.url}
                        onChange={(e) => handleImageChange(index, 'url', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div className="ml-2">
                      <select
                        value={image.principal.toString()}
                        onChange={(e) => handleImageChange(index, 'principal', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="true">Principal</option>
                        <option value="false">Secundaria</option>
                      </select>
                    </div>
                    {newProduct.imagenes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeImageField(index)}
                        className="ml-2 p-2 text-red-500 hover:text-red-700"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addImageField}
                  className="mt-2 px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  + Añadir otra imagen
                </button>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  {isEditMode ? 'Actualizar Producto' : 'Guardar Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
            Buscar (nombre/marca):
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
          <label htmlFor="minPrice" className="block text-sm font-medium text-gray-700 mb-1">
            Precio mínimo:
          </label>
          <input
            type="number"
            id="minPrice"
            name="minPrice"
            placeholder="Mínimo"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filters.minPrice}
            onChange={handleFilterChange}
            min="0"
            step="0.01"
          />
        </div>
        
        <div>
          <label htmlFor="maxPrice" className="block text-sm font-medium text-gray-700 mb-1">
            Precio máximo:
          </label>
          <input
            type="number"
            id="maxPrice"
            name="maxPrice"
            placeholder="Máximo"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filters.maxPrice}
            onChange={handleFilterChange}
            min="0"
            step="0.01"
          />
        </div>
        
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Categoría:
          </label>
          <select
            id="category"
            name="category"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filters.category}
            onChange={handleFilterChange}
          >
            <option value="">Todas</option>
            {categories.map(category => (
              <option key={category.categoria_id} value={category.categoria_id}>
                {category.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('producto_id')}
              >
                ID <SortIndicator field="producto_id" />
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('nombre')}
              >
                Nombre <SortIndicator field="nombre" />
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('marca')}
              >
                Marca <SortIndicator field="marca" />
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('precio')}
              >
                Precio <SortIndicator field="precio" />
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('stock')}
              >
                Stock <SortIndicator field="stock" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Categorías
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
            {loading ? (
              <tr>
                <td colSpan="8" className="px-6 py-4 text-center">
                  <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                </td>
              </tr>
            ) : productos.length > 0 ? (
              productos.map((producto) => (
                <tr key={producto.producto_id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {producto.producto_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {producto.nombre}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {producto.marca}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatPrice(producto.precio)}
                    {producto.descuento > 0 && (
                      <span className="ml-2 text-red-500">
                        (-{(producto.descuento)+'%'})
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {producto.stock}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {producto.categorias.map(c => c.categoria.nombre).join(', ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {producto.imagenes.length > 0 && (
                      <img 
                        src={producto.imagenes.find(img => img.principal)?.url || producto.imagenes[0].url} 
                        alt={producto.nombre}
                        className="h-10 w-10 object-cover rounded"
                      />
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => openModal(producto)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleEliminar(producto.producto_id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500">
                  No se encontraron productos con los filtros aplicados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <div>
            <span className="text-sm text-gray-700">
              Mostrando {(pagination.page - 1) * pagination.limit + 1} a{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
              {pagination.total} productos
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

export default TablaProductos;