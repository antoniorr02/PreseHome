import React, { useState } from 'react';

const Star = ({ starId, marked, onMouseEnter, onMouseLeave, onClick }) => (
  <span
    className={`cursor-pointer text-2xl ${marked ? 'text-yellow-400' : 'text-gray-300'}`}
    onMouseEnter={() => onMouseEnter(starId)}
    onMouseLeave={onMouseLeave}
    onClick={() => onClick(starId)}
  >
    ★
  </span>
);

const FormEditarReview = ({ review, onSubmit }) => {
  const [rating, setRating] = useState(review?.calificacion || 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState(review?.comentario || '');

  const handleSubmitReview = async (e) => {
    e.preventDefault();
  
    if (rating === 0) {
      alert('Debes seleccionar una puntuación.');
      return;
    }
  
    const updatedReview = {
      calificacion: rating,
      comentario: comment.trim(),
    };
  
    try {
      const res = await fetch(`http://localhost/reviews/${review.reseña_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedReview),
      });
  
      if (!res.ok) {
        throw new Error('Error al actualizar la reseña');
      }
  
      const data = await res.json();
      onSubmit({ ...updatedReview, reseña_id: review.reseña_id });
      window.location.href = "/pedidos";
    } catch (err) {
      console.error(err);
      alert('Ocurrió un error al guardar la reseña.');
    }
  };  

  return (
    <>
      <h2 className="text-2xl font-semibold text-center mb-6 text-gray-700">Editar reseña</h2>
      <form onSubmit={handleSubmitReview} className="flex flex-col gap-4">
        <div className="mt-6 border-t pt-4">
          <h3 className="text-lg font-bold mb-2">Valorar producto</h3>

          <div className="flex space-x-1 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                starId={star}
                marked={hoverRating ? star <= hoverRating : star <= rating}
                onMouseEnter={setHoverRating}
                onMouseLeave={() => setHoverRating(0)}
                onClick={setRating}
              />
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

          <div className="flex justify-center">
            <button
                type="submit"
                disabled={rating === 0}
                className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors disabled:bg-gray-300"
            >
                Guardar cambios
            </button>
          </div>
        </div>
      </form>
    </>
  );
};

export default FormEditarReview;
