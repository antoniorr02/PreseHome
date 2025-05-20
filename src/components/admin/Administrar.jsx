import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

export default function Administrar() {
  const [periodo, setPeriodo] = useState('semana'); // Changed from 'dia' to 'semana'
  const [datos, setDatos] = useState([]);

  useEffect(() => {
    fetch(`http://localhost:5000/ingresos?periodo=${periodo}`, {
        credentials: 'include',
    })
    .then((res) => res.json())
    .then((data) => {
        setDatos(data);
    })
    .catch(() => setDatos([]));
  }, [periodo]);

  const items = [
    { title: 'Gestión de clientes', link: '/clientes' },
    { title: 'Gestión de categoría', link: '/gestion-categorias' },
    { title: 'Gestión de productos', link: '/admin/productos' },
    { title: 'Gestión de pedidos', link: '/admin/pedidos' },
    { title: 'Gestión de devoluciones', link: '/admin/devoluciones' },
    { title: 'Añadir nuevo administrador', link: '/nuevo-admin' },
  ];

  // Determine the data key based on the selected period
  const getDataKey = () => {
    switch(periodo) {
      case 'semestre': return 'mes';
      case 'mes': return 'semana';
      case 'semana': return 'fecha';
      default: return 'fecha';
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Cuadro de Ingresos */}
      <div className="bg-white shadow-lg rounded-2xl p-6 col-span-1 sm:col-span-2 lg:col-span-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <h2 className="text-xl font-semibold">Ingresos</h2>
          <select
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className="mt-2 sm:mt-0 border rounded-md p-2"
          >
            <option value="semana">Últimos 7 días</option>
            <option value="mes">Este mes (por semanas)</option>
            <option value="semestre">Últimos 6 meses</option>
          </select>
        </div>

        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={datos}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={getDataKey()} />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="ingresos"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cuadros de gestión */}
      {items.map((item) => (
        <a
          key={item.title}
          href={item.link}
          className="bg-white shadow-lg rounded-2xl p-6 flex items-center justify-center text-xl font-semibold text-center hover:bg-gray-100 transition"
        >
          {item.title}
        </a>
      ))}
    </div>
  );
}