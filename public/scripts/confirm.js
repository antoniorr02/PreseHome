document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    const confirmarBtn = document.getElementById('confirmar-btn');

    confirmarBtn.addEventListener('click', async () => {
        try {
            const response = await fetch('http://localhost:5000/confirmar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token }),
            });

            const data = await response.json();

            if (data.success) {
                window.location.href = `/identificate`;
            } else {
                alert(`No se pudo confirmar la cuenta: ${data.error || 'Error desconocido'}`);
            }
        } catch (error) {
            console.error('Error al confirmar la cuenta:', error);
            alert(`Hubo un error al intentar confirmar la cuenta: ${error.message}`);
        }
    });
});