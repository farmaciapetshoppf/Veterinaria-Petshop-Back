# Configuración de Webhook de MercadoPago

## 🔗 URL del Webhook

Tu backend ya tiene el endpoint configurado en:
```
POST /sale-orders/webhook
```

Con ngrok, la URL completa es:
```
https://calycine-beachless-linda.ngrok-free.dev/sale-orders/webhook
```

## 📋 Pasos para Configurar en MercadoPago

### Opción 1: Desde el Panel de MercadoPago

1. Ingresá a tu cuenta de MercadoPago: https://www.mercadopago.com.ar/developers/panel
2. Ir a **"Tu aplicación"** → **"Webhooks"**
3. Click en **"Configurar notificaciones"**
4. Seleccionar **"Modo producción"** o **"Modo pruebas"** según corresponda
5. En el campo **"URL de notificaciones"**, pegar:
   ```
   https://calycine-beachless-linda.ngrok-free.dev/sale-orders/webhook
   ```
6. Seleccionar los eventos a notificar:
   - ✅ `payment` (Pagos)
   - ✅ `merchant_order` (Órdenes) - opcional
7. Click en **"Guardar"**

### Opción 2: Por API (Programáticamente)

Podés configurarlo desde código usando la SDK de MercadoPago:

```typescript
// En mercadopago.service.ts o donde configures MP
import { MercadoPagoConfig, Payment } from 'mercadopago';

const client = new MercadoPagoConfig({ 
  accessToken: 'TU_ACCESS_TOKEN' 
});

// Configurar webhook
const webhookUrl = 'https://calycine-beachless-linda.ngrok-free.dev/sale-orders/webhook';
```

## 🔄 Eventos que Procesa el Webhook

El webhook actual maneja:

1. **payment.created** - Pago creado
2. **payment.updated** - Pago actualizado
3. **payment.approved** - Pago aprobado ✅
   - Actualiza orden a `PAID`
   - Envía email de confirmación de compra
   
4. **payment.rejected** - Pago rechazado ❌
   - Actualiza orden a `CANCELLED`
   - Restaura stock de productos
   
5. **payment.cancelled** - Pago cancelado 🚫
   - Actualiza orden a `CANCELLED`
   - Restaura stock de productos

## 🧪 Probar el Webhook

### 1. Desde MercadoPago Panel
- Ir a Webhooks → Click en "Probar notificación"
- MercadoPago enviará una notificación de prueba

### 2. Manualmente con cURL
```bash
curl -X POST https://calycine-beachless-linda.ngrok-free.dev/sale-orders/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "action": "payment.updated",
    "type": "payment",
    "data": {
      "id": "1234567890"
    }
  }'
```

### 3. Desde Postman
```
POST https://calycine-beachless-linda.ngrok-free.dev/sale-orders/webhook

Body (JSON):
{
  "action": "payment.updated",
  "type": "payment",
  "data": {
    "id": "1234567890"
  }
}
```

## 📝 Logs del Webhook

El webhook loguea automáticamente:
```
📩 Webhook recibido de Mercado Pago: {...}
💰 Detalles del pago: {...}
✅ Pago aprobado → Estado actualizado a PAID
❌ Error procesando webhook: {...}
```

Podés ver estos logs en la consola del servidor.

## ⚠️ Importante sobre ngrok

- **Ngrok gratis cambia la URL** cada vez que reiniciás el túnel
- Si la URL de ngrok cambia, **deberás actualizar el webhook en MercadoPago**
- Para URL permanente, considerá ngrok de pago o desplegá en un servidor real

## 🔐 Seguridad (Recomendado para Producción)

Actualmente el webhook acepta cualquier petición. Para producción, deberías:

1. **Verificar firma de MercadoPago** (x-signature header)
2. **Validar IP origen** (solo IPs de MercadoPago)
3. **Usar HTTPS** (ngrok ya lo provee)

### Ejemplo de validación de firma:
```typescript
// En sale-orders.controller.ts
@Post('webhook')
handleWebhook(
  @Body() body: any,
  @Headers('x-signature') signature: string,
  @Headers('x-request-id') requestId: string
) {
  // Validar firma antes de procesar
  if (!this.validateMPSignature(signature, body)) {
    throw new UnauthorizedException('Firma inválida');
  }
  return this.saleOrdersService.handleWebhook(body);
}
```

## 📊 Estado Actual

✅ Endpoint webhook implementado: `/sale-orders/webhook`
✅ Manejo de eventos: approved, rejected, cancelled
✅ Actualización automática de órdenes
✅ Restauración de stock en fallos
✅ Envío de emails de confirmación
⏳ **Falta configurar en panel de MercadoPago con tu URL de ngrok**

## 🚀 Próximos Pasos

1. Copiá la URL: `https://calycine-beachless-linda.ngrok-free.dev/sale-orders/webhook`
2. Ingresá a MercadoPago Developers
3. Configurá el webhook con esa URL
4. Probá haciendo un pago de prueba
5. Verificá los logs en tu servidor
