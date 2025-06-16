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

export async function emailCredencialesOlvidados(destinatario, token) {
    const urlRecuperacion = `http://localhost/cambiar-credenciales?token=${token}`;

    const mailOptions = {
        from: `"PreseHome" <${process.env.EMAIL_USER}>`,
        to: destinatario,
        subject: "Recuperación de contraseña",
        text: `Hola, hemos recibido una solicitud para restablecer la contraseña de tu cuenta en PreseHome. Puedes hacerlo usando el siguiente enlace (válido por 1 hora):\n\n${urlRecuperacion}\n\nSi no realizaste esta solicitud, simplemente ignora este mensaje.\n\nEste es un correo automatizado, por favor no respondas.`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f4f4f4; padding: 20px; border-radius: 8px;">
                <h2 style="color: #333; text-align: center;">Recuperación de contraseña</h2>
                <p style="font-size: 16px; line-height: 1.5; color: #555; text-align: center;">
                    Hemos recibido una solicitud para restablecer tu contraseña. Si fuiste tú, haz clic en el siguiente botón para continuar. El enlace es válido por 1 hora.
                </p>

                <div style="text-align: center; margin-top: 30px;">
                    <a href="${urlRecuperacion}" style="background-color: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-size: 16px;">
                        Restablecer contraseña
                    </a>
                </div>

                <p style="font-size: 14px; color: #555; text-align: center; margin-top: 20px;">
                    Si no realizaste esta solicitud, puedes ignorar este mensaje con seguridad.
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
            console.log('Correo de recuperación enviado: ' + info.response);
        }
    });
}
