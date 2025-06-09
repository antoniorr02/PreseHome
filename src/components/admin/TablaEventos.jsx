import { useEffect, useState } from 'react';

export default function TablaEventos() {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch('http://localhost:5000/logs', {
          credentials: 'include',
        });
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        setLogs(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();
  }, []);

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600 font-medium">Error al cargar los logs</p>
        <p className="text-red-500 text-sm mt-1">{error}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mr-3"></div>
        <span className="text-gray-600">Cargando logs...</span>
      </div>
    );
  }

  if (!logs.length) {
    return (
      <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-lg">
        No hay registros de logs disponibles
      </div>
    );
  }

  return (
    <div className="overflow-auto border rounded-lg shadow-sm">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Fecha
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Nivel
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Mensaje
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {logs.map((log, idx) => (
            <tr 
              key={`${log.time}-${idx}`} 
              className={`hover:bg-gray-50 ${
                log.level === 'error' ? 'bg-red-50' : 
                log.level === 'warn' ? 'bg-yellow-50' : ''
              }`}
            >
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {new Date(log.time).toLocaleString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  log.level === 'error' ? 'bg-red-100 text-red-800' :
                  log.level === 'warn' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {log.level}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-900 break-all">
                {log.msg || log.raw}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}