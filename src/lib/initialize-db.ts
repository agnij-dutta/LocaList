import { getDb } from './db';

export async function initializeDatabase() {
  const db = await getDb();
  
  console.log('Dropping and recreating tables...');
  
  // Drop existing tables if they exist
  await db.exec('DROP TABLE IF EXISTS notifications');
  await db.exec('DROP TABLE IF EXISTS interests');
  await db.exec('DROP TABLE IF EXISTS events');
  await db.exec('DROP TABLE IF EXISTS users');
  
  // Create Users table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      phone TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      isAdmin BOOLEAN NOT NULL DEFAULT 0,
      isVerifiedOrganizer BOOLEAN NOT NULL DEFAULT 0,
      isBanned BOOLEAN NOT NULL DEFAULT 0
    )
  `);
  
  // Create Events table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      location TEXT NOT NULL,
      startDate TEXT NOT NULL,
      endDate TEXT,
      category TEXT NOT NULL,
      imageUrl TEXT,
      isApproved BOOLEAN NOT NULL DEFAULT 0,
      registrationStart TEXT,
      registrationEnd TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      organizerId INTEGER NOT NULL,
      FOREIGN KEY (organizerId) REFERENCES users (id)
    )
  `);
  
  // Create Interests table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS interests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      userId INTEGER NOT NULL,
      eventId INTEGER NOT NULL,
      numberOfPeople INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (userId) REFERENCES users (id),
      FOREIGN KEY (eventId) REFERENCES events (id)
    )
  `);
  
  // Create Notifications table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT NOT NULL,
      type TEXT NOT NULL,
      isRead BOOLEAN NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      userId INTEGER NOT NULL,
      eventId INTEGER,
      FOREIGN KEY (userId) REFERENCES users (id),
      FOREIGN KEY (eventId) REFERENCES events (id)
    )
  `);
  
  console.log('Database tables initialized successfully!');
}

export default initializeDatabase; 