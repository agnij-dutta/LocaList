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

// Migration function to handle schema updates
async function runMigrations(db: Database) {
  try {
    // Check if isEmailVerified column exists, if not add it
    const columns = await db.all("PRAGMA table_info(users)");
    const hasIsEmailVerified = columns.some(col => col.name === 'isEmailVerified');
    
    if (!hasIsEmailVerified) {
      await db.exec(`ALTER TABLE users ADD COLUMN isEmailVerified BOOLEAN NOT NULL DEFAULT 0`);
      console.log('Added isEmailVerified column to users table');
    }

    // Check if otpCode column exists, if not add it
    const hasOtpCode = columns.some(col => col.name === 'otpCode');
    if (!hasOtpCode) {
      await db.exec(`ALTER TABLE users ADD COLUMN otpCode TEXT`);
      console.log('Added otpCode column to users table');
    }

    // Check if otpExpiry column exists, if not add it
    const hasOtpExpiry = columns.some(col => col.name === 'otpExpiry');
    if (!hasOtpExpiry) {
      await db.exec(`ALTER TABLE users ADD COLUMN otpExpiry TEXT`);
      console.log('Added otpExpiry column to users table');
    }
  } catch (error) {
    console.error('Error running migrations:', error);
  }
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
      latitude REAL,
      longitude REAL,
      address TEXT,
      isEmailVerified BOOLEAN NOT NULL DEFAULT 0,
      otpCode TEXT,
      otpExpiry TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      isAdmin BOOLEAN NOT NULL DEFAULT 0,
      isVerifiedOrganizer BOOLEAN NOT NULL DEFAULT 0,
      isBanned BOOLEAN NOT NULL DEFAULT 0
    )
  `);
  
  // Run migrations to ensure compatibility with existing databases
  await runMigrations(db);
  
  // Create Temporary Users table for OTP verification
  await db.exec(`
    CREATE TABLE IF NOT EXISTS temp_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT,
      phone TEXT,
      otpCode TEXT NOT NULL,
      otpExpiry TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT
    )
  `);

  // Check if temp_users table needs password and phone columns
  try {
    const tempUsersColumns = await db.all("PRAGMA table_info(temp_users)");
    const hasPassword = tempUsersColumns.some(col => col.name === 'password');
    const hasPhone = tempUsersColumns.some(col => col.name === 'phone');
    
    if (!hasPassword) {
      await db.exec(`ALTER TABLE temp_users ADD COLUMN password TEXT`);
      console.log('Added password column to temp_users table');
    }
    
    if (!hasPhone) {
      await db.exec(`ALTER TABLE temp_users ADD COLUMN phone TEXT`);
      console.log('Added phone column to temp_users table');
    }
  } catch (error) {
    console.error('Error updating temp_users table:', error);
  }
  
  // Create Event Categories table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS event_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      isActive BOOLEAN NOT NULL DEFAULT 1,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);

  // Create Issue Categories table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS issue_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      isActive BOOLEAN NOT NULL DEFAULT 1,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);

  // Insert default event categories
  await db.exec(`
    INSERT OR IGNORE INTO event_categories (name, description, createdAt, updatedAt) VALUES
    ('Garage Sales', 'Community garage sales and yard sales', datetime('now'), datetime('now')),
    ('Sports Matches', 'Local sports events and matches', datetime('now'), datetime('now')),
    ('Community Classes', 'Educational classes and workshops', datetime('now'), datetime('now')),
    ('Volunteer Opportunities', 'Community volunteer work', datetime('now'), datetime('now')),
    ('Exhibitions', 'Art exhibitions and showcases', datetime('now'), datetime('now')),
    ('Small Festivals', 'Local festivals and celebrations', datetime('now'), datetime('now')),
    ('Lost & Found', 'Lost and found community posts', datetime('now'), datetime('now'))
  `);

  // Insert default issue categories
  await db.exec(`
    INSERT OR IGNORE INTO issue_categories (name, description, createdAt, updatedAt) VALUES
    ('Roads', 'Roads and infrastructure issues', datetime('now'), datetime('now')),
    ('Lighting', 'Street lighting problems', datetime('now'), datetime('now')),
    ('Water Supply', 'Water supply and drainage issues', datetime('now'), datetime('now')),
    ('Cleanliness', 'Cleanliness and waste management', datetime('now'), datetime('now')),
    ('Public Safety', 'Public safety concerns', datetime('now'), datetime('now')),
    ('Obstructions', 'Road and pathway obstructions', datetime('now'), datetime('now'))
  `);
  
  // Create Events table with enhanced features
  await db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      location TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      startDate TEXT NOT NULL,
      endDate TEXT,
      category TEXT NOT NULL,
      isUrgent BOOLEAN NOT NULL DEFAULT 0,
      imageUrl TEXT,
      additionalImages TEXT,
      isApproved BOOLEAN NOT NULL DEFAULT 0,
      isFlagged BOOLEAN NOT NULL DEFAULT 0,
      isPaid BOOLEAN NOT NULL DEFAULT 0,
      ticketTiers TEXT,
      registrationStart TEXT,
      registrationEnd TEXT,
      upvotes INTEGER DEFAULT 0,
      views INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      organizerId INTEGER NOT NULL,
      FOREIGN KEY (organizerId) REFERENCES users (id)
    )
  `);
  
  // Create Event Registrations table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS event_registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      eventId INTEGER NOT NULL,
      userId INTEGER NOT NULL,
      registeredAt TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'registered',
      FOREIGN KEY (eventId) REFERENCES events (id) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE,
      UNIQUE(eventId, userId)
    )
  `);
  
  // Create Event Photos table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS event_photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      eventId INTEGER NOT NULL,
      imageUrl TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (eventId) REFERENCES events (id) ON DELETE CASCADE
    )
  `);

  // Create Event Votes table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS event_votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      eventId INTEGER NOT NULL,
      userId INTEGER NOT NULL,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (eventId) REFERENCES events (id) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE,
      UNIQUE(eventId, userId)
    )
  `);

  // Create Event Followers table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS event_followers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      eventId INTEGER NOT NULL,
      userId INTEGER NOT NULL,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (eventId) REFERENCES events (id) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE,
      UNIQUE(eventId, userId)
    )
  `);

  // Create Issues table for community issue reporting
  await db.exec(`
    CREATE TABLE IF NOT EXISTS issues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      location TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'Reported',
      isAnonymous BOOLEAN NOT NULL DEFAULT 0,
      isFlagged BOOLEAN NOT NULL DEFAULT 0,
      upvotes INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      reporterId INTEGER,
      FOREIGN KEY (reporterId) REFERENCES users (id)
    )
  `);

  // Create Issue Photos table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS issue_photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      issueId INTEGER NOT NULL,
      imageUrl TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (issueId) REFERENCES issues (id) ON DELETE CASCADE
    )
  `);

  // Create Issue Votes table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS issue_votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      issueId INTEGER NOT NULL,
      userId INTEGER NOT NULL,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (issueId) REFERENCES issues (id) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE,
      UNIQUE(issueId, userId)
    )
  `);

  // Create Issue Followers table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS issue_followers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      issueId INTEGER NOT NULL,
      userId INTEGER NOT NULL,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (issueId) REFERENCES issues (id) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE,
      UNIQUE(issueId, userId)
    )
  `);

  // Create Issue Status Updates table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS issue_status_updates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      issueId INTEGER NOT NULL,
      status TEXT NOT NULL,
      comment TEXT,
      updatedById INTEGER,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (issueId) REFERENCES issues (id) ON DELETE CASCADE
    )
  `);
  
  // Create Interests table (enhanced with user details)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS interests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      eventId INTEGER NOT NULL,
      userName TEXT NOT NULL,
      userEmail TEXT NOT NULL,
      userPhone TEXT,
      numberOfPeople INTEGER NOT NULL DEFAULT 1,
      ticketTier TEXT,
      paymentStatus TEXT DEFAULT 'pending',
      paymentId TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users (id),
      FOREIGN KEY (eventId) REFERENCES events (id),
      UNIQUE(userId, eventId)
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
      issueId INTEGER,
      FOREIGN KEY (userId) REFERENCES users (id),
      FOREIGN KEY (eventId) REFERENCES events (id),
      FOREIGN KEY (issueId) REFERENCES issues (id)
    )
  `);

  // Create Event Feedback table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS event_feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      eventId INTEGER NOT NULL,
      userId INTEGER NOT NULL,
      rating TEXT NOT NULL,
      comment TEXT,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (eventId) REFERENCES events (id) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE,
      UNIQUE(eventId, userId)
    )
  `);

  // Create Community Guidelines Violations table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS violation_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reportedById INTEGER NOT NULL,
      contentType TEXT NOT NULL,
      contentId INTEGER NOT NULL,
      reason TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      createdAt TEXT NOT NULL,
      reviewedAt TEXT,
      reviewedById INTEGER,
      FOREIGN KEY (reportedById) REFERENCES users (id),
      FOREIGN KEY (reviewedById) REFERENCES users (id)
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
  
  findMany: async (options: { where?: any; take?: number } = {}) => {
    const db = await getDb();
    let query = 'SELECT * FROM users';
    const params: any[] = [];

    if (options.where) {
      const conditions = [];
      if (options.where.isAdmin !== undefined) {
        conditions.push('isAdmin = ?');
        params.push(options.where.isAdmin);
      }
      if (options.where.isBanned !== undefined) {
        conditions.push('isBanned = ?');
        params.push(options.where.isBanned);
      }
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
    }

    query += ' ORDER BY createdAt DESC';
    
    if (options.take) {
      query += ` LIMIT ${options.take}`;
    }

    return db.all(query, ...params);
  },
  
  create: async ({ data }: { data: any }) => {
    const db = await getDb();
    const now = new Date().toISOString();
    
    const result = await db.run(
      `INSERT INTO users (name, email, password, phone, latitude, longitude, address, isEmailVerified, otpCode, otpExpiry, createdAt, updatedAt, isAdmin, isVerifiedOrganizer, isBanned) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.name,
        data.email,
        data.password,
        data.phone || null,
        data.latitude || null,
        data.longitude || null,
        data.address || null,
        data.isEmailVerified || false,
        data.otpCode || null,
        data.otpExpiry || null,
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

// Temporary User Repository Functions for OTP verification
export const tempUserRepository = {
  create: async ({ data }: { data: any }) => {
    const db = await getDb();
    const now = new Date().toISOString();
    
    const result = await db.run(
      `INSERT INTO temp_users (name, email, password, phone, otpCode, otpExpiry, createdAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        data.name,
        data.email,
        data.password || null,
        data.phone || null,
        data.otpCode,
        data.otpExpiry,
        now
      ]
    );
    
    return {
      id: result.lastID,
      ...data,
      createdAt: now
    };
  },
  
  update: async ({ where, data }: { where: { email: string }; data: any }) => {
    const db = await getDb();
    const now = new Date().toISOString();
    
    const updates = [];
    const values = [];
    
    if (data.name !== undefined) {
      updates.push('name = ?');
      values.push(data.name);
    }
    if (data.password !== undefined) {
      updates.push('password = ?');
      values.push(data.password);
    }
    if (data.phone !== undefined) {
      updates.push('phone = ?');
      values.push(data.phone);
    }
    if (data.otpCode !== undefined) {
      updates.push('otpCode = ?');
      values.push(data.otpCode);
    }
    if (data.otpExpiry !== undefined) {
      updates.push('otpExpiry = ?');
      values.push(data.otpExpiry);
    }
    
    updates.push('updatedAt = ?');
    values.push(now);
    values.push(where.email);
    
    await db.run(
      `UPDATE temp_users SET ${updates.join(', ')} WHERE email = ?`,
      values
    );
    
    return {
      ...data,
      updatedAt: now
    };
  },
  
  findUnique: async ({ where }: { where: { email: string } }) => {
    const db = await getDb();
    return await db.get('SELECT * FROM temp_users WHERE email = ?', where.email);
  },
  
  delete: async ({ where }: { where: { email: string } }) => {
    const db = await getDb();
    return db.run('DELETE FROM temp_users WHERE email = ?', where.email);
  }
};

// Location utility function
export const locationUtils = {
  calculateDistance: (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in kilometers
  }
};

// Event Repository Functions (Enhanced)
export const eventRepository = {
  findUnique: async ({ where, include }: { where: { id?: number | string }; include?: any }) => {
    const db = await getDb();
    if (where.id) {
      // Convert string ID to number if needed
      const eventId = typeof where.id === 'string' ? parseInt(where.id) : where.id;
      const event = await db.get('SELECT * FROM events WHERE id = ?', eventId);
      
      if (event && include) {
        if (include.organizer) {
          const organizer = await db.get('SELECT id, name, email, isVerifiedOrganizer FROM users WHERE id = ?', event.organizerId);
          event.organizer = organizer;
        }
        if (include.interests) {
          event.interests = await db.all('SELECT * FROM interests WHERE eventId = ?', eventId);
        }
        if (include.photos) {
          event.photos = await db.all('SELECT * FROM event_photos WHERE eventId = ?', eventId);
        }
        if (include.votes) {
          event.votes = await db.all('SELECT * FROM event_votes WHERE eventId = ?', eventId);
        }
        if (include.followers) {
          event.followers = await db.all('SELECT * FROM event_followers WHERE eventId = ?', eventId);
        }
        if (include.feedback) {
          event.feedback = await db.all('SELECT * FROM event_feedback WHERE eventId = ?', eventId);
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
    skip?: number;
    userLocation?: { latitude: number; longitude: number };
    maxDistance?: number;
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
      
      if (options.where.isFlagged !== undefined) {
        whereConditions.push('isFlagged = ?');
        queryParams.push(options.where.isFlagged);
      }
      
      if (options.where.category) {
        whereConditions.push('category = ?');
        queryParams.push(options.where.category);
      }
      
      if (options.where.organizerId) {
        whereConditions.push('organizerId = ?');
        queryParams.push(options.where.organizerId);
      }
      
      if (options.where.startDate?.gte) {
        whereConditions.push('startDate >= ?');
        const dateValue = options.where.startDate.gte instanceof Date 
          ? options.where.startDate.gte.toISOString() 
          : options.where.startDate.gte;
        queryParams.push(dateValue);
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
      if (field === 'urgency') {
        query += ' ORDER BY isUrgent DESC, createdAt DESC';
      } else {
      query += ` ORDER BY ${field} ${order === 'asc' ? 'ASC' : 'DESC'}`;
      }
    } else {
      query += ' ORDER BY isUrgent DESC, createdAt DESC';
    }
    
    // Handle limit and offset (take and skip)
    if (options.take) {
      query += ` LIMIT ${options.take}`;
      if (options.skip) {
        query += ` OFFSET ${options.skip}`;
      }
    }
    
    let events = await db.all(query, ...queryParams);
    
    // Filter by location if specified
    if (options.userLocation && options.maxDistance) {
      events = events.filter(event => {
        const distance = locationUtils.calculateDistance(
          options.userLocation!.latitude,
          options.userLocation!.longitude,
          event.latitude,
          event.longitude
        );
        return distance <= options.maxDistance!;
      });
    }
    
    // Include related data
    if (options.include) {
      if (options.include.organizer) {
        for (const event of events) {
          event.organizer = await db.get(
            'SELECT id, name, email, isVerifiedOrganizer FROM users WHERE id = ?', 
            event.organizerId
          );
        }
      }
      
      if (options.include.interests) {
        for (const event of events) {
          event.interests = await db.all('SELECT * FROM interests WHERE eventId = ?', event.id);
        }
      }

      if (options.include.photos) {
        for (const event of events) {
          event.photos = await db.all('SELECT * FROM event_photos WHERE eventId = ?', event.id);
        }
      }

      if (options.include.votes) {
        for (const event of events) {
          event.votes = await db.all('SELECT * FROM event_votes WHERE eventId = ?', event.id);
        }
      }

      if (options.include.followers) {
        for (const event of events) {
          event.followers = await db.all('SELECT * FROM event_followers WHERE eventId = ?', event.id);
        }
      }

      if (options.include.feedback) {
        for (const event of events) {
          event.feedback = await db.all('SELECT * FROM event_feedback WHERE eventId = ?', event.id);
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
        title, description, location, latitude, longitude, startDate, endDate, category, 
        isUrgent, imageUrl, additionalImages, isApproved, isFlagged, isPaid, ticketTiers,
        registrationStart, registrationEnd, upvotes, views,
        createdAt, updatedAt, organizerId
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.title,
        data.description,
        data.location,
        data.latitude,
        data.longitude,
        data.startDate instanceof Date ? data.startDate.toISOString() : data.startDate,
        data.endDate instanceof Date ? data.endDate?.toISOString() : data.endDate,
        data.category,
        data.isUrgent || false,
        data.imageUrl || null,
        data.additionalImages ? JSON.stringify(data.additionalImages) : null,
        data.isApproved || false,
        data.isFlagged || false,
        data.isPaid || false,
        data.ticketTiers ? JSON.stringify(data.ticketTiers) : null,
        data.registrationStart instanceof Date ? data.registrationStart?.toISOString() : data.registrationStart,
        data.registrationEnd instanceof Date ? data.registrationEnd?.toISOString() : data.registrationEnd,
        0, // upvotes
        0, // views
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
        if (key === 'additionalImages' || key === 'ticketTiers') {
          return JSON.stringify(value);
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
  },

  incrementViews: async (eventId: number) => {
    const db = await getDb();
    await db.run('UPDATE events SET views = views + 1 WHERE id = ?', eventId);
  },

  updateUpvotes: async (eventId: number) => {
    const db = await getDb();
    const voteCount = await db.get('SELECT COUNT(*) as count FROM event_votes WHERE eventId = ?', eventId);
    await db.run('UPDATE events SET upvotes = ? WHERE id = ?', [voteCount.count, eventId]);
  },

  count: async (options: { 
    where?: any; 
    userLocation?: { latitude: number; longitude: number };
    maxDistance?: number;
  } = {}) => {
    const db = await getDb();
    
    let query = 'SELECT COUNT(*) as count FROM events';
    const queryParams: any[] = [];
    
    // Handle where conditions (same as findMany)
    if (options.where) {
      const whereConditions = [];
      
      if (options.where.isApproved !== undefined) {
        whereConditions.push('isApproved = ?');
        queryParams.push(options.where.isApproved);
      }
      
      if (options.where.isFlagged !== undefined) {
        whereConditions.push('isFlagged = ?');
        queryParams.push(options.where.isFlagged);
      }
      
      if (options.where.category) {
        whereConditions.push('category = ?');
        queryParams.push(options.where.category);
      }
      
      if (options.where.organizerId) {
        whereConditions.push('organizerId = ?');
        queryParams.push(options.where.organizerId);
      }
      
      if (options.where.startDate?.gte) {
        whereConditions.push('startDate >= ?');
        const dateValue = options.where.startDate.gte instanceof Date 
          ? options.where.startDate.gte.toISOString() 
          : options.where.startDate.gte;
        queryParams.push(dateValue);
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
    
    const result = await db.get(query, ...queryParams);
    
    // If location filtering is needed, we need to get all records and filter by distance
    if (options.userLocation && options.maxDistance) {
      const allEvents = await db.all('SELECT latitude, longitude FROM events' + 
        (options.where ? ' WHERE ' + query.split('WHERE ')[1]?.split(' ORDER BY')[0] : ''), 
        ...queryParams);
      
      const filteredCount = allEvents.filter(event => {
        const distance = locationUtils.calculateDistance(
          options.userLocation!.latitude,
          options.userLocation!.longitude,
          event.latitude,
          event.longitude
        );
        return distance <= options.maxDistance!;
      }).length;
      
      return filteredCount;
    }
    
    return result?.count || 0;
  }
};

// Event Votes Repository
export const eventVoteRepository = {
  create: async ({ data }: { data: { eventId: number; userId: number } }) => {
    const db = await getDb();
    const now = new Date().toISOString();
    
    try {
      const result = await db.run(
        'INSERT INTO event_votes (eventId, userId, createdAt) VALUES (?, ?, ?)',
        [data.eventId, data.userId, now]
      );
      
      // Update the event's upvote count
      await eventRepository.updateUpvotes(data.eventId);
      
      return {
        id: result.lastID,
        ...data,
        createdAt: now
      };
    } catch (error) {
      // Handle unique constraint violation
      return null;
    }
  },
  
  delete: async ({ where }: { where: { eventId: number; userId: number } }) => {
    const db = await getDb();
    const result = await db.run(
      'DELETE FROM event_votes WHERE eventId = ? AND userId = ?',
      [where.eventId, where.userId]
    );
    
    // Update the event's upvote count
    await eventRepository.updateUpvotes(where.eventId);
    
    return result;
  },
  
  findUnique: async ({ where }: { where: { eventId: number; userId: number } }) => {
    const db = await getDb();
    return db.get(
      'SELECT * FROM event_votes WHERE eventId = ? AND userId = ?',
      [where.eventId, where.userId]
    );
  }
};

// Event Followers Repository
export const eventFollowerRepository = {
  create: async ({ data }: { data: { eventId: number; userId: number } }) => {
    const db = await getDb();
    const now = new Date().toISOString();
    
    try {
      const result = await db.run(
        'INSERT INTO event_followers (eventId, userId, createdAt) VALUES (?, ?, ?)',
        [data.eventId, data.userId, now]
      );
      
      return {
        id: result.lastID,
        ...data,
        createdAt: now
      };
    } catch (error) {
      return null;
    }
  },
  
  delete: async ({ where }: { where: { eventId: number; userId: number } }) => {
    const db = await getDb();
    return db.run(
      'DELETE FROM event_followers WHERE eventId = ? AND userId = ?',
      [where.eventId, where.userId]
    );
  },
  
  findUnique: async ({ where }: { where: { eventId: number; userId: number } }) => {
    const db = await getDb();
    return db.get(
      'SELECT * FROM event_followers WHERE eventId = ? AND userId = ?',
      [where.eventId, where.userId]
    );
  }
};

// Event Photos Repository
export const eventPhotoRepository = {
  create: async ({ data }: { data: { eventId: number; imageUrl: string } }) => {
    const db = await getDb();
    const now = new Date().toISOString();
    
    const result = await db.run(
      'INSERT INTO event_photos (eventId, imageUrl, createdAt) VALUES (?, ?, ?)',
      [data.eventId, data.imageUrl, now]
    );
    
    return {
      id: result.lastID,
      ...data,
      createdAt: now
    };
  },
  
  findMany: async ({ where }: { where: { eventId: number } }) => {
    const db = await getDb();
    return db.all('SELECT * FROM event_photos WHERE eventId = ?', where.eventId);
  },
  
  delete: async ({ where }: { where: { id: number } }) => {
    const db = await getDb();
    return db.run('DELETE FROM event_photos WHERE id = ?', where.id);
  }
};

// Issues Repository
export const issueRepository = {
  findUnique: async ({ where, include }: { where: { id?: number | string }; include?: any }) => {
    const db = await getDb();
    if (where.id) {
      const issueId = typeof where.id === 'string' ? parseInt(where.id) : where.id;
      const issue = await db.get('SELECT * FROM issues WHERE id = ?', issueId);
      
      if (issue && include) {
        if (include.reporter && issue.reporterId) {
          const reporter = await db.get('SELECT id, name, email FROM users WHERE id = ?', issue.reporterId);
          issue.reporter = reporter;
        }
        if (include.photos) {
          issue.photos = await db.all('SELECT * FROM issue_photos WHERE issueId = ?', issueId);
        }
        if (include.votes) {
          issue.votes = await db.all('SELECT * FROM issue_votes WHERE issueId = ?', issueId);
        }
        if (include.followers) {
          issue.followers = await db.all('SELECT * FROM issue_followers WHERE issueId = ?', issueId);
        }
        if (include.statusUpdates) {
          issue.statusUpdates = await db.all('SELECT * FROM issue_status_updates WHERE issueId = ? ORDER BY createdAt DESC', issueId);
        }
      }
      
      return issue;
    }
    return null;
  },
  
  findMany: async (options: { 
    where?: any; 
    include?: any; 
    orderBy?: any;
    take?: number;
    skip?: number;
    userLocation?: { latitude: number; longitude: number };
    maxDistance?: number;
  } = {}) => {
    const db = await getDb();
    
    let query = 'SELECT * FROM issues';
    const queryParams: any[] = [];
    
    if (options.where) {
      const whereConditions = [];
      
      if (options.where.isFlagged !== undefined) {
        whereConditions.push('isFlagged = ?');
        queryParams.push(options.where.isFlagged);
      }
      
      if (options.where.category) {
        whereConditions.push('category = ?');
        queryParams.push(options.where.category);
      }
      
      if (options.where.status) {
        whereConditions.push('status = ?');
        queryParams.push(options.where.status);
      }
      
      if (options.where.reporterId) {
        whereConditions.push('reporterId = ?');
        queryParams.push(options.where.reporterId);
      }
      
      // Handle OR search conditions
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
    
    if (options.orderBy) {
      const field = Object.keys(options.orderBy)[0];
      const order = options.orderBy[field];
      query += ` ORDER BY ${field} ${order === 'asc' ? 'ASC' : 'DESC'}`;
    } else {
      query += ' ORDER BY upvotes DESC, createdAt DESC';
    }
    
    if (options.take) {
      query += ` LIMIT ${options.take}`;
      if (options.skip) {
        query += ` OFFSET ${options.skip}`;
      }
    }
    
    let issues = await db.all(query, ...queryParams);
    
    // Filter by location if specified
    if (options.userLocation && options.maxDistance) {
      issues = issues.filter(issue => {
        if (!issue.latitude || !issue.longitude) return false;
        const distance = locationUtils.calculateDistance(
          options.userLocation!.latitude,
          options.userLocation!.longitude,
          issue.latitude,
          issue.longitude
        );
        return distance <= options.maxDistance!;
      });
    }
    
    // Include related data
    if (options.include) {
      if (options.include.reporter) {
        for (const issue of issues) {
          if (issue.reporterId) {
            issue.reporter = await db.get(
              'SELECT id, name, email FROM users WHERE id = ?', 
              issue.reporterId
            );
          }
        }
      }
      
      if (options.include.photos) {
        for (const issue of issues) {
          issue.photos = await db.all('SELECT * FROM issue_photos WHERE issueId = ?', issue.id);
        }
      }
      
      if (options.include.votes) {
        for (const issue of issues) {
          issue.votes = await db.all('SELECT * FROM issue_votes WHERE issueId = ?', issue.id);
        }
      }
      
      if (options.include.followers) {
        for (const issue of issues) {
          issue.followers = await db.all('SELECT * FROM issue_followers WHERE issueId = ?', issue.id);
        }
      }
      
      if (options.include.statusUpdates) {
        for (const issue of issues) {
          issue.statusUpdates = await db.all('SELECT * FROM issue_status_updates WHERE issueId = ? ORDER BY createdAt DESC', issue.id);
        }
      }
    }
    
    return issues;
  },
  
  create: async ({ data }: { data: any }) => {
    const db = await getDb();
    const now = new Date().toISOString();
    
    const result = await db.run(
      `INSERT INTO issues (
        title, description, category, location, latitude, longitude, 
        status, isAnonymous, isFlagged, upvotes, 
        createdAt, updatedAt, reporterId
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.title,
        data.description,
        data.category,
        data.location,
        data.latitude,
        data.longitude,
        data.status || 'Reported',
        data.isAnonymous || false,
        data.isFlagged || false,
        0, // upvotes
        now,
        now,
        data.reporterId || null
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
    const issue = await db.get('SELECT * FROM issues WHERE id = ?', where.id);
    
    if (!issue) return null;
    
    const now = new Date().toISOString();
    const updates = Object.entries(data)
      .filter(([key]) => key !== 'id')
      .map(([key, value]) => `${key} = ?`);
    
    const values = Object.entries(data)
      .filter(([key]) => key !== 'id')
      .map(([, value]) => value);
    
    await db.run(
      `UPDATE issues SET ${updates.join(', ')}, updatedAt = ? WHERE id = ?`,
      [...values, now, where.id]
    );
    
    return {
      ...issue,
      ...data,
      updatedAt: now
    };
  },
  
  delete: async ({ where }: { where: { id: number } }) => {
    const db = await getDb();
    return db.run('DELETE FROM issues WHERE id = ?', where.id);
  },

  updateUpvotes: async (issueId: number) => {
    const db = await getDb();
    const voteCount = await db.get('SELECT COUNT(*) as count FROM issue_votes WHERE issueId = ?', issueId);
    await db.run('UPDATE issues SET upvotes = ? WHERE id = ?', [voteCount.count, issueId]);
  },

  count: async (options: { 
    where?: any; 
    userLocation?: { latitude: number; longitude: number };
    maxDistance?: number;
  } = {}) => {
    const db = await getDb();
    
    let query = 'SELECT COUNT(*) as count FROM issues';
    const queryParams: any[] = [];
    
    if (options.where) {
      const whereConditions = [];
      
      if (options.where.isFlagged !== undefined) {
        whereConditions.push('isFlagged = ?');
        queryParams.push(options.where.isFlagged);
      }
      
      if (options.where.category) {
        whereConditions.push('category = ?');
        queryParams.push(options.where.category);
      }
      
      if (options.where.status) {
        whereConditions.push('status = ?');
        queryParams.push(options.where.status);
      }
      
      if (options.where.reporterId) {
        whereConditions.push('reporterId = ?');
        queryParams.push(options.where.reporterId);
      }
      
      // Handle OR search conditions
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
    
    const result = await db.get(query, ...queryParams);
    
    // If location filtering is needed, we need to get all records and filter by distance
    if (options.userLocation && options.maxDistance) {
      const allIssues = await db.all('SELECT latitude, longitude FROM issues' + 
        (options.where ? ' WHERE ' + query.split('WHERE ')[1]?.split(' ORDER BY')[0] : ''), 
        ...queryParams);
      
      const filteredCount = allIssues.filter(issue => {
        if (!issue.latitude || !issue.longitude) return false;
        const distance = locationUtils.calculateDistance(
          options.userLocation!.latitude,
          options.userLocation!.longitude,
          issue.latitude,
          issue.longitude
        );
        return distance <= options.maxDistance!;
      }).length;
      
      return filteredCount;
    }
    
    return result?.count || 0;
  }
};

// Issue Votes Repository
export const issueVoteRepository = {
  create: async ({ data }: { data: { issueId: number; userId: number } }) => {
    const db = await getDb();
    const now = new Date().toISOString();
    
    try {
      const result = await db.run(
        'INSERT INTO issue_votes (issueId, userId, createdAt) VALUES (?, ?, ?)',
        [data.issueId, data.userId, now]
      );
      
      await issueRepository.updateUpvotes(data.issueId);
      
      return {
        id: result.lastID,
        ...data,
        createdAt: now
      };
    } catch (error) {
      return null;
    }
  },
  
  delete: async ({ where }: { where: { issueId: number; userId: number } }) => {
    const db = await getDb();
    const result = await db.run(
      'DELETE FROM issue_votes WHERE issueId = ? AND userId = ?',
      [where.issueId, where.userId]
    );
    
    await issueRepository.updateUpvotes(where.issueId);
    
    return result;
  },
  
  findUnique: async ({ where }: { where: { issueId: number; userId: number } }) => {
    const db = await getDb();
    return db.get(
      'SELECT * FROM issue_votes WHERE issueId = ? AND userId = ?',
      [where.issueId, where.userId]
    );
  }
};

// Issue Status Updates Repository
export const issueStatusUpdateRepository = {
  create: async ({ data }: { data: { issueId: number; status: string; comment?: string; updatedById?: number } }) => {
    const db = await getDb();
    const now = new Date().toISOString();
    
    const result = await db.run(
      'INSERT INTO issue_status_updates (issueId, status, comment, updatedById, createdAt) VALUES (?, ?, ?, ?, ?)',
      [data.issueId, data.status, data.comment || null, data.updatedById || null, now]
    );
    
    return {
      id: result.lastID,
      ...data,
      createdAt: now
    };
  },
  
  findMany: async ({ where }: { where: { issueId: number } }) => {
    const db = await getDb();
    return db.all('SELECT * FROM issue_status_updates WHERE issueId = ? ORDER BY createdAt DESC', where.issueId);
  }
};

// Interest Repository Functions (Enhanced)
export const interestRepository = {
  findMany: async ({ where }: { where?: { userId?: number | string; eventId?: number | string } }) => {
    const db = await getDb();
    
    if (where?.userId) {
      const userId = typeof where.userId === 'string' ? parseInt(where.userId) : where.userId;
      return db.all('SELECT * FROM interests WHERE userId = ?', userId);
    } else if (where?.eventId) {
      const eventId = typeof where.eventId === 'string' ? parseInt(where.eventId) : where.eventId;
      return db.all('SELECT * FROM interests WHERE eventId = ?', eventId);
    }
    
    return db.all('SELECT * FROM interests');
  },
  
  create: async ({ data }: { data: any }) => {
    const db = await getDb();
    const now = new Date().toISOString();
    
    try {
    const result = await db.run(
        `INSERT INTO interests (userId, eventId, userName, userEmail, userPhone, numberOfPeople, ticketTier, paymentStatus, paymentId, createdAt, updatedAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.userId, 
          data.eventId, 
          data.userName,
          data.userEmail,
          data.userPhone || null,
          data.numberOfPeople || 1, 
          data.ticketTier || null,
          data.paymentStatus || 'pending',
          data.paymentId || null,
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
    } catch (error) {
      // Handle unique constraint violation
      return null;
    }
  },
  
  update: async ({ where, data }: { where: { userId: number; eventId: number }; data: any }) => {
    const db = await getDb();
    const interest = await db.get('SELECT * FROM interests WHERE userId = ? AND eventId = ?', [where.userId, where.eventId]);
    
    if (!interest) return null;
    
    const now = new Date().toISOString();
    const updates = Object.entries(data)
      .filter(([key]) => key !== 'id' && key !== 'userId' && key !== 'eventId')
      .map(([key, value]) => `${key} = ?`);
    
    const values = Object.entries(data)
      .filter(([key]) => key !== 'id' && key !== 'userId' && key !== 'eventId')
      .map(([, value]) => value);
    
    await db.run(
      `UPDATE interests SET ${updates.join(', ')}, updatedAt = ? WHERE userId = ? AND eventId = ?`,
      [...values, now, where.userId, where.eventId]
    );
    
    return {
      ...interest,
      ...data,
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
  },

  findUnique: async ({ where }: { where: { userId: number; eventId: number } }) => {
    const db = await getDb();
    return db.get('SELECT * FROM interests WHERE userId = ? AND eventId = ?', [where.userId, where.eventId]);
  }
};

// Notification Repository Functions (Enhanced)
export const notificationRepository = {
  findMany: async ({ where }: { where: { userId: number } }) => {
    const db = await getDb();
    return db.all('SELECT * FROM notifications WHERE userId = ? ORDER BY createdAt DESC', where.userId);
  },
  
  create: async ({ data }: { data: any }) => {
    const db = await getDb();
    const now = new Date().toISOString();
    
    const result = await db.run(
      `INSERT INTO notifications (content, type, isRead, userId, eventId, issueId, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.content,
        data.type,
        data.isRead || false,
        data.userId,
        data.eventId || null,
        data.issueId || null,
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
  },

  markAllAsRead: async (userId: number) => {
    const db = await getDb();
    const now = new Date().toISOString();
    return db.run('UPDATE notifications SET isRead = 1, updatedAt = ? WHERE userId = ? AND isRead = 0', [now, userId]);
  }
};

// Event Feedback Repository
export const eventFeedbackRepository = {
  create: async ({ data }: { data: { eventId: number; userId: number; rating: string; comment?: string } }) => {
    const db = await getDb();
    const now = new Date().toISOString();
    
    try {
      const result = await db.run(
        'INSERT INTO event_feedback (eventId, userId, rating, comment, createdAt) VALUES (?, ?, ?, ?, ?)',
        [data.eventId, data.userId, data.rating, data.comment || null, now]
      );
      
      return {
        id: result.lastID,
        ...data,
        createdAt: now
      };
    } catch (error) {
      return null;
    }
  },
  
  findMany: async ({ where }: { where: { eventId: number } }) => {
    const db = await getDb();
    return db.all('SELECT * FROM event_feedback WHERE eventId = ? ORDER BY createdAt DESC', where.eventId);
  },
  
  findUnique: async ({ where }: { where: { eventId: number; userId: number } }) => {
    const db = await getDb();
    return db.get('SELECT * FROM event_feedback WHERE eventId = ? AND userId = ?', [where.eventId, where.userId]);
  }
};

// Violation Reports Repository
export const violationReportRepository = {
  create: async ({ data }: { data: any }) => {
    const db = await getDb();
    const now = new Date().toISOString();
    
    const result = await db.run(
      `INSERT INTO violation_reports (reportedById, contentType, contentId, reason, description, status, createdAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        data.reportedById,
        data.contentType,
        data.contentId,
        data.reason,
        data.description || null,
        'pending',
        now
      ]
    );
    
    return {
      id: result.lastID,
      ...data,
      status: 'pending',
      createdAt: now
    };
  },
  
  findMany: async (options: { where?: any; orderBy?: any; take?: number } = {}) => {
    const db = await getDb();
    
    let query = 'SELECT * FROM violation_reports';
    const params: any[] = [];
    
    if (options.where) {
      const conditions = [];
      if (options.where.status) {
        conditions.push('status = ?');
        params.push(options.where.status);
      }
      if (options.where.contentType) {
        conditions.push('contentType = ?');
        params.push(options.where.contentType);
      }
      if (options.where.contentId) {
        conditions.push('contentId = ?');
        params.push(options.where.contentId);
      }
      if (options.where.reportedById) {
        conditions.push('reportedById = ?');
        params.push(options.where.reportedById);
      }
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
    }
    
    query += ' ORDER BY createdAt DESC';
    
    if (options.take) {
      query += ` LIMIT ${options.take}`;
    }
    
    return db.all(query, ...params);
  },
  
  findUnique: async ({ where }: { where: { id: number } }) => {
    const db = await getDb();
    return db.get('SELECT * FROM violation_reports WHERE id = ?', where.id);
  },
  
  update: async ({ where, data }: { where: { id: number }; data: any }) => {
    const db = await getDb();
    const report = await db.get('SELECT * FROM violation_reports WHERE id = ?', where.id);
    
    if (!report) return null;
    
    const now = new Date().toISOString();
    const updates = Object.entries(data)
      .filter(([key]) => key !== 'id')
      .map(([key, value]) => `${key} = ?`);
    
    const values = Object.entries(data)
      .filter(([key]) => key !== 'id')
      .map(([, value]) => value);
    
    if (data.status) {
      updates.push('reviewedAt = ?');
      values.push(now);
    }
    
    await db.run(
      `UPDATE violation_reports SET ${updates.join(', ')} WHERE id = ?`,
      [...values, where.id]
    );
    
    return {
      ...report,
      ...data,
      reviewedAt: data.status ? now : report.reviewedAt
    };
  },
  
  delete: async ({ where }: { where: { id: number } }) => {
    const db = await getDb();
    return db.run('DELETE FROM violation_reports WHERE id = ?', where.id);
  }
};

// Issue Photos Repository  
export const issuePhotoRepository = {
  create: async ({ data }: { data: { issueId: number; imageUrl: string } }) => {
    const db = await getDb();
    const now = new Date().toISOString();
    
    const result = await db.run(
      'INSERT INTO issue_photos (issueId, imageUrl, createdAt) VALUES (?, ?, ?)',
      [data.issueId, data.imageUrl, now]
    );
    
    return {
      id: result.lastID,
      ...data,
      createdAt: now
    };
  },
  
  findMany: async ({ where }: { where: { issueId: number } }) => {
    const db = await getDb();
    return db.all('SELECT * FROM issue_photos WHERE issueId = ?', where.issueId);
  },
  
  delete: async ({ where }: { where: { id: number } }) => {
    const db = await getDb();
    return db.run('DELETE FROM issue_photos WHERE id = ?', where.id);
  }
};

// Event Categories Repository
export const eventCategoryRepository = {
  findMany: async (options: { where?: any; orderBy?: any } = {}) => {
    const db = await getDb();
    let query = 'SELECT * FROM event_categories';
    const params: any[] = [];
    
    if (options.where) {
      const conditions = [];
      if (options.where.isActive !== undefined) {
        conditions.push('isActive = ?');
        params.push(options.where.isActive);
      }
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
    }
    
    query += ' ORDER BY name ASC';
    return db.all(query, ...params);
  },
  
  findUnique: async ({ where }: { where: { id?: number; name?: string } }) => {
    const db = await getDb();
    if (where.id) {
      return db.get('SELECT * FROM event_categories WHERE id = ?', where.id);
    }
    if (where.name) {
      return db.get('SELECT * FROM event_categories WHERE name = ?', where.name);
    }
    return null;
  },
  
  create: async ({ data }: { data: { name: string; description?: string } }) => {
    const db = await getDb();
    const now = new Date().toISOString();
    
    const result = await db.run(
      'INSERT INTO event_categories (name, description, createdAt, updatedAt) VALUES (?, ?, ?, ?)',
      [data.name, data.description || null, now, now]
    );
    
    return {
      id: result.lastID,
      ...data,
      isActive: true,
      createdAt: now,
      updatedAt: now
    };
  },
  
  update: async ({ where, data }: { where: { id: number }; data: any }) => {
    const db = await getDb();
    const now = new Date().toISOString();
    
    const updates = Object.entries(data)
      .filter(([key]) => key !== 'id')
      .map(([key]) => `${key} = ?`);
    
    const values = Object.entries(data)
      .filter(([key]) => key !== 'id')
      .map(([, value]) => value);
    
    await db.run(
      `UPDATE event_categories SET ${updates.join(', ')}, updatedAt = ? WHERE id = ?`,
      [...values, now, where.id]
    );
    
    return { id: where.id, ...data, updatedAt: now };
  },
  
  delete: async ({ where }: { where: { id: number } }) => {
    const db = await getDb();
    return db.run('DELETE FROM event_categories WHERE id = ?', where.id);
  }
};

// Issue Categories Repository
export const issueCategoryRepository = {
  findMany: async (options: { where?: any; orderBy?: any } = {}) => {
    const db = await getDb();
    let query = 'SELECT * FROM issue_categories';
    const params: any[] = [];
    
    if (options.where) {
      const conditions = [];
      if (options.where.isActive !== undefined) {
        conditions.push('isActive = ?');
        params.push(options.where.isActive);
      }
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
    }
    
    query += ' ORDER BY name ASC';
    return db.all(query, ...params);
  },
  
  findUnique: async ({ where }: { where: { id?: number; name?: string } }) => {
    const db = await getDb();
    if (where.id) {
      return db.get('SELECT * FROM issue_categories WHERE id = ?', where.id);
    }
    if (where.name) {
      return db.get('SELECT * FROM issue_categories WHERE name = ?', where.name);
    }
    return null;
  },
  
  create: async ({ data }: { data: { name: string; description?: string } }) => {
    const db = await getDb();
    const now = new Date().toISOString();
    
    const result = await db.run(
      'INSERT INTO issue_categories (name, description, createdAt, updatedAt) VALUES (?, ?, ?, ?)',
      [data.name, data.description || null, now, now]
    );
    
    return {
      id: result.lastID,
      ...data,
      isActive: true,
      createdAt: now,
      updatedAt: now
    };
  },
  
  update: async ({ where, data }: { where: { id: number }; data: any }) => {
    const db = await getDb();
    const now = new Date().toISOString();
    
    const updates = Object.entries(data)
      .filter(([key]) => key !== 'id')
      .map(([key]) => `${key} = ?`);
    
    const values = Object.entries(data)
      .filter(([key]) => key !== 'id')
      .map(([, value]) => value);
    
    await db.run(
      `UPDATE issue_categories SET ${updates.join(', ')}, updatedAt = ? WHERE id = ?`,
      [...values, now, where.id]
    );
    
    return { id: where.id, ...data, updatedAt: now };
  },
  
  delete: async ({ where }: { where: { id: number } }) => {
    const db = await getDb();
    return db.run('DELETE FROM issue_categories WHERE id = ?', where.id);
  }
};

// Event Registrations Repository
export const eventRegistrationRepository = {
  findMany: async ({ where }: { where: { eventId?: number; userId?: number } }) => {
    const db = await getDb();
    
    if (where.eventId) {
      const registrations = await db.all(`
        SELECT er.*, u.name, u.email, u.phone 
        FROM event_registrations er 
        JOIN users u ON er.userId = u.id 
        WHERE er.eventId = ? 
        ORDER BY er.registeredAt DESC
      `, where.eventId);
      return registrations;
    }
    
    if (where.userId) {
      const registrations = await db.all(`
        SELECT er.*, e.title, e.startDate, e.location 
        FROM event_registrations er 
        JOIN events e ON er.eventId = e.id 
        WHERE er.userId = ? 
        ORDER BY er.registeredAt DESC
      `, where.userId);
      return registrations;
    }
    
    return [];
  },
  
  findUnique: async ({ where }: { where: { eventId: number; userId: number } }) => {
    const db = await getDb();
    return db.get('SELECT * FROM event_registrations WHERE eventId = ? AND userId = ?', [where.eventId, where.userId]);
  },
  
  create: async ({ data }: { data: { eventId: number; userId: number } }) => {
    const db = await getDb();
    const now = new Date().toISOString();
    
    try {
      const result = await db.run(
        'INSERT INTO event_registrations (eventId, userId, registeredAt) VALUES (?, ?, ?)',
        [data.eventId, data.userId, now]
      );
      
      return {
        id: result.lastID,
        ...data,
        registeredAt: now,
        status: 'registered'
      };
    } catch (error) {
      return null; // Registration already exists
    }
  },
  
  delete: async ({ where }: { where: { eventId: number; userId: number } }) => {
    const db = await getDb();
    return db.run('DELETE FROM event_registrations WHERE eventId = ? AND userId = ?', [where.eventId, where.userId]);
  },
  
  count: async ({ where }: { where: { eventId: number } }) => {
    const db = await getDb();
    const result = await db.get('SELECT COUNT(*) as count FROM event_registrations WHERE eventId = ?', where.eventId);
    return result?.count || 0;
  }
};

// Create a default export for the db connection with all repositories
const dbClient = {
  user: userRepository,
  tempUser: tempUserRepository,
  event: eventRepository,
  eventPhoto: eventPhotoRepository,
  eventVote: eventVoteRepository,
  eventFollower: eventFollowerRepository,
  eventFeedback: eventFeedbackRepository,
  issue: issueRepository,
  issuePhoto: issuePhotoRepository,
  issueVote: issueVoteRepository,
  issueStatusUpdate: issueStatusUpdateRepository,
  interest: interestRepository,
  notification: notificationRepository,
  violationReport: violationReportRepository,
  eventCategory: eventCategoryRepository,
  issueCategory: issueCategoryRepository,
  eventRegistration: eventRegistrationRepository,
};

export default dbClient; 