import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoServer;

export async function setupTestDB() {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  process.env.JWT_SECRET = 'test_jwt_secret_minimum_32_chars_!!';
  process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_minimum_32_chars!!';
  process.env.MONGODB_URI = uri;
}

export async function teardownTestDB() {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  if (mongoServer) await mongoServer.stop();
}

export async function clearCollections() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}
