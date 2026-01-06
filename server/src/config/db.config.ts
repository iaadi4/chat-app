import { MongoClient, Db } from "mongodb";

const MONGODB_URI = process.env.DATABASE_URL || "mongodb://localhost:27017";
const DATABASE_NAME = process.env.DATABASE_NAME || "chat_app";

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectDB(): Promise<Db> {
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DATABASE_NAME);

    console.log(`Connected to MongoDB: ${DATABASE_NAME}`);
    return db;
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    throw error;
  }
}
