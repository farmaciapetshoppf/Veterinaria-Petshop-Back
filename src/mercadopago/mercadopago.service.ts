import { Injectable } from '@nestjs/common';
import { MercadoPagoConfig, Preference } from 'mercadopago';

@Injectable()
export class MercadoPagoService {
  private client: MercadoPagoConfig;
  private preference: Preference;

  constructor() {
    // Inicializar cliente de Mercado Pago
    this.client = new MercadoPagoConfig({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
    });
    this.preference = new Preference(this.client);
  }

  /**
   * Crear preferencia de pago para el carrito
   */
  async createPreference(items: any[], orderId: string, buyerEmail: string) {
    try {
      const preference = await this.preference.create({
        body: {
          items: items.map((item, index) => ({
            id: item.product.id || `item-${index}`,
            title: item.product.name,
            quantity: item.quantity,
            unit_price: Number(item.unitPrice),
            currency_id: 'ARS',
          })),
          back_urls: {
            success: `${process.env.FRONTEND_URL}/checkout/success`,
            failure: `${process.env.FRONTEND_URL}/checkout/failure`,
            pending: `${process.env.FRONTEND_URL}/checkout/pending`,
          },
          auto_return: 'approved',
          notification_url: `${process.env.API_URL}/sale-orders/webhook`,
          external_reference: orderId, // ID de la orden para identificarla en el webhook
          payer: {
            email: buyerEmail,
          },
        },
      });

      return {
        id: preference.id,
        init_point: preference.init_point, // URL para redirigir al usuario
        sandbox_init_point: preference.sandbox_init_point, // URL de sandbox para testing
      };
    } catch (error) {
      console.error('Error creating MercadoPago preference:', error);
      throw error;
    }
  }

  /**
   * Verificar el estado de un pago
   */
  async getPaymentInfo(paymentId: string) {
    try {
      const response = await fetch(
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
          },
        },
      );
      return await response.json();
    } catch (error) {
      console.error('Error getting payment info:', error);
      throw error;
    }
  }
}
