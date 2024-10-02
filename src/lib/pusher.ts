import Pusher from 'pusher';

// Ensure that the required environment variables are set
const requiredEnvVars = [
  'PUSHER_APP_ID',
  'PUSHER_APP_KEY',
  'PUSHER_APP_SECRET',
  'PUSHER_APP_CLUSTER'
] as const;

// Check if all required environment variables are set
requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    throw new Error(`Environment variable ${varName} is not set`);
  }
});

// Define the Pusher configuration type
interface PusherConfig {
  appId: string;
  key: string;
  secret: string;
  cluster: string;
  useTLS: boolean;
}

// Create the Pusher configuration object
const pusherConfig: PusherConfig = {
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_APP_KEY!,
  secret: process.env.PUSHER_APP_SECRET!,
  cluster: process.env.PUSHER_APP_CLUSTER!,
  useTLS: true
};

// Initialize and export the Pusher instance
export const pusher = new Pusher(pusherConfig);