import React, { useState, useEffect } from 'react';
import FormEdiccionModal from './FormEdiccionModal';
import FormEditarDatosUsuario from './FormEditarDatosUsuario';
import FormEditarCorreo from './FormEditarCorreo';
import FormEditarTelefono from './FormEditarTelefono';
import FormNuevaDireccion from './FormNuevaDireccion';

const UserProfile = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [activeSection, setActiveSection] = useState('profile');
  const [isEditarDatos, setEditarDatos] = useState(false);
  const [isEditarCorreo, setEditarCorreo] = useState(false);
  const [isEditarTelefono, setEditarTelefono] = useState(false);
  const [isEditarDireccion, setEditarDireccion] = useState(false);

  const handleUpdate = async (updatedData) => {
    try {
      const res = await fetch(`http://localhost:5000/clientes/${updatedData.cliente_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updatedData),
      });
      console.log('Actualizando con datos:', updatedData);

  
      if (res.ok) {
        const updatedUser = await res.json();
        setUserData(updatedUser);
        if (isEditarDatos)
          setEditarDatos(false);
        else if (isEditarTelefono) 
          setEditarTelefono(false);
        else if (isEditarDireccion) 
          setEditarDireccion(false);
        else if (isEditarCorreo) {
          setEditarCorreo(false);
          window.location.href = "/confirmacion";
        }
      } else {
        console.error('Error al actualizar datos');
        const errorData = await res.json();
  console.error('Error al actualizar datos:', errorData);
  return;
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('http://localhost:5000/datos-cliente', {
          method: 'GET',
          credentials: 'include', // Mando las cookies
        });
        if (response.ok) {
          const data = await response.json();
          setUserData(data);
        } else {
          console.error('Error al obtener los datos');
        }
      } catch (error) {
        console.error('Error al hacer la solicitud:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  const handleEliminarDireccion = (direccionId) => {
    // Lógica para eliminar la dirección
    console.log(`Eliminando dirección con ID: ${direccionId}`);
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-gray-400 p-4 rounded-lg">
              <h2 className="font-semibold">Información personal</h2>
              <p className="text-gray-700">{userData?.nombre || 'Cargando...'}</p>
              <p className="text-gray-700">{userData?.apellidos || 'Cargando...'}</p>
              <p className="text-gray-700">{userData?.dni}</p>
              <a href="#" onClick={() => setEditarDatos(true)} className="text-blue-600 font-semibold hover:underline">Editar</a>
            </div>

            <div className="border border-gray-400 p-4 rounded-lg">
              <h2 className="font-semibold">Dirección de correo electrónico</h2>
              <p className="text-gray-700">{userData?.email || 'Cargando...'}</p>
              <a href="#" onClick={() => setEditarCorreo(true)} className="text-blue-600 font-semibold hover:underline">Cambiar la dirección de correo electrónico</a>
              <h2 className="font-semibold">Teléfono</h2>
              <p className="text-gray-700">{userData?.telefono}</p>
              <a href="#" onClick={() => setEditarTelefono(true)} className="text-blue-600 font-semibold hover:underline">Cambiar o añadir número de teléfono</a>
            </div>

            <div className="border border-gray-400 p-4 rounded-lg">
              <h2 className="font-semibold">Contraseña</h2>
              <p className="text-gray-700">**********</p>
              <a href="/recuperar" className="text-blue-600 font-semibold hover:underline">Cambiar contraseña</a>
            </div>
            <FormEdiccionModal isOpen={isEditarDatos} onClose={() => setEditarDatos(false)}>
              <FormEditarDatosUsuario userData={userData} onSubmit={handleUpdate} />
            </FormEdiccionModal>
            <FormEdiccionModal isOpen={isEditarCorreo} onClose={() => setEditarCorreo(false)}>
              <FormEditarCorreo userData={userData} onSubmit={handleUpdate} />
            </FormEdiccionModal>
            <FormEdiccionModal isOpen={isEditarTelefono} onClose={() => setEditarTelefono(false)}>
              <FormEditarTelefono userData={userData} onSubmit={handleUpdate} />
            </FormEdiccionModal>
          </div>
        );
        case 'addresses':
          return (
            <div className="border border-gray-400 p-4 rounded-lg">
              <h2 className="font-semibold">Libreta de direcciones</h2>
              <p className="text-gray-700">Aquí podrás gestionar tus direcciones.</p>
              <ul className="mt-4 space-y-4">
                {userData?.direcciones?.length > 0 ? (
                  userData.direcciones.map((dir) => (
                    <li
                      key={dir.direccion_id}
                      className="border border-gray-400 p-4 rounded-lg flex justify-between items-center bg-gray-100"
                    >
                      <div className="text-gray-700">
                        <div>{dir.calle} {dir.numero}, {dir.piso}</div>
                        <div>{dir.ciudad}, {dir.cod_postal}</div>
                        <div>{dir.pais}</div>
                      </div>
                      <button
                        className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition-colors"
                        onClick={() => handleEliminarDireccion(dir.direccion_id)}
                      >
                        Eliminar
                      </button>
                    </li>
                  ))
                ) : (
                  <p className="text-gray-600">No tienes direcciones guardadas.</p>
                )}
              </ul>
              <a href="#" onClick={() => setEditarDireccion(true)} className="text-blue-600 font-semibold mt-4 inline-block hover:underline">Añadir dirección</a>
              <FormEdiccionModal isOpen={isEditarDireccion} onClose={() => setEditarDireccion(false)}>
                <FormNuevaDireccion userData={userData} onSubmit={handleUpdate} />
              </FormEdiccionModal>
              </div>
          );        
      case 'paymentMethods':
        return (
          <div className="border border-gray-400 p-4 rounded-lg">
            <h2 className="font-semibold">Métodos de pago</h2>
            <p className="text-gray-700">Aquí podrás añadir o editar tus métodos de pago.</p>
            {/* Aquí iría el formulario para añadir o editar métodos de pago */}
          </div>
        );
      default:
        return <div>Sección no encontrada</div>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-semibold">Mi perfil</h1>
      <p className="text-gray-600">Aquí puedes añadir o editar tus datos personales.</p>

      <div className="border-b border-gray-400 flex space-x-6 mb-6">
        <button
          className={`py-2 px-4 font-semibold ${activeSection === 'profile' ? 'border-b-2 border-black' : 'text-gray-600'}`}
          onClick={() => setActiveSection('profile')}
        >
          Perfil
        </button>
        <button
          className={`py-2 px-4 font-semibold ${activeSection === 'addresses' ? 'border-b-2 border-black' : 'text-gray-600'}`}
          onClick={() => setActiveSection('addresses')}
        >
          Libreta de direcciones
        </button>
        <button
          className={`py-2 px-4 font-semibold ${activeSection === 'paymentMethods' ? 'border-b-2 border-black' : 'text-gray-600'}`}
          onClick={() => setActiveSection('paymentMethods')}
        >
          Métodos de pago
        </button>
      </div>

      {/* Aquí se renderiza la sección activa */}
      {renderSection()}
    </div>
  );
};

export default UserProfile;
