import mongoose from 'mongoose'

let isConnecting = false

export async function connectMongo(): Promise<void> {
  if (mongoose.connections[0]?.readyState) return
  if (isConnecting) return
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI is not set')
  isConnecting = true
  try {
    await mongoose.connect(uri)
  } finally {
    isConnecting = false
  }
}


