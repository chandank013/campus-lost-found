import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { connectDB, disconnectDB } from '../config/db.js';
import { Item } from '../models/Item.js';
import { User } from '../models/User.js';
import { hashAnswer } from '../utils/security.js';

dotenv.config();

export const DEMO_PASSWORD = 'demopassword123';

export async function seedDatabase() {
  try {
    await connectDB();
    console.log('[Seed] Clearing existing items and users...');
    await Item.deleteMany({});
    await User.deleteMany({});

    console.log('[Seed] Creating demo users...');
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

    const alice = await User.create({
      email: 'alice@campus.edu',
      passwordHash
    });

    const bob = await User.create({
      email: 'bob@campus.edu',
      passwordHash
    });

    console.log(`[Seed] Created demo users: ${alice.email} and ${bob.email}`);

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
        contact: 'alice@campus.edu',
        status: 'active',
        owner: alice._id
      },
      {
        type: 'lost',
        category: 'bottle',
        color: 'black',
        description: 'Stainless steel insulated flask with sports cap',
        location: 'Canteen sports ground',
        date: new Date('2026-10-22T11:00:00Z'),
        imageUrl: '/uploads/sample-bottle.jpg',
        contact: 'bob@campus.edu',
        status: 'active',
        owner: bob._id
      },
      {
        type: 'lost',
        category: 'phone',
        color: 'grey',
        description: 'Grey case with cracked screen protector',
        location: 'CS Block Lab 3',
        date: new Date('2026-10-23T09:15:00Z'),
        imageUrl: '/uploads/sample-phone.jpg',
        contact: 'alice@campus.edu',
        status: 'active',
        owner: alice._id
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
        contact: 'bob@campus.edu',
        status: 'active',
        owner: bob._id,
        privateQuestion: 'What brand is carved on the wooden handle?',
        privateAnswerHash: hashAnswer('Totes')
      },
      {
        type: 'lost',
        category: 'bag',
        color: 'blue',
        description: 'Small blue canvas tote bag',
        location: 'Auditorium foyer',
        date: new Date('2026-10-20T16:00:00Z'),
        imageUrl: '/uploads/sample-tote.jpg',
        contact: 'alice@campus.edu',
        status: 'returned',
        owner: alice._id
      }
    ];

    console.log('[Seed] Inserting 5 initial items with demo owners...');
    const inserted = await Item.insertMany(sampleItems);
    console.log(`[Seed] Successfully inserted ${inserted.length} items!`);

    return { users: [alice, bob], items: inserted };
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
