const isDevelopment = process.env.NODE_ENV !== 'production';

console.log('Environment:', process.env.NODE_ENV);
console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);
console.log('WS URL:', process.env.NEXT_PUBLIC_WS_URL);

// In production, we must use the environment variables
if (!isDevelopment && !process.env.NEXT_PUBLIC_API_URL) {
  throw new Error('NEXT_PUBLIC_API_URL environment variable is not set in production');
}

if (!isDevelopment && !process.env.NEXT_PUBLIC_WS_URL) {
  throw new Error('NEXT_PUBLIC_WS_URL environment variable is not set in production');
}

// Use environment variables with fallbacks for development only
export const API_URL = isDevelopment
  ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001')
  : (process.env.NEXT_PUBLIC_API_URL || 'https://bruinhottake.brandonle.dev');

export const WS_URL = isDevelopment
  ? (process.env.NEXT_PUBLIC_WS_URL || 'wss://localhost:3001/ws')
  : (process.env.NEXT_PUBLIC_WS_URL || 'wss://bruinhottake.brandonle.dev/ws'); 