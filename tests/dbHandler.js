import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongod = null;

/**
 * Connect to the in-memory database.
 */
export const connect = async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    
    // Disconnect from any existing connection (like the one established in server.js import)
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }

    const mongooseOpts = {
        // Add any mongoose options here if needed
    };

    await mongoose.connect(uri, mongooseOpts);
};

/**
 * Drop database, close the connection and stop mongod.
 */
export const closeDatabase = async () => {
    if (mongod) {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
        await mongod.stop();
    }
};

/**
 * Remove all the data from all collections.
 */
export const clearDatabase = async () => {
    const collections = mongoose.connection.collections;

    for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany();
    }
};
