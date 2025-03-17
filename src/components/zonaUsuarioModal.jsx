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
              <div className="flex items-center gap-3 cursor-pointer hover:text-blue-600">
                <User size={20} /> Mi cuenta
              </div>
              <div className="flex items-center gap-3 cursor-pointer hover:text-blue-600">
                <Package size={20} /> Mis pedidos
              </div>
              <div className="flex items-center gap-3 cursor-pointer hover:text-blue-600">
                <Mail size={20} /> Contacto
              </div>
              <div className="flex items-center gap-3 cursor-pointer hover:text-blue-600">
                <Settings size={20} /> Mi perfil
              </div>
            </nav>

            <hr className="my-4" />

            <div className="flex items-center gap-3 cursor-pointer text-red-500 hover:text-red-700">
              <LogOut size={20} /> Cerrar sesión
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
