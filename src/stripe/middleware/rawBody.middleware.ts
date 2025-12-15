// rawBody.middleware.ts
import { Request, Response, NextFunction } from 'express';
import * as bodyParser from 'body-parser';

interface RequestWithRawBody extends Request {
  rawBody?: Buffer;
}

export function captureRawBody(
  req: RequestWithRawBody,
  res: Response,
  next: NextFunction,
) {
  // Solo procesar el cuerpo crudo para la ruta del webhook de Stripe
  bodyParser.raw({ type: 'application/json' })(req, res, (err) => {
    if (err) return next(err);

    // Guardar el cuerpo crudo para su uso posterior
    req.rawBody = req.body;

    // Para depuración
    console.log('🔍 Stripe signature header:', req.headers['stripe-signature']);
    console.log(`🔍 Raw body length: ${req.rawBody?.length} bytes`);

    // Continuar con el siguiente middleware
    next();
  });
}
