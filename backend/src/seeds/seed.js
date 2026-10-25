import dotenv from 'dotenv';
import { connectDB, disconnectDB } from '../config/db.js';
import { Item } from '../models/Item.js';
import { hashCode } from '../utils/security.js';

dotenv.config();

const defaultManageCodeHash = hashCode('DEMO-1234');

const sampleItems = [
  {
    type: 'found',
    category: 'bag',
    color: 'blue',
    description: 'Waterproof nylon backpack with black zip and padded straps',
    location: 'Library 2nd floor desk',
    date: new Date('2026-10-23T14:30:00Z'),
    imageUrl: '/uploads/sample-backpack.jpg',
    currentLocation: 'Left at Library 2nd floor desk',
    contact: 'library.desk@campus.edu',
    status: 'active',
    manageCodeHash: defaultManageCodeHash
  },
  {
    type: 'lost',
    category: 'bottle',
    color: 'black',
    description: 'Stainless steel insulated flask with sports cap',
    location: 'Canteen sports ground',
    date: new Date('2026-10-22T11:00:00Z'),
    imageUrl: '/uploads/sample-bottle.jpg',
    contact: 'bottle.owner@campus.edu',
    status: 'active',
    manageCodeHash: defaultManageCodeHash
  },
  {
    type: 'lost',
    category: 'phone',
    color: 'grey',
    description: 'Grey case with cracked screen protector',
    location: 'CS Block Lab 3',
    date: new Date('2026-10-23T09:15:00Z'),
    imageUrl: '/uploads/sample-phone.jpg',
    contact: 'student.cs@campus.edu',
    status: 'active',
    manageCodeHash: defaultManageCodeHash
  },
  {
    type: 'found',
    category: 'umbrella',
    color: 'red',
    description: 'Compact folding umbrella with wooden handle',
    location: 'Main Gate security',
    date: new Date('2026-10-24T08:00:00Z'),
    imageUrl: '/uploads/sample-umbrella.jpg',
    currentLocation: 'Main Gate guard post',
    contact: 'security.gate@campus.edu',
    status: 'active',
    manageCodeHash: defaultManageCodeHash
  },
  {
    type: 'lost',
    category: 'bag',
    color: 'blue',
    description: 'Small blue canvas tote bag',
    location: 'Auditorium foyer',
    date: new Date('2026-10-20T16:00:00Z'),
    imageUrl: '/uploads/sample-tote.jpg',
    contact: 'student.arts@campus.edu',
    status: 'returned',
    manageCodeHash: defaultManageCodeHash
  }
];

export async function seedDatabase() {
  try {
    await connectDB();
    console.log('[Seed] Clearing existing items...');
    await Item.deleteMany({});
    
    console.log('[Seed] Inserting 5 initial items...');
    const inserted = await Item.insertMany(sampleItems);
    console.log(`[Seed] Successfully inserted ${inserted.length} items!`);
    
    return inserted;
  } catch (error) {
    console.error('[Seed Error] Failed to seed database:', error);
    throw error;
  } finally {
    await disconnectDB();
  }
}

// Run directly if called as a script
if (process.argv[1]?.endsWith('seed.js')) {
  seedDatabase()
    .then(() => {
      console.log('[Seed] Done!');
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
