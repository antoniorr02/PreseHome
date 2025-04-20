import React, { useState } from 'react';

const FormNuevaDireccion = ({ userData, onSubmit }) => {

  const [form, setForm] = useState({
    calle: userData?.calle ||'',
    numero: userData?.numero ||'',
    piso: userData?.piso ||'',
    ciudad: userData?.ciudad ||'',
    cod_postal: userData?.cod_postal ||'',
    pais: userData?.pais ||'',
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...form, cliente_id: userData?.cliente_id });
  };

  return (
    <>
        <h2 className="text-2xl font-semibold text-center mb-6 text-gray-700">
            Añadir dirección
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
            type="text"
            name="calle"
            placeholder="Calle"
            value={form.calle}
            onChange={handleChange}
            required
            className="border border-gray-300 rounded-full p-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <input
            type="number"
            name="numero"
            placeholder="Número"
            value={form.numero}
            onChange={handleChange}
            className="border border-gray-300 rounded-full p-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <input
            type="text"
            name="piso"
            placeholder="Piso (opcional)"
            value={form.piso}
            onChange={handleChange}
            className="border border-gray-300 rounded-full p-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <input
            type="text"
            name="ciudad"
            placeholder="Ciudad"
            value={form.ciudad}
            onChange={handleChange}
            required
            className="border border-gray-300 rounded-full p-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <input
            type="text"
            name="cod_postal"
            placeholder="Código postal"
            value={form.cod_postal}
            onChange={handleChange}
            required
            className="border border-gray-300 rounded-full p-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <input
            type="text"
            name="pais"
            placeholder="País"
            value={form.pais}
            onChange={handleChange}
            required
            className="border border-gray-300 rounded-full p-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
            type="submit"
            className="bg-red-600 hover:bg-red-700 text-white font-medium p-3 rounded-full transition duration-300"
            >
            Guardar dirección
            </button>
        </form>
    </>
  );
};

export default FormNuevaDireccion;
