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

export async function enviarCorreoConfirmacion(destinatario, token) {
    const urlConfirmacion = `http://localhost:4321/confirmado?token=${token}`;

    const mailOptions = {
        from: `"PreseHome" <${process.env.EMAIL_USER}>`,
        to: destinatario,
        subject: "Confirma tu cuenta",
        text: `Hola, gracias por registrarte en PreseHome. Para activar tu cuenta, por favor, haz clic en el siguiente enlace dentro de las próximas 24 horas:\n\n${urlConfirmacion}\n\nSi no creaste esta cuenta, puedes ignorar este mensaje.\n\nEste es un correo automatizado, por favor no respondas.`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f4f4f4; padding: 20px; border-radius: 8px;">
                <h2 style="color: #333; text-align: center;">¡Bienvenido a PreseHome!</h2>
                <p style="font-size: 16px; line-height: 1.5; color: #555; text-align: center;">
                    Gracias por registrarte en nuestra tienda. Para activar tu cuenta, por favor haz clic en el siguiente botón. Tienes 24 horas para completar este paso.
                </p>

                <div style="text-align: center; margin-top: 30px;">
                    <a href="${urlConfirmacion}" style="background-color: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-size: 16px;">
                        Confirmar cuenta
                    </a>
                </div>

                <p style="font-size: 14px; color: #555; text-align: center; margin-top: 20px;">
                    Si no creaste esta cuenta, puedes ignorar este mensaje.
                </p>

                <p style="font-size: 14px; color: #555; text-align: center; margin-top: 30px;">
                    (Este es un correo automatizado, por favor no respondas)
                </p>

                <p style="font-size: 14px; color: #555; text-align: center; margin-top: 30px;">
                    PreseHome Team
                </p>
            </div>
        `,
    };

    await transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error);
        } else {
            console.log('Correo enviado: ' + info.response);
        }
    });
}
