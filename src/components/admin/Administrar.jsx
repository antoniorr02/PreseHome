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

const dummyData = {
  semana: [
    { dia: 'Lun', ingresos: 400 },
    { dia: 'Mar', ingresos: 300 },
    { dia: 'Mié', ingresos: 500 },
    { dia: 'Jue', ingresos: 700 },
    { dia: 'Vie', ingresos: 600 },
    { dia: 'Sáb', ingresos: 900 },
    { dia: 'Dom', ingresos: 1000 },
  ],
  mes: [
    { semana: '1ª', ingresos: 2000 },
    { semana: '2ª', ingresos: 2400 },
    { semana: '3ª', ingresos: 1500 },
    { semana: '4ª', ingresos: 3000 },
  ],
  semestre: [
    { mes: 'Ene', ingresos: 1200 },
    { mes: 'Feb', ingresos: 1800 },
    { mes: 'Mar', ingresos: 2500 },
    { mes: 'Abr', ingresos: 2100 },
    { mes: 'May', ingresos: 3200 },
    { mes: 'Jun', ingresos: 2800 },
  ],
};

export default function Administrar() {
  const [periodo, setPeriodo] = useState('semana');
  const [datos, setDatos] = useState(dummyData['semana']);

  useEffect(() => {
    // METER fetch dinámico aL backend con el periodo

    setDatos(dummyData[periodo]);
  }, [periodo]);

  const items = [
    { title: 'Gestión de clientes', link: '/admin/clientes' },
    { title: 'Gestión de categoría', link: '/admin/categorias' },
    { title: 'Gestión de productos', link: '/admin/productos' },
    { title: 'Gestión de pedidos', link: '/admin/pedidos' },
    { title: 'Gestión de devoluciones', link: '/admin/devoluciones' },
  ];

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
            <option value="mes">Este mes</option>
            <option value="semestre">Últimos 6 meses</option>
          </select>
        </div>

        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={datos}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={periodo === 'semestre' ? 'mes' : periodo === 'mes' ? 'semana' : 'dia'} />
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
