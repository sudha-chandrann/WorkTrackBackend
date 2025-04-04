import mongoose from 'mongoose';
import dotenv from "dotenv";
dotenv.config();
// Track connection status
const connection = {
  isConnected: false,
};

async function dbConnect() {
  // Return early if already connected
  if (connection.isConnected) {
    console.log('Already connected to the database');
    return;
  }

  // Check if MongoDB URI is configured
  if (!process.env.MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable');
  }

  try {
    console.log('Connecting to the database...');
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Update connection status
    connection.isConnected = mongoose.connection.readyState === 1;
    
    // Set up connection event handlers (only need to do this once)
    if (!mongoose.connection.listenerCount('connected')) {
      mongoose.connection.on('connected', () => {
        console.log('Connected to MongoDB');
        connection.isConnected = true;
      });

      mongoose.connection.on('error', (err) => {
        console.error('MongoDB connection error:', err);
      });

      mongoose.connection.on('disconnected', () => {
        console.log('MongoDB disconnected');
        connection.isConnected = false;
      });
    }

    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection failed:', error.message);
    throw new Error(`Database connection failed: ${error.message}`);
  }
}

export default dbConnect;