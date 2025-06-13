import React, { useState, useEffect } from 'react';

const ConfirmarData = () => {
  const [cliente, setCliente] = useState(null);
  const [direccionSeleccionada, setDireccionSeleccionada] = useState(null);
  const [tarjetaSeleccionada, setTarjetaSeleccionada] = useState(null);
  const [aceptaPoliticas, setAceptaPoliticas] = useState(false);
  const [errores, setErrores] = useState({});
  const [intentoEnvio, setIntentoEnvio] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await fetch(`/api/datos-cliente`, {
          method: 'GET',
          credentials: "include",
        });
        if (!res.ok) throw new Error("Error al obtener datos del cliente");

        const data = await res.json();
        setCliente({ ...data });

        if (data.direcciones.length > 0) {
          setDireccionSeleccionada({ ...data.direcciones[0] });
        }

        if (data.tarjetas.length > 0) {
          setTarjetaSeleccionada({ ...data.tarjetas[0] });
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchUserData();
  }, []);

  const validarCampos = () => {
    const nuevosErrores = {};
    
    if (!cliente?.nombre?.trim()) nuevosErrores.nombre = 'Nombre es obligatorio';
    if (!cliente?.apellidos?.trim()) nuevosErrores.apellidos = 'Apellidos son obligatorios';
    if (!cliente?.telefono?.trim()) nuevosErrores.telefono = 'Teléfono es obligatorio';
    if (!cliente?.email?.trim()) nuevosErrores.email = 'Email es obligatorio';
    
    if (!direccionSeleccionada?.calle?.trim()) nuevosErrores.calle = 'Calle es obligatoria';
    if (!direccionSeleccionada?.ciudad?.trim()) nuevosErrores.ciudad = 'Ciudad es obligatoria';
    if (!direccionSeleccionada?.cod_postal?.trim()) nuevosErrores.cod_postal = 'Código postal es obligatorio';
    if (!direccionSeleccionada?.pais?.trim()) nuevosErrores.pais = 'País es obligatorio';
    
    if (tarjetaSeleccionada) {
      if (!tarjetaSeleccionada?.numero?.trim()) nuevosErrores.numeroTarjeta = 'Número de tarjeta es obligatorio';
      if (!tarjetaSeleccionada?.titular?.trim()) nuevosErrores.titularTarjeta = 'Titular es obligatorio';
      if (!tarjetaSeleccionada?.vencimiento?.trim()) nuevosErrores.vencimiento = 'Fecha vencimiento es obligatoria';
      if (!tarjetaSeleccionada?.cvv?.trim()) nuevosErrores.cvv = 'CVV es obligatorio';
    }
    
    if (!aceptaPoliticas) nuevosErrores.politicas = 'Debes aceptar las políticas';
    
    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleDireccionChange = async (e) => {
    const selectedId = parseInt(e.target.value);
    const dir = cliente?.direcciones.find((d) => d.direccion_id === selectedId);
    setDireccionSeleccionada({ ...dir });
  };

  const handleTarjetaChange = async (e) => {
    const selectedId = parseInt(e.target.value);
    const tarjeta = cliente?.tarjetas.find((t) => t.tarjeta_id === selectedId);
    setTarjetaSeleccionada({ ...tarjeta });
  };

  const handleClienteChange = async (e) => {
    const { name, value } = e.target;
    setCliente((prev) => ({ ...prev, [name]: value }));
  };

  const handleDireccionEdit = async (e) => {
    const { name, value } = e.target;
    setDireccionSeleccionada((prev) => ({ ...prev, [name]: value }));
  };

  const handleTarjetaEdit = async (e) => {
    const { name, value } = e.target;
    setTarjetaSeleccionada((prev) => ({ ...prev, [name]: value }));
  };

  const handleNuevaTarjeta = () => {
    const nueva = {
      tarjeta_id: null,
      numero: "",
      titular: "",
      vencimiento: "",
      cvv: "",
      cliente_id: cliente.cliente_id,
    };
    setTarjetaSeleccionada(nueva);
  };

  const handleNuevaDireccion = () => {
    const nueva = {
      direccion_id: null,
      calle: "",
      numero: "",
      piso: "",
      ciudad: "",
      cod_postal: "",
      pais: "",
      cliente_id: cliente.cliente_id,
    };
    setDireccionSeleccionada(nueva);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();

    setIntentoEnvio(true);
    
    if (!validarCampos()) {
      return;
    }

    try {
      const metodoDireccion = direccionSeleccionada.direccion_id ? "PUT" : "POST";
      const endpointDireccion = direccionSeleccionada.direccion_id
        ? `/api/direccion/${direccionSeleccionada.direccion_id}`
        : `/api/direccion`;

      const resDireccion = await fetch(endpointDireccion, {
        method: metodoDireccion,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(direccionSeleccionada),
      });

      if (!resDireccion.ok) throw new Error("Error al guardar la dirección");

      const datosCliente = {
        nombre: cliente.nombre,
        apellidos: cliente.apellidos,
        telefono: cliente.telefono,
        email: cliente.email,
      };

      const resCliente = await fetch(`/api/clientes/${cliente.cliente_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(datosCliente),
      });

      if (!resCliente.ok) throw new Error("Error al actualizar datos del cliente");

      if (tarjetaSeleccionada) {
        const metodo = tarjetaSeleccionada.tarjeta_id ? "PUT" : "POST";
        const endpoint = tarjetaSeleccionada.tarjeta_id
          ? `/api/tarjeta/${tarjetaSeleccionada.tarjeta_id}`
          : `/api/tarjeta`;

        const resTarjeta = await fetch(endpoint, {
          method: metodo,
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(tarjetaSeleccionada),
        });

        if (!resTarjeta.ok) {
          throw new Error("Error al guardar la tarjeta");
        }

        console.log("Tarjeta guardada:", tarjetaSeleccionada);
      }

      const resPedido = await fetch(`/api/confirmar-pago`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(direccionSeleccionada),
      });

      if (!resPedido.ok) throw new Error("Error al confirmar el pedido");

      const pedidoConfirmado = await resPedido.json();
      console.log("Pedido confirmado:", pedidoConfirmado);

      window.location.href = '/pedido-confirmado';
    } catch (err) {
      console.error(err);
    }
  };

  if (!cliente) {
    return <p className="text-center">Cargando datos del cliente...</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto bg-white shadow-lg rounded-2xl p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Dirección de envío</h2>

      <label className="block mb-2 text-sm font-medium text-gray-700">Selecciona una dirección</label>
      <select
        className="w-full p-2 mb-4 border border-gray-300 rounded-lg"
        onChange={handleDireccionChange}
        value={direccionSeleccionada.direccion_id || ""}
      >
        {cliente.direcciones.map((dir) => (
          <option key={dir.direccion_id} value={dir.direccion_id}>
            {dir.calle}, {dir.numero || ""} {dir.piso || ""}, {dir.ciudad}
          </option>
        ))}
      </select>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Calle*</label>
          <input 
            type="text" 
            name="calle" 
            value={direccionSeleccionada.calle} 
            onChange={handleDireccionEdit} 
            className={`w-full p-2 border ${errores.calle ? 'border-red-500' : 'border-gray-300'} rounded-lg`} 
          />
          {errores.calle && <p className="text-red-500 text-xs mt-1">{errores.calle}</p>}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Número</label>
            <input 
              type="text" 
              name="numero" 
              value={direccionSeleccionada.numero || ""} 
              onChange={handleDireccionEdit} 
              className="w-full p-2 border border-gray-300 rounded-lg" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Piso</label>
            <input 
              type="text" 
              name="piso" 
              value={direccionSeleccionada.piso || ""} 
              onChange={handleDireccionEdit} 
              className="w-full p-2 border border-gray-300 rounded-lg" 
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Ciudad*</label>
            <input 
              type="text" 
              name="ciudad" 
              value={direccionSeleccionada.ciudad} 
              onChange={handleDireccionEdit} 
              className={`w-full p-2 border ${errores.ciudad ? 'border-red-500' : 'border-gray-300'} rounded-lg`} 
            />
            {errores.ciudad && <p className="text-red-500 text-xs mt-1">{errores.ciudad}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Código Postal*</label>
            <input 
              type="text" 
              name="cod_postal" 
              value={direccionSeleccionada.cod_postal} 
              onChange={handleDireccionEdit} 
              className={`w-full p-2 border ${errores.cod_postal ? 'border-red-500' : 'border-gray-300'} rounded-lg`} 
            />
            {errores.cod_postal && <p className="text-red-500 text-xs mt-1">{errores.cod_postal}</p>}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">País*</label>
          <input 
            type="text" 
            name="pais" 
            value={direccionSeleccionada.pais} 
            onChange={handleDireccionEdit} 
            className={`w-full p-2 border ${errores.pais ? 'border-red-500' : 'border-gray-300'} rounded-lg`} 
          />
          {errores.pais && <p className="text-red-500 text-xs mt-1">{errores.pais}</p>}
        </div>
      </div>

      <button type="button" onClick={handleNuevaDireccion} className="mt-4 text-blue-600 hover:underline">
        Añadir nueva dirección
      </button>

      <div className="mt-8 space-y-4 border-t pt-6">
        <h3 className="text-xl font-semibold text-gray-800">Datos del cliente</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre*</label>
            <input 
              type="text" 
              name="nombre" 
              value={cliente.nombre} 
              onChange={handleClienteChange} 
              className={`w-full p-2 border ${errores.nombre ? 'border-red-500' : 'border-gray-300'} rounded-lg`} 
            />
            {errores.nombre && <p className="text-red-500 text-xs mt-1">{errores.nombre}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Apellidos*</label>
            <input 
              type="text" 
              name="apellidos" 
              value={cliente.apellidos} 
              onChange={handleClienteChange} 
              className={`w-full p-2 border ${errores.apellidos ? 'border-red-500' : 'border-gray-300'} rounded-lg`} 
            />
            {errores.apellidos && <p className="text-red-500 text-xs mt-1">{errores.apellidos}</p>}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Teléfono*</label>
            <input 
              type="text" 
              name="telefono" 
              value={cliente.telefono} 
              onChange={handleClienteChange} 
              className={`w-full p-2 border ${errores.telefono ? 'border-red-500' : 'border-gray-300'} rounded-lg`} 
            />
            {errores.telefono && <p className="text-red-500 text-xs mt-1">{errores.telefono}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email*</label>
            <input 
              type="email" 
              name="email" 
              value={cliente.email} 
              onChange={handleClienteChange} 
              className={`w-full p-2 border ${errores.email ? 'border-red-500' : 'border-gray-300'} rounded-lg`} 
            />
            {errores.email && <p className="text-red-500 text-xs mt-1">{errores.email}</p>}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">DNI</label>
          <input 
            type="text" 
            name="dni" 
            value={cliente.dni || ""} 
            onChange={handleClienteChange} 
            className="w-full p-2 border border-gray-300 rounded-lg" 
          />
        </div>
      </div>

      <div className="mt-8 space-y-4 border-t pt-6">
        <h3 className="text-xl font-semibold text-gray-800">Tarjeta de crédito</h3>

        <label className="block mb-2 text-sm font-medium text-gray-700">Selecciona una tarjeta</label>
        <select
          className="w-full p-2 mb-4 border border-gray-300 rounded-lg"
          onChange={handleTarjetaChange}
          value={tarjetaSeleccionada?.tarjeta_id || ""}
        >
          {cliente.tarjetas.map((tarjeta) => (
            <option key={tarjeta.tarjeta_id} value={tarjeta.tarjeta_id}>
              **** {tarjeta.numero.slice(-4)} - {tarjeta.titular}
            </option>
          ))}
        </select>

        {tarjetaSeleccionada && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Número*</label>
              <input 
                type="text" 
                name="numero" 
                value={tarjetaSeleccionada.numero} 
                onChange={handleTarjetaEdit} 
                className={`w-full p-2 border ${errores.numeroTarjeta ? 'border-red-500' : 'border-gray-300'} rounded-lg`} 
              />
              {errores.numeroTarjeta && <p className="text-red-500 text-xs mt-1">{errores.numeroTarjeta}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Titular*</label>
              <input 
                type="text" 
                name="titular" 
                value={tarjetaSeleccionada.titular} 
                onChange={handleTarjetaEdit} 
                className={`w-full p-2 border ${errores.titularTarjeta ? 'border-red-500' : 'border-gray-300'} rounded-lg`} 
              />
              {errores.titularTarjeta && <p className="text-red-500 text-xs mt-1">{errores.titularTarjeta}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Vencimiento*</label>
                <input 
                  type="text" 
                  name="vencimiento" 
                  value={tarjetaSeleccionada.vencimiento} 
                  onChange={handleTarjetaEdit} 
                  className={`w-full p-2 border ${errores.vencimiento ? 'border-red-500' : 'border-gray-300'} rounded-lg`} 
                />
                {errores.vencimiento && <p className="text-red-500 text-xs mt-1">{errores.vencimiento}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">CVV*</label>
                <input 
                  type="text" 
                  name="cvv" 
                  value={tarjetaSeleccionada.cvv} 
                  onChange={handleTarjetaEdit} 
                  className={`w-full p-2 border ${errores.cvv ? 'border-red-500' : 'border-gray-300'} rounded-lg`} 
                />
                {errores.cvv && <p className="text-red-500 text-xs mt-1">{errores.cvv}</p>}
              </div>
            </div>
          </div>
        )}
        <button type="button" onClick={handleNuevaTarjeta} className="mt-4 text-blue-600 hover:underline">
          Añadir nueva tarjeta
        </button>
      </div>

      <div className="mt-6 border-t pt-4">
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="politicas"
              name="politicas"
              type="checkbox"
              checked={aceptaPoliticas}
              onChange={() => setAceptaPoliticas(!aceptaPoliticas)}
              className={`focus:ring-blue-500 h-4 w-4 ${errores.politicas ? 'text-red-500 border-red-500' : 'text-blue-600 border-gray-300'} rounded`}
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="politicas" className="font-medium text-gray-700">
              Acepto las <a href="/envios" className="text-blue-600 hover:underline">políticas de envío y devoluciones</a>*
            </label>
            {errores.politicas && <p className="text-red-500 text-xs mt-1">{errores.politicas}</p>}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <button 
          type="submit" 
          className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700"
        >
          Confirmar y pagar
        </button>
      </div>
    </form>
  );
};

export default ConfirmarData;