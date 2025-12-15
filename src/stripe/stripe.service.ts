import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class StripeService {
  private stripe: Stripe;
  private logFile = path.join(process.cwd(), 'stripe-payments.log');

  constructor() {
    // Inicializar cliente de Stripe
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2023-10-16' as Stripe.LatestApiVersion,
    });
  }

  private logToFile(message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}${data ? '\n' + JSON.stringify(data, null, 2) : ''}\n${'='.repeat(80)}\n`;
    fs.appendFileSync(this.logFile, logMessage);
    console.log(message, data || '');
  }

  /**
   * Crear una sesión de checkout para Stripe
   */
  async createCheckoutSession(
    items: any[],
    orderId: string,
    buyerEmail: string,
    successUrl: string,
    cancelUrl: string,
  ) {
    try {
      this.logToFile('📦 Items en la sesión de checkout:', items);

      // Crear líneas de productos para Stripe
      const lineItems = items.map((item) => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.product.name,
            description: item.product.description || undefined,
            images: item.product.imageUrl ? [item.product.imageUrl] : undefined,
          },
          unit_amount: Math.round((Number(item.unitPrice) / 1436) * 100), // Aproximadamente 1436 ARS = 1 USD
        },
        quantity: item.quantity,
      }));

      // Crear sesión de checkout
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
        customer_email: buyerEmail,
        client_reference_id: orderId,
        metadata: {
          order_id: orderId,
        },
      });

      this.logToFile('✅ Sesión de Stripe creada:', {
        sessionId: session.id,
        url: session.url,
      });

      return {
        id: session.id,
        url: session.url,
      };
    } catch (error) {
      this.logToFile('❌ Error creando sesión de Stripe:', error);
      throw error;
    }
  }

  /**
   * Crear un intent de pago directo
   */
  async createPaymentIntent(
    amount: number,
    orderId: string,
    customerEmail?: string,
  ) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Stripe usa centavos
        currency: 'ars',
        metadata: {
          order_id: orderId,
        },
        receipt_email: customerEmail,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      this.logToFile('✅ PaymentIntent creado:', {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
      });

      return {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
      };
    } catch (error) {
      this.logToFile('❌ Error creando PaymentIntent:', error);
      throw error;
    }
  }

  /**
   * Verificar firma del webhook y construir evento
   */
  constructEventFromPayload(signature: string, payload: Buffer) {
    return this.stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || '',
    );
  }

  /**
   * Recuperar información de un pago
   */
  async getPaymentIntent(paymentIntentId: string) {
    return this.stripe.paymentIntents.retrieve(paymentIntentId);
  }
}
