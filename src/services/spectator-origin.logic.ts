import os from 'os';

export function getLanIpAddress(): string | null {
  const interfaces = os.networkInterfaces();
  const names = Object.keys(interfaces).sort((a, b) => {
    const isSpecialA = /wsl|vethernet|docker|virtual/i.test(a);
    const isSpecialB = /wsl|vethernet|docker|virtual/i.test(b);
    if (isSpecialA && !isSpecialB) return 1;
    if (!isSpecialA && isSpecialB) return -1;
    return 0;
  });

  for (const name of names) {
    for (const net of interfaces[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return null;
}

export function resolveShareOrigin(rawOrigin: string): string {
  const clean = rawOrigin.replace(/\/+$/, '');
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/+$/, '');

  const isLocalhost = /^(https?:\/\/)(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/i.test(clean);
  if (isLocalhost) {
    const lanIp = getLanIpAddress();
    if (lanIp) {
      return clean.replace(/(localhost|127\.0\.0\.1|0\.0\.0\.0)/i, lanIp);
    }
  }

  return clean;
}

