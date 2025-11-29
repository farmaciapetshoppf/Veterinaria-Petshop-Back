import { v4 as uuidv4 } from 'uuid';

export function generateShortUuid(length: number = 22): string {
  const uuid = uuidv4().replace(/-/g, '');
  const base = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  let shortUuid = '';
  let num = BigInt('0x' + uuid);

  while (num > 0) {
    const mod = Number(num % BigInt(62));
    shortUuid = base[mod] + shortUuid;
    num = num / BigInt(62);
  }

  while (shortUuid.length < length) {
    shortUuid = base[0] + shortUuid;
  }

  return shortUuid.slice(0, length);
}
