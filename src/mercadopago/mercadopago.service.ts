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
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3002';
      const apiUrl = process.env.API_URL || 'http://localhost:3000';

      console.log('🔧 Debug - Environment Variables:');
      console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
      console.log('API_URL:', process.env.API_URL);
      console.log('Using frontendUrl:', frontendUrl);
      console.log('Using apiUrl:', apiUrl);

      // Consolidar items duplicados (mismo producto)
      const consolidatedItems = items.reduce((acc, item) => {
        const existingItem = acc.find(i => i.product.id === item.product.id);
        if (existingItem) {
          // Si el producto ya existe, sumar la cantidad
          existingItem.quantity += item.quantity;
        } else {
          // Si no existe, agregarlo
          acc.push({ ...item });
        }
        return acc;
      }, []);

      console.log('📦 Items originales:', items.length);
      console.log('📦 Items consolidados:', consolidatedItems.length);

      const preferenceData: any = {
        items: consolidatedItems.map((item, index) => ({
          id: item.product.id || `item-${index}`,
          title: item.product.name,
          quantity: item.quantity,
          unit_price: Number(item.unitPrice),
          currency_id: 'ARS',
        })),
        back_urls: {
          success: `${frontendUrl}/checkout/success`,
          failure: `${frontendUrl}/checkout/failure`,
          pending: `${frontendUrl}/checkout/pending`,
        },
        notification_url: `${apiUrl}/sale-orders/webhook`,
        external_reference: orderId,
        payer: {
          email: buyerEmail,
        },
      };

      console.log('📦 Preference data:', JSON.stringify(preferenceData, null, 2));

      const preference = await this.preference.create({
        body: preferenceData,
      });

      return {
        id: preference.id,
        init_point: preference.init_point,
        sandbox_init_point: preference.sandbox_init_point,
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
