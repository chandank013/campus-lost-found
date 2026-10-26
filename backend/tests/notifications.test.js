import test from 'node:test';
import assert from 'node:assert/strict';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import app from '../src/index.js';
import { User } from '../src/models/User.js';
import { Item } from '../src/models/Item.js';
import { Notification } from '../src/models/Notification.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('Campus & Targeted Match Notifications Suite', async (t) => {
  let mongoServer;
  let server;
  let baseUrl;
  const testImagePath = path.join(__dirname, 'test-notif-image.jpg');

  fs.writeFileSync(testImagePath, 'fake image data for testing');

  t.before(async () => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test_jwt_secret_key_antigravity_notifications';
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri, { dbName: 'campus_lost_found_notif_test' });

    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });
  });

  t.after(async () => {
    if (server) server.close();
    if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
      try {
        await mongoose.connection.db.dropDatabase();
      } catch {}
    }
    await mongoose.disconnect();
    if (mongoServer) await mongoServer.stop();
    if (fs.existsSync(testImagePath)) {
      try {
        fs.unlinkSync(testImagePath);
      } catch {}
    }
  });

  let tokenAlice;
  let userAlice;
  let tokenBob;
  let userBob;
  let tokenCharlie;
  let userCharlie;

  await t.test('Register demo users Alice, Bob, and Charlie', async () => {
    // Alice
    const resA = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alice@campus.edu', password: 'demopassword123' })
    });
    const dataA = await resA.json();
    assert.equal(resA.status, 201);
    tokenAlice = dataA.token;
    userAlice = dataA.user;

    // Bob
    const resB = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'bob@campus.edu', password: 'demopassword123' })
    });
    const dataB = await resB.json();
    assert.equal(resB.status, 201);
    tokenBob = dataB.token;
    userBob = dataB.user;

    // Charlie (third party)
    const resC = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'charlie@campus.edu', password: 'demopassword123' })
    });
    const dataC = await resC.json();
    assert.equal(resC.status, 201);
    tokenCharlie = dataC.token;
    userCharlie = dataC.user;
  });

  let lostBackpackId;

  await t.test('Alice uploads lost backpack -> generates broadcast notification to all', async () => {
    const formData = new FormData();
    formData.append('type', 'lost');
    formData.append('category', 'bag');
    formData.append('color', 'blue');
    formData.append('description', 'Navy blue laptop backpack');
    formData.append('location', 'Library 2nd Floor');
    formData.append('contact', 'alice@campus.edu');
    const imageBlob = new Blob([fs.readFileSync(testImagePath)], { type: 'image/jpeg' });
    formData.append('image', imageBlob, 'test-notif-image.jpg');

    const res = await fetch(`${baseUrl}/api/items`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenAlice}` },
      body: formData
    });
    const item = await res.json();
    assert.equal(res.status, 201);
    lostBackpackId = item._id;

    // Guest checks /api/notifications
    const guestNotifRes = await fetch(`${baseUrl}/api/notifications`);
    const guestNotifs = await guestNotifRes.json();
    assert.equal(guestNotifRes.status, 200);
    assert.equal(guestNotifs.notifications.length, 1);
    assert.equal(guestNotifs.notifications[0].type, 'broadcast');
    assert.equal(guestNotifs.notifications[0].title, 'New Lost Item Reported');
    assert.equal(guestNotifs.notifications[0].recipient, null);
  });

  await t.test('Bob uploads matching found backpack -> generates match notification for Alice & Bob ONLY', async () => {
    const formData = new FormData();
    formData.append('type', 'found');
    formData.append('category', 'bag');
    formData.append('color', 'blue');
    formData.append('description', 'Blue laptop backpack found by desk');
    formData.append('location', 'Library 2nd Floor desk');
    formData.append('contact', 'bob@campus.edu');
    const imageBlob = new Blob([fs.readFileSync(testImagePath)], { type: 'image/jpeg' });
    formData.append('image', imageBlob, 'test-notif-image.jpg');

    const res = await fetch(`${baseUrl}/api/items`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenBob}` },
      body: formData
    });
    assert.equal(res.status, 201);

    // 1. Check Alice's notifications (Lost item owner)
    const aliceRes = await fetch(`${baseUrl}/api/notifications`, {
      headers: { Authorization: `Bearer ${tokenAlice}` }
    });
    const aliceData = await aliceRes.json();
    const aliceMatches = aliceData.notifications.filter(n => n.type === 'match');
    assert.ok(aliceMatches.length >= 1, 'Alice should have received a targeted match notification');
    assert.equal(aliceMatches[0].recipient, userAlice.id);

    // 2. Check Bob's notifications (Found item reporter)
    const bobRes = await fetch(`${baseUrl}/api/notifications`, {
      headers: { Authorization: `Bearer ${tokenBob}` }
    });
    const bobData = await bobRes.json();
    const bobMatches = bobData.notifications.filter(n => n.type === 'match');
    assert.ok(bobMatches.length >= 1, 'Bob should have received a targeted match notification');
    assert.equal(bobMatches[0].recipient, userBob.id);

    // 3. Check Charlie's notifications (Unrelated third-party student)
    const charlieRes = await fetch(`${baseUrl}/api/notifications`, {
      headers: { Authorization: `Bearer ${tokenCharlie}` }
    });
    const charlieData = await charlieRes.json();
    const charlieMatches = charlieData.notifications.filter(n => n.type === 'match');
    assert.equal(charlieMatches.length, 0, 'Charlie MUST NOT receive any match notifications between Alice and Bob');

    // 4. Check Guest notifications (Not logged in)
    const guestRes = await fetch(`${baseUrl}/api/notifications`);
    const guestData = await guestRes.json();
    const guestMatches = guestData.notifications.filter(n => n.type === 'match');
    assert.equal(guestMatches.length, 0, 'Guests MUST NOT receive any match notifications');
    // Guests only see the 2 broadcast reports
    assert.equal(guestData.notifications.length, 2);
  });

  await t.test('Unread count persists and does not decrease by merely fetching notifications', async () => {
    const aliceRes = await fetch(`${baseUrl}/api/notifications`, {
      headers: { Authorization: `Bearer ${tokenAlice}` }
    });
    const aliceData = await aliceRes.json();
    assert.ok(aliceData.unreadCount > 0);

    // Fetching again preserves the unread count (no manual mark as done)
    const refreshedRes = await fetch(`${baseUrl}/api/notifications`, {
      headers: { Authorization: `Bearer ${tokenAlice}` }
    });
    const refreshedData = await refreshedRes.json();
    assert.equal(refreshedData.unreadCount, aliceData.unreadCount);
  });

  await t.test('Marking item as returned deducts notification count from BOTH after login and main dashboard', async () => {
    // Before return:
    const guestBefore = await fetch(`${baseUrl}/api/notifications`).then(r => r.json());
    const aliceBefore = await fetch(`${baseUrl}/api/notifications`, { headers: { Authorization: `Bearer ${tokenAlice}` } }).then(r => r.json());
    const initialGuestUnread = guestBefore.unreadCount;
    const initialAliceUnread = aliceBefore.unreadCount;

    // Alice marks her lost backpack as returned
    const returnRes = await fetch(`${baseUrl}/api/items/${lostBackpackId}/return`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenAlice}` }
    });
    assert.equal(returnRes.status, 200);

    // Check Alice after return (after login): unread count is deducted
    const aliceAfter = await fetch(`${baseUrl}/api/notifications`, { headers: { Authorization: `Bearer ${tokenAlice}` } }).then(r => r.json());
    assert.ok(aliceAfter.unreadCount < initialAliceUnread, 'Alice unread count should be deducted after item marked returned');

    // Check Guest after return (on main dashboard before login): unread count is deducted
    const guestAfter = await fetch(`${baseUrl}/api/notifications`).then(r => r.json());
    assert.ok(guestAfter.unreadCount < initialGuestUnread, 'Main dashboard unread count should be deducted after item marked returned');
  });
});
