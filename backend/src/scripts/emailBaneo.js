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

export async function enviarCorreoEstadoCuenta(destinatario, accion) {
    const asunto = accion === 'ban' 
      ? 'Tu cuenta en PreseHome ha sido suspendida' 
      : 'Tu cuenta en PreseHome ha sido reactivada';
    
    const textoPrincipal = accion === 'ban'
      ? `Lamentamos informarte que tu cuenta en PreseHome ha sido suspendida temporalmente.`
      : `Nos complace informarte que tu cuenta en PreseHome ha sido reactivada y ahora puedes acceder a todos nuestros servicios nuevamente.`;
    
    const mailOptions = {
      from: `"PreseHome - Soporte" <${process.env.EMAIL_USER}>`,
      to: destinatario,
      subject: asunto,
      text: `${textoPrincipal}\n\nSi crees que esto es un error o necesitas más información, por favor contacta con nuestro equipo de soporte.\n\nEste es un correo automatizado, por favor no respondas.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f4f4f4; padding: 20px; border-radius: 8px;">
          <h2 style="color: #333; text-align: center;">${asunto}</h2>
          <p style="font-size: 16px; line-height: 1.5; color: #555; text-align: center;">
            ${textoPrincipal}
          </p>
          
          <p style="font-size: 16px; line-height: 1.5; color: #555; text-align: center;">
            Si crees que esto es un error o necesitas más información, por favor contacta con nuestro equipo de soporte.
          </p>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="http://localhost/contacto" style="background-color: #007bff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-size: 16px;">
              Contactar Soporte
            </a>
          </div>
          
          <p style="font-size: 14px; color: #555; text-align: center; margin-top: 30px;">
            (Este es un correo automatizado, por favor no respondas)
          </p>
          
          <p style="font-size: 14px; color: #555; text-align: center; margin-top: 30px;">
            PreseHome Team
          </p>
        </div>
      `,
    };
  
    try {
      await transporter.sendMail(mailOptions);
      console.log(`Correo de ${accion} enviado a ${destinatario}`);
    } catch (error) {
      console.error(`Error al enviar correo de ${accion}:`, error);
    }
  }