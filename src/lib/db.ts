import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

// Create a singleton for the database connection
let db: Database | null = null;

export async function getDb() {
  if (!db) {
    // Open the database connection
    db = await open({
      filename: path.join(process.cwd(), 'database.sqlite'),
      driver: sqlite3.Database,
    });
    
    // Initialize the database with tables if they don't exist
    await initializeDatabase(db);
  }
  
  return db;
}

async function initializeDatabase(db: Database) {
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
}

// User Repository Functions
export const userRepository = {
  findUnique: async ({ where, include }: { where: { id?: number | string; email?: string }; include?: any }) => {
    const db = await getDb();
    let user = null;
    
    if (where.id) {
      // Convert string ID to number if needed
      const userId = typeof where.id === 'string' ? parseInt(where.id) : where.id;
      user = await db.get('SELECT * FROM users WHERE id = ?', userId);
    } else if (where.email) {
      user = await db.get('SELECT * FROM users WHERE email = ?', where.email);
    }
    
    return user;
  },
  
  findMany: async () => {
    const db = await getDb();
    return db.all('SELECT * FROM users');
  },
  
  create: async ({ data }: { data: any }) => {
    const db = await getDb();
    const now = new Date().toISOString();
    
    const result = await db.run(
      `INSERT INTO users (name, email, password, phone, createdAt, updatedAt, isAdmin, isVerifiedOrganizer, isBanned) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.name,
        data.email,
        data.password,
        data.phone || null,
        now,
        now,
        data.isAdmin || false,
        data.isVerifiedOrganizer || false,
        data.isBanned || false
      ]
    );
    
    return {
      id: result.lastID,
      ...data,
      createdAt: now,
      updatedAt: now
    };
  },
  
  update: async ({ where, data }: { where: { id: number }; data: any }) => {
    const db = await getDb();
    const user = await db.get('SELECT * FROM users WHERE id = ?', where.id);
    
    if (!user) return null;
    
    const now = new Date().toISOString();
    const updates = Object.entries(data)
      .filter(([key]) => key !== 'id')
      .map(([key, value]) => `${key} = ?`);
    
    const values = Object.entries(data)
      .filter(([key]) => key !== 'id')
      .map(([, value]) => value);
    
    await db.run(
      `UPDATE users SET ${updates.join(', ')}, updatedAt = ? WHERE id = ?`,
      [...values, now, where.id]
    );
    
    return {
      ...user,
      ...data,
      updatedAt: now
    };
  },
  
  delete: async ({ where }: { where: { id: number } }) => {
    const db = await getDb();
    return db.run('DELETE FROM users WHERE id = ?', where.id);
  }
};

// Event Repository Functions
export const eventRepository = {
  findUnique: async ({ where, include }: { where: { id?: number | string }; include?: any }) => {
    const db = await getDb();
    if (where.id) {
      // Convert string ID to number if needed
      const eventId = typeof where.id === 'string' ? parseInt(where.id) : where.id;
      const event = await db.get('SELECT * FROM events WHERE id = ?', eventId);
      
      if (event && include) {
        if (include.organizer) {
          const organizer = await db.get('SELECT id, name, email FROM users WHERE id = ?', event.organizerId);
          event.organizer = organizer;
        }
      }
      
      return event;
    }
    return null;
  },
  
  findMany: async (options: { 
    where?: any; 
    include?: any; 
    orderBy?: any;
    take?: number;
  } = {}) => {
    const db = await getDb();
    
    let query = 'SELECT * FROM events';
    const queryParams: any[] = [];
    
    // Handle where conditions
    if (options.where) {
      const whereConditions = [];
      
      if (options.where.isApproved !== undefined) {
        whereConditions.push('isApproved = ?');
        queryParams.push(options.where.isApproved);
      }
      
      if (options.where.category) {
        whereConditions.push('category = ?');
        queryParams.push(options.where.category);
      }
      
      if (options.where.startDate?.gte) {
        whereConditions.push('startDate >= ?');
        queryParams.push(options.where.startDate.gte.toISOString());
      }
      
      if (options.where.OR && Array.isArray(options.where.OR)) {
        const orConditions = options.where.OR.map((condition: any) => {
          if (condition.title?.contains) {
            queryParams.push(`%${condition.title.contains}%`);
            return 'title LIKE ?';
          }
          if (condition.description?.contains) {
            queryParams.push(`%${condition.description.contains}%`);
            return 'description LIKE ?';
          }
          if (condition.location?.contains) {
            queryParams.push(`%${condition.location.contains}%`);
            return 'location LIKE ?';
          }
          return null;
        }).filter(Boolean);
        
        if (orConditions.length > 0) {
          whereConditions.push(`(${orConditions.join(' OR ')})`);
        }
      }
      
      if (whereConditions.length > 0) {
        query += ' WHERE ' + whereConditions.join(' AND ');
      }
    }
    
    // Handle ordering
    if (options.orderBy) {
      const field = Object.keys(options.orderBy)[0];
      const order = options.orderBy[field];
      query += ` ORDER BY ${field} ${order === 'asc' ? 'ASC' : 'DESC'}`;
    }
    
    // Handle limit (take)
    if (options.take) {
      query += ` LIMIT ${options.take}`;
    }
    
    const events = await db.all(query, ...queryParams);
    
    // Include related data
    if (options.include) {
      if (options.include.organizer) {
        for (const event of events) {
          event.organizer = await db.get(
            'SELECT id, name, email FROM users WHERE id = ?', 
            event.organizerId
          );
        }
      }
      
      if (options.include.interests) {
        for (const event of events) {
          event.interests = await db.all('SELECT * FROM interests WHERE eventId = ?', event.id);
        }
      }
    }
    
    return events;
  },
  
  create: async ({ data }: { data: any }) => {
    const db = await getDb();
    const now = new Date().toISOString();
    
    const result = await db.run(
      `INSERT INTO events (
        title, description, location, startDate, endDate, category, 
        imageUrl, isApproved, registrationStart, registrationEnd, 
        createdAt, updatedAt, organizerId
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.title,
        data.description,
        data.location,
        data.startDate instanceof Date ? data.startDate.toISOString() : data.startDate,
        data.endDate instanceof Date ? data.endDate?.toISOString() : data.endDate,
        data.category,
        data.imageUrl || null,
        data.isApproved || false,
        data.registrationStart instanceof Date ? data.registrationStart?.toISOString() : data.registrationStart,
        data.registrationEnd instanceof Date ? data.registrationEnd?.toISOString() : data.registrationEnd,
        now,
        now,
        data.organizerId || data.authorId
      ]
    );
    
    return {
      id: result.lastID,
      ...data,
      createdAt: now,
      updatedAt: now
    };
  },
  
  update: async ({ where, data }: { where: { id: number }; data: any }) => {
    const db = await getDb();
    const event = await db.get('SELECT * FROM events WHERE id = ?', where.id);
    
    if (!event) return null;
    
    const now = new Date().toISOString();
    const updates = Object.entries(data)
      .filter(([key]) => key !== 'id')
      .map(([key, value]) => `${key} = ?`);
    
    const values = Object.entries(data)
      .filter(([key]) => key !== 'id')
      .map(([key, value]) => {
        if (value instanceof Date) {
          return value.toISOString();
        }
        return value;
      });
    
    await db.run(
      `UPDATE events SET ${updates.join(', ')}, updatedAt = ? WHERE id = ?`,
      [...values, now, where.id]
    );
    
    return {
      ...event,
      ...data,
      updatedAt: now
    };
  },
  
  delete: async ({ where }: { where: { id: number } }) => {
    const db = await getDb();
    return db.run('DELETE FROM events WHERE id = ?', where.id);
  }
};

// Interest Repository Functions
export const interestRepository = {
  findMany: async ({ where }: { where?: { userId?: number | string; eventId?: number | string } }) => {
    const db = await getDb();
    
    if (where?.userId) {
      // Convert string ID to number if needed
      const userId = typeof where.userId === 'string' ? parseInt(where.userId) : where.userId;
      return db.all('SELECT * FROM interests WHERE userId = ?', userId);
    } else if (where?.eventId) {
      // Convert string ID to number if needed
      const eventId = typeof where.eventId === 'string' ? parseInt(where.eventId) : where.eventId;
      return db.all('SELECT * FROM interests WHERE eventId = ?', eventId);
    }
    
    return db.all('SELECT * FROM interests');
  },
  
  create: async ({ data }: { data: any }) => {
    const db = await getDb();
    const now = new Date().toISOString();
    
    const result = await db.run(
      `INSERT INTO interests (userId, eventId, numberOfPeople, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)`,
      [data.userId, data.eventId, data.numberOfPeople || 1, now, now]
    );
    
    return {
      id: result.lastID,
      ...data,
      createdAt: now,
      updatedAt: now
    };
  },
  
  delete: async ({ where }: { where: { id?: number; userId?: number; eventId?: number } }) => {
    const db = await getDb();
    
    if (where.id) {
      return db.run('DELETE FROM interests WHERE id = ?', where.id);
    } else if (where.userId && where.eventId) {
      return db.run('DELETE FROM interests WHERE userId = ? AND eventId = ?', [where.userId, where.eventId]);
    }
    
    return null;
  }
};

// Notification Repository Functions
export const notificationRepository = {
  findMany: async ({ where }: { where: { userId: number } }) => {
    const db = await getDb();
    return db.all('SELECT * FROM notifications WHERE userId = ? ORDER BY createdAt DESC', where.userId);
  },
  
  create: async ({ data }: { data: any }) => {
    const db = await getDb();
    const now = new Date().toISOString();
    
    const result = await db.run(
      `INSERT INTO notifications (content, type, isRead, userId, eventId, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        data.content,
        data.type,
        data.isRead || false,
        data.userId,
        data.eventId || null,
        now,
        now
      ]
    );
    
    return {
      id: result.lastID,
      ...data,
      createdAt: now,
      updatedAt: now
    };
  },
  
  update: async ({ where, data }: { where: { id: number }; data: any }) => {
    const db = await getDb();
    const notification = await db.get('SELECT * FROM notifications WHERE id = ?', where.id);
    
    if (!notification) return null;
    
    const now = new Date().toISOString();
    const updates = Object.entries(data)
      .filter(([key]) => key !== 'id')
      .map(([key, value]) => `${key} = ?`);
    
    const values = Object.entries(data)
      .filter(([key]) => key !== 'id')
      .map(([, value]) => value);
    
    await db.run(
      `UPDATE notifications SET ${updates.join(', ')}, updatedAt = ? WHERE id = ?`,
      [...values, now, where.id]
    );
    
    return {
      ...notification,
      ...data,
      updatedAt: now
    };
  },
  
  delete: async ({ where }: { where: { id: number } }) => {
    const db = await getDb();
    return db.run('DELETE FROM notifications WHERE id = ?', where.id);
  }
};

// Fake Prisma client interface to minimize code changes
export default {
  user: userRepository,
  event: eventRepository,
  interest: interestRepository,
  notification: notificationRepository
}; 