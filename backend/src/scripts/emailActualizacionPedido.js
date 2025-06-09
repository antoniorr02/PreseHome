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

export async function emailActualizacionPedido(email, datosPedido) {
    const estadosTraducidos = {
        'enviado': 'Enviado',
        'entregado': 'Entregado',
        'cancelado': 'Cancelado'
    };

    const estadoTraducido = estadosTraducidos[datosPedido.estado] || datosPedido.estado;
    
    const mailOptions = {
        from: `"PreseHome" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `Actualización de tu pedido #${datosPedido.numeroPedido}`,
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h1 style="color: #2c3e50;">Estado de tu pedido actualizado</h1>
                <p>Hola ${datosPedido.nombreCliente},</p>
                <p>El estado de tu pedido <strong>#${datosPedido.numeroPedido}</strong> ha sido actualizado a: <strong style="color: #2980b9;">${estadoTraducido}</strong></p>
                
                ${datosPedido.estado === 'enviado' ? `
                <div style="background-color: #e8f4f8; padding: 15px; border-left: 4px solid #3498db; margin: 20px 0;">
                    <h3 style="color: #2c3e50; margin-top: 0;">Información importante:</h3>
                    <p>Tu pedido ha sido enviado y debería llegar pronto. Por favor, asegúrate de que habrá alguien para recibirlo.</p>
                    <p>Si no estás en casa en el momento de la entrega, el transportista intentará ponerse en contacto contigo.</p>
                </div>
                ` : ''}
                
                ${datosPedido.estado === 'entregado' ? `
                <div style="background-color: #e8f5e9; padding: 15px; border-left: 4px solid #4caf50; margin: 20px 0;">
                    <h3 style="color: #2c3e50; margin-top: 0;">¡Pedido entregado!</h3>
                    <p>Esperamos que estés satisfecho con tu compra. Si tienes algún problema con los productos recibidos, no dudes en contactarnos.</p>
                    <p>Recuerda que dispones de un plazo de 15 días para solicitar devoluciones si fuera necesario.</p>
                </div>
                ` : ''}
                
                ${datosPedido.estado === 'cancelado' ? `
                <div style="background-color: #ffebee; padding: 15px; border-left: 4px solid #f44336; margin: 20px 0;">
                    <h3 style="color: #2c3e50; margin-top: 0;">Pedido cancelado</h3>
                    <p>Lamentamos informarte que tu pedido ha sido cancelado.</p>
                    <p>Si el pago ya fue realizado, el reembolso se procesará en un plazo máximo de 5 días hábiles.</p>
                    <p>Si tienes alguna duda sobre esta cancelación, por favor contáctanos respondiendo a este correo.</p>
                </div>
                ` : ''}
                
                <p style="margin-top: 20px;">Puedes ver el detalle de tu pedido en tu área de cliente en nuestra web.</p>
                
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
        console.log('Correo de cambio de estado enviado');
    } catch (error) {
        console.error('Error al enviar correo de cambio de estado:', error);
    }
}