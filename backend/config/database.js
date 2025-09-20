const mongoose = require('mongoose');

class DatabaseConnection {
  constructor() {
    this.connections = {};
  }

  async connect(dbName, uri) {
    try {
      if (!this.connections[dbName]) {
        const connection = await mongoose.createConnection(uri || process.env.MONGODB_URI, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
          maxPoolSize: 10,
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
        });

        connection.on('error', (error) => {
          console.error(`MongoDB connection error for ${dbName}:`, error);
        });

        connection.on('disconnected', () => {
          console.log(`MongoDB disconnected for ${dbName}`);
        });

        this.connections[dbName] = connection;
        console.log(`✅ MongoDB connected successfully for ${dbName}`);
      }
      
      return this.connections[dbName];
    } catch (error) {
      console.error(`❌ MongoDB connection failed for ${dbName}:`, error);
      throw error;
    }
  }

  getConnection(dbName) {
    return this.connections[dbName];
  }

  async closeAll() {
    for (const [name, connection] of Object.entries(this.connections)) {
      await connection.close();
      console.log(`MongoDB connection closed for ${name}`);
    }
    this.connections = {};
  }
}

module.exports = new DatabaseConnection();