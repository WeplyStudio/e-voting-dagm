import { MongoClient, Collection, Document } from 'mongodb';

const uri = process.env.MONGODB_URI || "mongodb+srv://hahahalucukokrek:Z5ImxXzsGeS4QkJF@cluster0.u4gea61.mongodb.net/80Fest";

if (!uri) {
  throw new Error('MongoDB URI is not defined. Please add it to your .env file');
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

// In production mode, it's best to not use a global variable.
if (process.env.NODE_ENV === 'production') {
  client = new MongoClient(uri);
  clientPromise = client.connect();
} else {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  let globalWithMongo = global as typeof global & {
    _mongoClientPromise?: Promise<MongoClient>
  }
  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri);
    globalWithMongo._mongoClientPromise = client.connect()
  }
  clientPromise = globalWithMongo._mongoClientPromise
}

export async function getDb() {
    const client = await clientPromise;
    return client.db();
}

export async function getCandidatesCollection(): Promise<Collection<Document>> {
    const db = await getDb();
    return db.collection('candidates');
}

export async function getVotersCollection(): Promise<Collection<Document>> {
    const db = await getDb();
    return db.collection('voters');
}

export async function getSettingsCollection(): Promise<Collection<Document>> {
    const db = await getDb();
    return db.collection('settings');
}
