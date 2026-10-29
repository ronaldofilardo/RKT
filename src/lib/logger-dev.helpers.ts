export const isDevelopment = process.env.NODE_ENV === "development";

export function devLog(...args: unknown[]) {
  if (isDevelopment) {
    console.log(...args);
  }
}

export function devDebug(...args: unknown[]) {
  if (isDevelopment) {
    console.debug(...args);
  }
}

export function devError(...args: unknown[]) {
  if (isDevelopment) {
    console.error(...args);
  }
}
