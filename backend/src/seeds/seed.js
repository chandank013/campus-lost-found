import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { connectDB, disconnectDB } from '../config/db.js';
import { Item } from '../models/Item.js';
import { User } from '../models/User.js';
import { Notification } from '../models/Notification.js';
import { hashAnswer } from '../utils/security.js';

dotenv.config();

export const DEMO_PASSWORD = 'demopassword123';

export async function seedDatabase() {
  try {
    await connectDB();
    console.log('[Seed] Clearing existing items, users, and notifications...');
    await Item.deleteMany({});
    await User.deleteMany({});
    await Notification.deleteMany({});

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
      },
      {
        type: 'lost',
        category: 'earbuds',
        color: 'white',
        description: 'White wireless earbuds in a glossy magnetic charging case with a small scratch on the lid',
        location: 'Library 2nd Floor Study Room',
        date: new Date('2026-10-25T14:15:00Z'),
        imageUrl: '/uploads/sample-earbuds.jpg',
        contact: 'alice@campus.edu',
        status: 'active',
        owner: alice._id
      },
      {
        type: 'found',
        category: 'airphone',
        color: 'white',
        description: 'White wireless earbuds charging case left on study table with magnetic lid',
        location: 'Library 2nd Floor desk',
        date: new Date('2026-10-25T16:45:00Z'),
        imageUrl: '/uploads/sample-earbuds.jpg',
        currentLocation: 'Left with Library 2nd floor front desk attendant',
        contact: 'bob@campus.edu',
        status: 'active',
        owner: bob._id,
        privateQuestion: 'What color is the protective silicone case cover?',
        privateAnswerHash: hashAnswer('blue')
      },
      {
        type: 'lost',
        category: 'headphone',
        color: 'black',
        description: 'Matte black over-ear noise-cancelling headphones with cushioned headband',
        location: 'Student Activity Center Gym',
        date: new Date('2026-10-24T18:20:00Z'),
        imageUrl: '/uploads/sample-headphones.jpg',
        contact: 'alice@campus.edu',
        status: 'active',
        owner: alice._id
      },
      {
        type: 'found',
        category: 'headphone',
        color: 'black',
        description: 'Black wireless over-ear headphones with soft cushioned ear pads',
        location: 'Student Activity Center lobby',
        date: new Date('2026-10-25T10:00:00Z'),
        imageUrl: '/uploads/sample-headphones.jpg',
        currentLocation: 'Security office at Student Activity Center',
        contact: 'bob@campus.edu',
        status: 'active',
        owner: bob._id
      }
    ];

    console.log(`[Seed] Inserting ${sampleItems.length} initial items with demo owners...`);
    const inserted = await Item.insertMany(sampleItems);
    console.log(`[Seed] Successfully inserted ${inserted.length} items!`);

    // Seed realistic sample notifications
    console.log('[Seed] Seeding sample campus and match notifications...');
    const lostEarbuds = inserted.find(i => i.category === 'earbuds');
    const foundAirphone = inserted.find(i => i.category === 'airphone');
    const lostHeadphones = inserted.find(i => i.category === 'headphone' && i.type === 'lost');
    const foundHeadphones = inserted.find(i => i.category === 'headphone' && i.type === 'found');

    const sampleNotifications = [
      // 1. Broadcast notification to ALL users
      {
        type: 'broadcast',
        recipient: null,
        title: 'New Found Item Reported',
        message: 'White wireless earbuds charging case left on study table at Library 2nd Floor desk',
        item: foundAirphone?._id || inserted[0]._id,
        createdAt: new Date(Date.now() - 1000 * 60 * 15) // 15 mins ago
      },
      // 2. Broadcast notification to ALL users
      {
        type: 'broadcast',
        recipient: null,
        title: 'New Lost Item Reported',
        message: 'Matte black over-ear noise-cancelling headphones at Student Activity Center Gym',
        item: lostHeadphones?._id || inserted[1]._id,
        createdAt: new Date(Date.now() - 1000 * 60 * 45) // 45 mins ago
      }
    ];

    // 3. Targeted match notification to Alice (person who lost earbuds)
    if (lostEarbuds && foundAirphone) {
      sampleNotifications.push({
        type: 'match',
        recipient: alice._id,
        title: 'Potential Match for Your Lost Earbuds!',
        message: 'A found airphone ("White wireless earbuds charging case...") matches your report (Good match • 65% score).',
        item: foundAirphone._id,
        matchedItem: lostEarbuds._id,
        matchScore: 65,
        matchTier: 'Good match',
        createdAt: new Date(Date.now() - 1000 * 60 * 12)
      });
    }

    // 4. Targeted match notification to Bob (founder of airphone)
    if (lostEarbuds && foundAirphone) {
      sampleNotifications.push({
        type: 'match',
        recipient: bob._id,
        title: 'New Potential Match for Your Found Airphone!',
        message: 'A lost earbuds ("White wireless earbuds in a glossy white case...") matches your report (Good match • 65% score).',
        item: lostEarbuds._id,
        matchedItem: foundAirphone._id,
        matchScore: 65,
        matchTier: 'Good match',
        createdAt: new Date(Date.now() - 1000 * 60 * 12)
      });
    }

    // 5. Targeted match notification for headphones if available
    if (lostHeadphones && foundHeadphones) {
      sampleNotifications.push({
        type: 'match',
        recipient: alice._id,
        title: 'Strong Match for Your Lost Headphones!',
        message: 'A found headphone ("Black wireless over-ear headphones...") matches your report (Strong match • 75% score).',
        item: foundHeadphones._id,
        matchedItem: lostHeadphones._id,
        matchScore: 75,
        matchTier: 'Strong match',
        createdAt: new Date(Date.now() - 1000 * 60 * 30)
      });
    }

    await Notification.insertMany(sampleNotifications);
    console.log(`[Seed] Seeded ${sampleNotifications.length} notifications (broadcast + targeted matches)!`);

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
