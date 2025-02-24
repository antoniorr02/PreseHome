import { useState, useEffect } from 'react';

const API_URL = 'http://localhost:5000/categorias';

export default function Categorias() {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const response = await fetch(API_URL);
        const data = await response.json();
        setCategorias(data);
        setLoading(false);
      } catch (error) {
        console.error('Error al obtener las categorías:', error);
        setLoading(false);
      }
    };

    fetchCategorias();
  }, []);

  return (
    <div className="seasonal-products">
      <h2 className="text-center text-3xl font-bold my-8">Nuestras categorías</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {loading ? (
          <p>Cargando categorías...</p>
        ) : (
          categorias.length > 0 ? (
            categorias.map((categoria) => (
              <div key={categoria.categoria_id} className="product-card">
                <img 
                  src={`/assets/categorias/${categoria.nombre.toLowerCase()}.jpg`} 
                  alt={categoria.nombre} 
                  className="w-full h-48 object-cover rounded-lg shadow-lg" 
                />
                <h3 className="text-xl mt-4">{categoria.nombre}</h3>
              </div>
            ))
          ) : (
            <p>No se encontraron categorías.</p>
          )
        )}
      </div>
    </div>
  );
}