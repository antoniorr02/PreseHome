import React, { useState } from 'react';

const FormEditarTelefono = ({ userData, onSubmit }) => {
  const [form, setForm] = useState({
    telefono: userData?.telefono || '',
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const telefono = form.telefono.trim();
    if (telefono !== '' && !/^(6|7|8|9)\d{8}$/.test(telefono)) {
      alert('Por favor, introduce un número de teléfono válido de España.');
      return;
    }
    onSubmit({ ...form, cliente_id: userData?.cliente_id });
  };

  return (
    <>
      <h2 className="text-2xl font-semibold text-center mb-6 text-gray-700">Editar telefono</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          name="telefono"
          placeholder="Telefono"
          value={form.telefono}
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

export default FormEditarTelefono;
