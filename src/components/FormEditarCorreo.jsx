import React, { useState } from 'react';

const FormEditarCorreo = ({ userData, onSubmit }) => {
  const [form, setForm] = useState({
    email: userData?.email || '',
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
      <h2 className="text-2xl font-semibold text-center mb-6 text-gray-700">Editar correo electrónico</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          name="email"
          placeholder="Correo electrónico"
          value={form.email}
          onChange={handleChange}
          className="border border-gray-300 rounded-full p-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <p className='text-center text-red-600'>Si continuas deberás verificar tu correo desde tu bandeja de entrada en un plazo de 24 horas o tu cuenta será eliminada</p>
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

export default FormEditarCorreo;
