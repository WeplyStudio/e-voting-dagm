import { MongoClient, Collection, Document } from 'mongodb';

const uri = process.env.MONGODB_URI || "mongodb+srv://hahahalucukokrek:Z5ImxXzsGeS4QkJF@cluster0.u4gea61.mongodb.net/80Fest";

if (!uri) {
  throw new Error('MongoDB URI is not defined. Please add it to your .env file');
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare const global: {
  _mongoClientPromise?: Promise<MongoClient>;
};

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, { tls: true });
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, { tls: true });
  clientPromise = client.connect();
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
