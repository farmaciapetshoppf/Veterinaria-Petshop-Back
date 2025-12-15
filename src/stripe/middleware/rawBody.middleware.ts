import { Request, Response, NextFunction } from 'express';

interface RequestWithRawBody extends Request {
  rawBody?: Buffer;
}

export function captureRawBody(
  req: RequestWithRawBody,
  res: Response,
  next: NextFunction,
) {
  if (req.headers['stripe-signature']) {
    let data = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      req.rawBody = Buffer.from(data);
      next();
    });
  } else {
    next();
  }
}
