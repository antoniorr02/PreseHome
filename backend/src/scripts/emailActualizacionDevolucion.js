import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export async function emailActualizacionDevolucion(email, datosDevolucion) {
    const estadosTraducidos = {
        'solicitada': 'Solicitada',
        'devolución': 'Aceptada',
        'devuelto': 'Completada',
    };

    const estadoTraducido = estadosTraducidos[datosDevolucion.estado] || datosDevolucion.estado;
    
    const mailOptions = {
        from: `"PreseHome" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `Actualización de tu devolución - Pedido #${datosDevolucion.numeroPedido}`,
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h1 style="color: #2c3e50;">Estado de tu devolución actualizado</h1>
                <p>Hola ${datosDevolucion.nombreCliente},</p>
                <p>El estado de tu devolución para el producto <strong>${datosDevolucion.nombreProducto}</strong> del pedido <strong>#${datosDevolucion.numeroPedido}</strong> ha sido actualizado a: <strong style="color: #2980b9;">${estadoTraducido}</strong></p>
                
                ${datosDevolucion.estado === 'devolución' ? `
                <div style="background-color: #e8f4f8; padding: 15px; border-left: 4px solid #3498db; margin: 20px 0;">
                    <h3 style="color: #2c3e50; margin-top: 0;">Información importante:</h3>
                    <p>Hemos aceptado tu solicitud de devolución. Por favor, envía el producto a la siguiente dirección:</p>
                    <address style="font-style: normal; margin: 10px 0;">
                        <strong>PreseHome - Devoluciones</strong><br>
                        Calle Falsa 123<br>
                        18001 Granada<br>
                        España
                    </address>
                    <p>Incluye una copia de esta notificación dentro del paquete.</p>
                    <p>El reembolso se procesará una vez recibamos y verifiquemos el producto.</p>
                </div>
                ` : ''}
                
                ${datosDevolucion.estado === 'devuelto' ? `
                <div style="background-color: #e8f5e9; padding: 15px; border-left: 4px solid #4caf50; margin: 20px 0;">
                    <h3 style="color: #2c3e50; margin-top: 0;">Devolución completada</h3>
                    <p>Hemos recibido y verificado tu devolución del producto <strong>${datosDevolucion.nombreProducto}</strong>.</p>
                    <p>El reembolso de <strong>${datosDevolucion.precioProducto}€</strong> se procesará en tu método de pago original en un plazo de 3-5 días hábiles.</p>
                    <p>Recibirás una notificación por correo cuando se complete la transacción.</p>
                </div>
                ` : ''}
                
                <p style="margin-top: 20px;">Puedes ver el detalle de tu devolución en tu área de cliente en nuestra web.</p>
                
                <p style="margin-top: 30px;">Atentamente,<br>
                <strong>Equipo de PreseHome</strong></p>
                
                <div style="margin-top: 20px; font-size: 0.9em; color: #7f8c8d;">
                    <p>Si tienes cualquier duda, puedes responder a este correo o contactarnos en:<br>
                    Teléfono: 958 81 69 75<br>
                    Horario: L-V de 10:00 a 14:00 y de 17:00 a 21:00</p>
                </div>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Correo de estado de devolución enviado');
    } catch (error) {
        console.error('Error al enviar correo de estado de devolución:', error);
    }
}