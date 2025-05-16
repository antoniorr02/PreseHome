import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

export async function generarFacturaPDF(direccion, pedido, total) {
  const fecha = new Date(pedido.fecha_pedido).toLocaleDateString('es-ES');
  const baseImponible = (total / 1.21).toFixed(2); // Asume IVA 21%
  const iva = (total - baseImponible).toFixed(2);
  const direccionTexto = `
  Calle: ${direccion.calle}
  Número: ${direccion.numero}
  Piso: ${direccion.piso}
  Ciudad: ${direccion.ciudad}
  Código Postal: ${direccion.cod_postal}
  País: ${direccion.pais}
`;


  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; color: #333;">
      <h1 style="text-align: center; margin-bottom: 40px;">Factura</h1>
      
      <div style="margin-bottom: 20px;">
        <strong>Factura Nº:</strong> ${pedido.pedido_id}<br>
        <strong>Fecha de expedición:</strong> ${fecha}
      </div>

      <div style="display: flex; justify-content: space-between; gap: 20px; margin-bottom: 40px;">
        <div style="flex: 1; padding: 15px; border: 1px solid #ccc; border-radius: 8px; background-color: #f9f9f9; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
          <h3 style="margin-top: 0; border-bottom: 1px solid #ddd; padding-bottom: 10px;">Emisor</h3>
          <p style="line-height: 1.5;">
            PreseHome S.L.<br>
            CIF: B12345678<br>
            C/ Ejemplo 123, 28080 Madrid<br>
            España
          </p>
        </div>
        <div style="flex: 1; padding: 15px; border: 1px solid #ccc; border-radius: 8px; background-color: #f9f9f9; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
          <h3 style="margin-top: 0; border-bottom: 1px solid #ddd; padding-bottom: 10px;">Cliente</h3>
          <p style="line-height: 1.5;">
            ${pedido.cliente.nombre}<br>
            DNI: ${pedido.cliente.dni}<br>
            ${direccionTexto.replace(/\n/g, '<br>')}
          </p>
        </div>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="background-color: #eee;">
            <th style="border-bottom: 2px solid #000; padding: 8px; text-align: left;">Producto</th>
            <th style="border-bottom: 2px solid #000; padding: 8px; text-align: right;">Cantidad</th>
            <th style="border-bottom: 2px solid #000; padding: 8px; text-align: right;">Precio Unitario (€)</th>
            <th style="border-bottom: 2px solid #000; padding: 8px; text-align: right;">Total (€)</th>
          </tr>
        </thead>
        <tbody>
          ${pedido.detalle_pedido.map(item => `
            <tr>
              <td style="border-bottom: 1px solid #ddd; padding: 8px;">${item.producto.nombre}</td>
              <td style="border-bottom: 1px solid #ddd; padding: 8px; text-align: right;">${item.cantidad}</td>
              <td style="border-bottom: 1px solid #ddd; padding: 8px; text-align: right;">${item.precio_unitario.toFixed(2)}</td>
              <td style="border-bottom: 1px solid #ddd; padding: 8px; text-align: right;">${(item.precio_unitario * item.cantidad).toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div style="text-align: right; margin-bottom: 10px;">
        <p><strong>Base imponible:</strong> ${baseImponible}€</p>
        <p><strong>IVA (21%):</strong> ${iva}€</p>
        <p><strong>Total (IVA incluido):</strong> ${total.toFixed(2)}€</p>
      </div>

      <p style="font-size: 0.9em; color: #555;">Este documento es una factura válida a efectos fiscales según el Real Decreto 1619/2012.</p>
      <p style="font-size: 0.8em; color: #999;">Factura generada automáticamente por PreseHome. No requiere firma.</p>
    </div>
  `;


  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });

  const dirPath = path.join(__dirname, 'facturas');
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  const filePath = path.join(dirPath, `factura_${pedido.pedido_id}.pdf`);
  await page.pdf({ path: filePath, format: 'A4', printBackground: true });

  await browser.close();
  return filePath;
}
