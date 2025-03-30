import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Package, Mail, Settings, LogOut } from "lucide-react";

export default function UserSidebar() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const openModal = () => {
      setIsOpen(true);
    };

    document.addEventListener("openUserModal", openModal);

    return () => {
      document.removeEventListener("openUserModal", openModal);
    };
  }, []);

  const handleLogout = async (e) => {
    e.preventDefault(); // Evita la recarga de la página

    try {
      const response = await fetch("http://localhost:5000/logout", {
        method: "POST",
        credentials: "include", // Para enviar cookies con la solicitud
      });

      if (response.ok) {
        console.log("Sesión cerrada");
        setIsOpen(false);
        window.location.href = "/"; // Redirigir a la página de inicio
      } else {
        console.error("Error al cerrar sesión");
      }
    } catch (error) {
      console.error("Error en la petición de logout", error);
    }
  };

  return (
    <div>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50"
          onClick={() => setIsOpen(false)}
        >
          <motion.div
            initial={{ x: +300 }}
            animate={{ x: 0 }}
            exit={{ x: +300 }}
            transition={{ duration: 0.3 }}
            className="fixed right-0 top-0 h-full w-64 bg-white shadow-lg p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-4">Mi cuenta:</h2>
            <p className="text-gray-700 mb-6">Nombre y Apellidos</p>

            <nav className="space-y-4">
              <a
                href="/perfil"
                className="flex items-center gap-3 cursor-pointer hover:text-blue-600"
                onClick={() => setIsOpen(false)}
              >
                <User size={20} /> Mi perfil
              </a>
              <a
                href="/mis-pedidos"
                className="flex items-center gap-3 cursor-pointer hover:text-blue-600"
                onClick={() => setIsOpen(false)}
              >
                <Package size={20} /> Mis pedidos
              </a>
              <a
                href="/contacto"
                className="flex items-center gap-3 cursor-pointer hover:text-blue-600"
                onClick={() => setIsOpen(false)}
              >
                <Mail size={20} /> Contacto
              </a>
            </nav>

            <hr className="my-4" />

            <a
              href="#"
              className="flex items-center gap-3 cursor-pointer text-red-500 hover:text-red-700"
              onClick={handleLogout}
            >
              <LogOut size={20} /> Cerrar sesión
            </a>
          </motion.div>
        </div>
      )}
    </div>
  );
}
