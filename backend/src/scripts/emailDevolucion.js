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

export async function enviarCorreoDevolucion(email, datosDevolucion) {
    const mailOptions = {
        from: `"PreseHome" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Solicitud de información para tu devolución',
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h1 style="color: #2c3e50;">Proceso de devolución iniciado</h1>
                <p>Hemos registrado tu solicitud de devolución para el producto <strong>${datosDevolucion.producto}</strong> del pedido #${datosDevolucion.numeroPedido}.</p>
                
                <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #3498db; margin: 20px 0;">
                    <h3 style="color: #2c3e50; margin-top: 0;">Por favor, necesitamos más información:</h3>
                    <p>Para poder procesar tu devolución, necesitamos que respondas a este correo:</p>
                    <ul>
                        <li>Indicando el motivo detallado de la devolución</li>
                        <li>Adjuntando fotografías que muestren:
                            <ul>
                                <li>El estado actual del producto</li>
                                <li>Cualquier tara o defecto que haya motivado la devolución</li>
                                <li>Los envoltorios y embalajes originales</li>
                            </ul>
                        </li>
                    </ul>
                </div>

                <div style="background-color: #fff8e1; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; border-radius: 0 4px 4px 0;">
                    <h4 style="margin-top: 0; color: #d84315;">Plazo importante:</h4>
                    <p>Para que podamos procesar tu solicitud, <strong>debes responder a este correo con la información solicitada dentro de un plazo de 15 días naturales</strong> desde la fecha de este mensaje (${datosDevolucion.fechaDevolucion}).</p>
                    <p>En caso de no recibir tu respuesta dentro de este plazo, la solicitud de devolución se considerará anulada automáticamente.</p>
                </div>

                <p>Una vez recibamos tu respuesta, revisaremos la información y te indicaremos los siguientes pasos para completar la devolución.</p>
                
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
        console.log('Correo de devolución enviado');
    } catch (error) {
        console.error('Error al enviar correo de devolución:', error);
    }
}