import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { generarFacturaPDF } from "./generarFactura.js";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function enviarCorreoFacturacion(destinatario, direccion,{ pedido, total }) {
  const filePath = await generarFacturaPDF(direccion, pedido, total);

    const detallesPedido = pedido.detalle_pedido.map(item => {
        const precioFinal = item.producto.descuento > 0 
            ? item.precio_unitario * (1 - item.producto.descuento/100)
            : item.precio_unitario;
        
        const tieneDescuento = item.producto.descuento > 0;
        
        return `
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.producto.nombre}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.cantidad}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; ${tieneDescuento ? 'text-decoration: line-through; color: #999;' : ''}">
                    ${item.precio_unitario.toFixed(2)}€
                    ${tieneDescuento ? `<br><span style="color: #2e7d32; font-weight: bold;">${precioFinal.toFixed(2)}€ (${item.producto.descuento}% desc.)</span>` : ''}
                </td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${(precioFinal * item.cantidad).toFixed(2)}€</td>
            </tr>
        `;
    }).join('');

  const mailOptions = {
    from: `"PreseHome" <${process.env.EMAIL_USER}>`,
    to: destinatario,
    subject: "¡Gracias por su compra!",
    text: `Hola, gracias por comprar en PreseHome. Su pedido está siendo procesado, a continuación encontrará la factura de su pedido.\n\nEste es un correo automatizado, por favor no responda.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f4f4f4; padding: 20px; border-radius: 8px;">
        <h2 style="text-align: center;">Detalles del Pedido</h2>
        <p>Gracias por comprar en PreseHome. A continuación, se detalla su pedido:</p>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="padding: 8px; border-bottom: 2px solid #ddd; text-align: left;">Producto</th>
              <th style="padding: 8px; border-bottom: 2px solid #ddd; text-align: left;">Cantidad</th>
              <th style="padding: 8px; border-bottom: 2px solid #ddd; text-align: left;">Precio Unitario</th>
              <th style="padding: 8px; border-bottom: 2px solid #ddd; text-align: left;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${detallesPedido}
          </tbody>
        </table>
        <p style="text-align: right; font-weight: bold; padding-top: 10px;">Total: ${total.toFixed(2)}€</p>
        <p>Este es un correo automatizado, por favor no responda.</p>
      </div>
    `,
    attachments: [
        {
          filename: `factura_${pedido.pedido_id}.pdf`,
          path: filePath
        }
    ]
  };

  await transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
    } else {
      console.log('Correo enviado: ' + info.response);
    }
  });
}
