import { getDb } from './db';
import bcrypt from 'bcrypt';

export async function seedDatabase() {
  const db = await getDb();
  
  console.log('Seeding database...');
  
  // Check if database already has data
  const existingUsers = await db.all('SELECT * FROM users LIMIT 1');
  
  if (existingUsers.length > 0) {
    console.log('Database already seeded');
    return;
  }
  
  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const now = new Date().toISOString();
  
  const adminUser = await db.run(
    `INSERT INTO users (name, email, password, createdAt, updatedAt, isAdmin, isVerifiedOrganizer)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ['Admin User', 'admin@localist.com', adminPassword, now, now, true, true]
  );
  
  // Create regular users
  const userPassword = await bcrypt.hash('password123', 10);
  
  const johnUser = await db.run(
    `INSERT INTO users (name, email, password, phone, createdAt, updatedAt, isVerifiedOrganizer)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ['John Smith', 'john@example.com', userPassword, '555-123-4567', now, now, true]
  );
  
  const janeUser = await db.run(
    `INSERT INTO users (name, email, password, phone, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?)`,
    ['Jane Doe', 'jane@example.com', userPassword, '555-987-6543', now, now]
  );
  
  // Create events
  const events = [
    {
      title: 'Community Garage Sale',
      description: 'Join us for our annual community-wide garage sale! Find great deals on furniture, clothing, toys, and more. Over 30 households participating this year. Early birds welcome.',
      location: '123 Main Street, Anytown',
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(), // 4 hours after start
      category: 'garage_sale',
      imageUrl: '/images/garage-sale.jpg',
      isApproved: true,
      createdAt: now,
      updatedAt: now,
      organizerId: johnUser.lastID
    },
    {
      title: 'Pickup Basketball Game',
      description: 'Casual basketball game at the community court. All skill levels welcome! Bring water and proper shoes. We usually play full-court if enough people show up, otherwise half-court 3v3.',
      location: 'City Park Basketball Courts',
      startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
      endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(), // 2 hours after start
      category: 'sports',
      imageUrl: '/images/basketball.jpg',
      isApproved: true,
      createdAt: now,
      updatedAt: now,
      organizerId: johnUser.lastID
    },
    {
      title: 'Introduction to Gardening Workshop',
      description: 'Learn the basics of home gardening in this beginner-friendly workshop. Topics include soil preparation, planting techniques, watering, and pest control. All participants will take home starter plants!',
      location: 'Community Center - Room 12',
      startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks from now
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(), // 3 hours after start
      category: 'class',
      imageUrl: '/images/gardening.jpg',
      isApproved: true,
      registrationStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
      registrationEnd: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(), // 2 days before event
      createdAt: now,
      updatedAt: now,
      organizerId: johnUser.lastID
    },
    {
      title: 'Beach Cleanup Volunteer Day',
      description: 'Help keep our local beach clean! We will provide gloves, bags, and refreshments. Great opportunity for students needing community service hours. Please wear sunscreen and bring water.',
      location: 'Sunset Beach - Main Entrance',
      startDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days from now
      endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(), // 3 hours after start
      category: 'volunteer',
      imageUrl: '/images/beach-cleanup.jpg',
      isApproved: true,
      createdAt: now,
      updatedAt: now,
      organizerId: johnUser.lastID
    },
    {
      title: 'Local Artists Exhibition',
      description: 'Featuring works from over 20 local artists across various mediums including painting, sculpture, photography, and digital art. Wine and cheese reception included with admission.',
      location: 'Downtown Art Gallery',
      startDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(), // 3 weeks from now
      endDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(), // 1 week duration
      category: 'exhibition',
      imageUrl: '/images/art-exhibition.jpg',
      isApproved: true,
      createdAt: now,
      updatedAt: now,
      organizerId: johnUser.lastID
    },
    {
      title: 'Fall Harvest Festival',
      description: 'Celebrate the autumn season with our annual harvest festival! Activities include pumpkin picking, hayrides, corn maze, local food vendors, live music, and craft booths. Fun for the whole family!',
      location: 'Johnson Family Farm',
      startDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days from now
      endDate: new Date(Date.now() + 47 * 24 * 60 * 60 * 1000).toISOString(), // 3-day event
      category: 'festival',
      imageUrl: '/images/harvest-festival.jpg',
      isApproved: true,
      createdAt: now,
      updatedAt: now,
      organizerId: johnUser.lastID
    },
    {
      title: 'Neighborhood Block Party',
      description: 'Get to know your neighbors at our annual block party! Potluck style - please bring a dish to share. We will have games for kids, a grill for shared use, and music. BYOB for adults.',
      location: 'Oak Street (between 5th and 6th Ave)',
      startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
      endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000).toISOString(), // 6 hours after start
      category: 'festival',
      imageUrl: '/images/block-party.jpg',
      isApproved: false, // Pending approval
      createdAt: now,
      updatedAt: now,
      organizerId: janeUser.lastID
    }
  ];
  
  // Insert events
  for (const event of events) {
    await db.run(
      `INSERT INTO events (
        title, description, location, startDate, endDate, category, 
        imageUrl, isApproved, registrationStart, registrationEnd, 
        createdAt, updatedAt, organizerId
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        event.title,
        event.description,
        event.location,
        event.startDate,
        event.endDate,
        event.category,
        event.imageUrl,
        event.isApproved,
        event.registrationStart || null,
        event.registrationEnd || null,
        event.createdAt,
        event.updatedAt,
        event.organizerId
      ]
    );
  }
  
  // Create interests (registrations)
  const eventsResult = await db.all('SELECT id FROM events WHERE isApproved = 1 LIMIT 3');
  
  for (const event of eventsResult) {
    await db.run(
      `INSERT INTO interests (userId, eventId, numberOfPeople, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?)`,
      [janeUser.lastID, event.id, 2, now, now]
    );
  }
  
  console.log('Database seeded successfully!');
}

export default seedDatabase; 