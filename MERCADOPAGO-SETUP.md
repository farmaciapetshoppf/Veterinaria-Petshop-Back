# Integración de Mercado Pago - Sistema de Carrito

## ✅ Implementación Completa

Se agregó la integración completa de Mercado Pago para el sistema de carrito de compras.

## 📋 Requisitos Previos

1. **Cuenta de Mercado Pago**
   - Crear cuenta en: https://www.mercadopago.com.ar/developers
   - Obtener credenciales (Access Token)

2. **Variables de Entorno (.env)**

Agregar a tu archivo `.env`:

```env
# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN=tu_access_token_aqui

# URLs para callbacks (ya deberían estar configuradas)
API_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3002
```

## 🔑 Obtener Access Token

### Para Testing (Sandbox):
1. Ir a https://www.mercadopago.com.ar/developers/panel/app
2. Crear una aplicación de prueba
3. Copiar el **Access Token de prueba**

### Para Producción:
1. Completar validación de cuenta
2. Activar aplicación en producción
3. Usar el **Access Token de producción**

## 🚀 Endpoints Implementados

### 1. **POST /sale-orders/checkout**
Inicia el proceso de pago con Mercado Pago

**Request:**
```json
{
  "userId": "84ef5839-2fc2-4689-a203-cf7bb25074d0"
}
```

**Response:**
```json
{
  "message": "Checkout iniciado - Stock reservado",
  "data": {
    "orderId": "abc-123",
    "preferenceId": "1234567890",
    "initPoint": "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=...",
    "sandboxInitPoint": "https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=..."
  }
}
```

**¿Qué hace?**
- **Valida que haya stock suficiente** para todos los productos
- **Descuenta el stock inmediatamente** antes de generar el pago
- Cambia el carrito de `ACTIVE` → `PENDING`
- Genera preferencia de pago en Mercado Pago
- Retorna URL para redirigir al usuario
- Si algún producto no tiene stock, retorna error detallado

### 2. **POST /sale-orders/webhook**
Recibe notificaciones de pago de Mercado Pago (automático)

**¿Qué hace?**
- Mercado Pago llama este endpoint cuando hay cambios en el pago
- Actualiza el estado de la orden según el resultado:
  - `approved` → Orden pasa a `PAID`
  - `rejected` o `cancelled` → Orden pasa a `CANCELLED` y **restaura el stock**

## 📝 Flujo Completo de Compra

1. **Usuario agrega productos al carrito**
   - `POST /sale-orders/cart/add`
   - **Stock se valida** pero NO se descuenta aún
   - Carrito en estado `ACTIVE`
   - Si no hay stock suficiente, retorna error

2. **Usuario inicia checkout**
   - `POST /sale-orders/checkout`
   - **Stock se descuenta en este momento**
   - Carrito cambia a `PENDING`
   - Se genera link de pago de Mercado Pago
   - Si no hay stock en este momento, retorna error detallado

3. **Usuario completa el pago en Mercado Pago**
   - Redirigido a `initPoint` o `sandboxInitPoint`
   - Completa el pago en la página de Mercado Pago

4. **Mercado Pago notifica el resultado**
   - Llama a `POST /sale-orders/webhook` automáticamente
   - Si pago aprobado: orden → `PAID`, **stock permanece descontado**
   - Si pago rechazado: orden → `CANCELLED`, **stock se restaura**

5. **Usuario es redirigido**
   - Success: `http://localhost:3002/checkout/success`
   - Failure: `http://localhost:3002/checkout/failure`
   - Pending: `http://localhost:3002/checkout/pending`

## 🧪 Testing

### Con Tarjetas de Prueba de Mercado Pago:

**Aprobar pago:**
- Tarjeta: `5031 7557 3453 0604`
- CVV: `123`
- Fecha: Cualquier fecha futura

**Rechazar pago:**
- Tarjeta: `5031 4332 1540 6351`

Más tarjetas de prueba: https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/additional-content/test-cards

## 📍 Configurar Webhook en Mercado Pago

1. Ir a tu aplicación en el panel de Mercado Pago
2. Sección "Webhooks" o "Notificaciones"
3. Agregar URL: `https://tu-dominio.com/sale-orders/webhook`
   - Para desarrollo local, usar **ngrok** o **localtunnel** para exponer localhost

### Ejemplo con ngrok:
```bash
ngrok http 3000
# Copiar la URL https generada
# Configurar en Mercado Pago: https://abc123.ngrok.io/sale-orders/webhook
```

## 🔒 Seguridad

- El Access Token **NUNCA** debe estar en el código
- Siempre usar variables de entorno
- En producción, validar la firma del webhook (próxima mejora)

## 📦 Dependencias Instaladas

```json
{
  "mercadopago": "^2.x.x"
}
```

## ✨ Características Implementadas

✅ Crear preferencia de pago  
✅ Generar link de checkout  
✅ Webhook para notificaciones  
✅ Actualización automática de estados  
✅ Restauración de stock si pago falla  
✅ Soporte para testing (sandbox)  
✅ URLs de redirección configurables  
✅ Logs detallados de webhooks  

## 🎯 Próximas Mejoras (Opcional)

- [ ] Validar firma de webhook para seguridad
- [ ] Soporte para métodos de pago específicos
- [ ] Descuentos y cupones
- [ ] Split payments (pagos divididos)
- [ ] Suscripciones recurrentes
