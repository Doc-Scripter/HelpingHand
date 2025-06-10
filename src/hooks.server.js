import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🔧 Server hooks loaded - Environment configured');
console.log('M-Pesa Environment:', process.env.MPESA_ENVIRONMENT);
console.log('M-Pesa Callback URL:', process.env.MPESA_CALLBACK_URL);

export async function handle({ event, resolve }) {
  // Add any server-side logic here if needed
  const response = await resolve(event);
  return response;
}