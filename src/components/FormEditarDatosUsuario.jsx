import React, { useState } from 'react';

const FormEditarDatosUsuario = ({ userData, onSubmit }) => {
  const [form, setForm] = useState({
    nombre: userData?.nombre || '',
    apellidos: userData?.apellidos || '',
    dni: userData?.dni || '',
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
      <h2 className="text-2xl font-semibold text-center mb-6 text-gray-700">Editar información personal</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          name="nombre"
          placeholder="Nombre"
          value={form.nombre}
          onChange={handleChange}
          className="border border-gray-300 rounded-full p-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <input
          type="text"
          name="apellidos"
          placeholder="Apellidos"
          value={form.apellidos}
          onChange={handleChange}
          className="border border-gray-300 rounded-full p-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <input
          type="text"
          name="dni"
          placeholder="DNI"
          value={form.dni}
          onChange={handleChange}
          className="border border-gray-300 rounded-full p-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          type="submit"
          className="bg-red-600 hover:bg-red-700 text-white font-medium p-3 rounded-full transition duration-300"
        >
          Guardar cambios
        </button>
      </form>
    </>
  );
};

export default FormEditarDatosUsuario;
