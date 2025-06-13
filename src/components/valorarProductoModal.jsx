import React, { useState } from 'react';

const Star = ({ starId, marked }) => {
  return (
    <button
      type="button"
      className={`text-2xl ${marked ? 'text-yellow-400' : 'text-gray-300'}`}
    >
      ★
    </button>
  );
};

const ValorarProductoModal = ({ isOpen, onClose, product }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");

  const handleSubmitReview = async () => {
    try {
      const res = await fetch(`/api/reseñas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
          producto_id: product.producto_id,
          calificacion: rating,
          comentario: comment
        })
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Error al enviar reseña:", data.error || "Error desconocido");
        return;
      }

      alert("¡Gracias por tu reseña!");
      setRating(0);
      setHoverRating(0);
      setComment("");
      onClose();
    } catch (error) {
      console.error("Error al enviar reseña:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Valorar {product.nombre}</h2>
        
        <div className="flex space-x-1 mb-4">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              className={`text-2xl ${(hoverRating || rating) >= star ? 'text-yellow-400' : 'text-gray-300'}`}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
            >
              ★
            </button>
          ))}
        </div>

        <label className="block mb-2 font-medium">
          Comentario (opcional):
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="block w-full mt-1 border rounded-md px-2 py-1"
            rows={3}
          />
        </label>

        <div className="flex justify-end space-x-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-md hover:bg-gray-100"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmitReview}
            disabled={rating === 0}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors disabled:bg-gray-300"
          >
            Enviar reseña
          </button>
        </div>
      </div>
    </div>
  );
};

export default ValorarProductoModal;