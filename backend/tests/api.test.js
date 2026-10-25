import test from 'node:test';
import assert from 'node:assert/strict';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import app from '../src/index.js';
import { Item } from '../src/models/Item.js';
import { User } from '../src/models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('Backend API & Contact Privacy Lifecycle', async (t) => {
  let mongoServer;
  let server;
  let baseUrl;
  let userToken;
  let userId;
  let createdItemId;
  const testImagePath = path.join(__dirname, 'test-image.jpg');

  // Create temporary test image
  fs.writeFileSync(testImagePath, 'fake image content for testing');

  t.before(async () => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test_jwt_secret_lifecycle_2026';
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri, { dbName: 'campus_lost_found_test' });

    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });

    // Register test user
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'tester@campus.edu',
        password: 'password1234'
      })
    });
    const data = await res.json();
    userToken = data.token;
    userId = data.user.id;
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
    if (fs.existsSync(testImagePath)) fs.unlinkSync(testImagePath);
  });

  await t.test('POST /api/items creates item with authenticated user, omits contact and hashes', async () => {
    const formData = new FormData();
    formData.append('type', 'lost');
    formData.append('category', 'bag');
    formData.append('color', 'blue');
    formData.append('description', 'Blue backpack with black zip');
    formData.append('location', 'Library 2nd floor');
    formData.append('contact', 'student@campus.edu');
    formData.append('image', new Blob([fs.readFileSync(testImagePath)], { type: 'image/jpeg' }), 'test-backpack.jpg');

    const res = await fetch(`${baseUrl}/api/items`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${userToken}` },
      body: formData
    });

    assert.equal(res.status, 201);
    const data = await res.json();
    assert.ok(data._id);
    createdItemId = data._id;
    assert.equal(data.category, 'bag');
    assert.equal(data.color, 'blue');
    assert.equal(data.owner, userId);
    assert.equal(data.contact, undefined, 'contact MUST NOT be in response');
    assert.equal(data.manageCode, undefined, 'manageCode logic is removed');
    assert.equal(data.manageCodeHash, undefined, 'manageCodeHash MUST NOT be in response');
    assert.equal(data.privateAnswerHash, undefined, 'privateAnswerHash MUST NOT be in response');
  });

  await t.test('GET /api/items returns public feed strictly excluding contact, code hash, and answer hash', async () => {
    const res = await fetch(`${baseUrl}/api/items`);
    assert.equal(res.status, 200);
    const items = await res.json();
    assert.ok(items.length >= 1);
    assert.equal(items[0].contact, undefined, 'contact MUST NOT be in feed payload');
    assert.equal(items[0].manageCode, undefined);
    assert.equal(items[0].manageCodeHash, undefined);
    assert.equal(items[0].privateAnswerHash, undefined);
  });

  await t.test('GET /api/items/:id excludes contact, code hash, and answer hash', async () => {
    const res = await fetch(`${baseUrl}/api/items/${createdItemId}`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.category, 'bag');
    assert.equal(data.contact, undefined, 'contact MUST NOT be in detail payload');
    assert.equal(data.manageCode, undefined);
    assert.equal(data.manageCodeHash, undefined);
    assert.equal(data.privateAnswerHash, undefined);
  });

  await t.test('POST /api/items/:id/reveal-contact reveals contact directly when item has no private question', async () => {
    const res = await fetch(`${baseUrl}/api/items/${createdItemId}/reveal-contact`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${userToken}` }
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.contact, 'student@campus.edu');
    assert.equal(data.manageCodeHash, undefined);
    assert.equal(data.privateAnswerHash, undefined);
  });

  await t.test('PATCH /api/items/:id/return marks item returned when called by owner', async () => {
    const res = await fetch(`${baseUrl}/api/items/${createdItemId}/return`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      }
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.item.status, 'returned');
    assert.equal(data.item.contact, undefined, 'contact MUST NOT be in return response');
    assert.equal(data.item.privateAnswerHash, undefined, 'privateAnswerHash MUST NOT be in return response');
  });

  // --- Found Item Private Verification Challenge Tests ---
  let challengedItemId;

  await t.test('POST /api/items creates found item with private question and answer', async () => {
    const formData = new FormData();
    formData.append('type', 'found');
    formData.append('category', 'laptop');
    formData.append('color', 'grey');
    formData.append('description', 'MacBook Air found in Library quiet room');
    formData.append('location', 'Library 3rd floor');
    formData.append('contact', 'finder@campus.edu');
    formData.append('currentLocation', 'Library security desk');
    formData.append('privateQuestion', 'What sticker is next to the trackpad?');
    formData.append('privateAnswer', '  NASA Astronaut  ');
    formData.append('image', new Blob([fs.readFileSync(testImagePath)], { type: 'image/jpeg' }), 'test-laptop.jpg');

    const res = await fetch(`${baseUrl}/api/items`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${userToken}` },
      body: formData
    });

    assert.equal(res.status, 201);
    const data = await res.json();
    assert.ok(data._id);
    challengedItemId = data._id;
    assert.equal(data.privateQuestion, 'What sticker is next to the trackpad?');
    assert.equal(data.privateAnswer, undefined, 'privateAnswer plaintext MUST NOT be returned');
    assert.equal(data.privateAnswerHash, undefined, 'privateAnswerHash MUST NOT be returned');
    assert.equal(data.contact, undefined);
  });

  await t.test('reveal-contact fails and reveals nothing when wrong answer is supplied', async () => {
    const res = await fetch(`${baseUrl}/api/items/${challengedItemId}/reveal-contact`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ answer: 'Apple logo' })
    });

    assert.equal(res.status, 401);
    const data = await res.json();
    assert.equal(data.contact, undefined, 'contact MUST NOT be revealed on wrong answer');
    assert.equal(data.attemptsRemaining, 2);
  });

  await t.test('reveal-contact locks out item after 3 consecutive failed attempts', async () => {
    // 2nd failure
    const res2 = await fetch(`${baseUrl}/api/items/${challengedItemId}/reveal-contact`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ answer: 'GitHub Octocat' })
    });
    assert.equal(res2.status, 401);
    const data2 = await res2.json();
    assert.equal(data2.attemptsRemaining, 1);

    // 3rd failure triggers lockout
    const res3 = await fetch(`${baseUrl}/api/items/${challengedItemId}/reveal-contact`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ answer: 'Linux Tux' })
    });
    assert.equal(res3.status, 429);
    const data3 = await res3.json();
    assert.equal(data3.locked, true);
    assert.match(data3.message, /locked/i);

    // 4th attempt (even with correct answer while locked out) is blocked with 429
    const res4 = await fetch(`${baseUrl}/api/items/${challengedItemId}/reveal-contact`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ answer: 'NASA Astronaut' })
    });
    assert.equal(res4.status, 429);
    const data4 = await res4.json();
    assert.equal(data4.contact, undefined, 'contact MUST NOT be revealed during lockout');
    assert.equal(data4.locked, true);
  });

  await t.test('reveal-contact succeeds and reveals contact when correct answer is supplied (case-insensitive & trimmed)', async () => {
    // Create fresh challenged item to test successful answer
    const formData = new FormData();
    formData.append('type', 'found');
    formData.append('category', 'umbrella');
    formData.append('color', 'red');
    formData.append('description', 'Red umbrella left at canteen');
    formData.append('location', 'Canteen');
    formData.append('contact', 'canteen.staff@campus.edu');
    formData.append('currentLocation', 'Canteen billing counter');
    formData.append('privateQuestion', 'What brand is carved on the wooden handle?');
    formData.append('privateAnswer', 'Totes');
    formData.append('image', new Blob([fs.readFileSync(testImagePath)], { type: 'image/jpeg' }), 'test-umbrella.jpg');

    const createRes = await fetch(`${baseUrl}/api/items`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${userToken}` },
      body: formData
    });
    assert.equal(createRes.status, 201);
    const created = await createRes.json();

    // Verify correct answer with lowercased and padded text
    const revealRes = await fetch(`${baseUrl}/api/items/${created._id}/reveal-contact`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ answer: '  totes  ' })
    });

    assert.equal(revealRes.status, 200);
    const revealData = await revealRes.json();
    assert.equal(revealData.contact, 'canteen.staff@campus.edu');
    assert.equal(revealData.privateAnswerHash, undefined);
  });

  await t.test('POST /api/detect returns fallback or detection object with 200 OK', async () => {
    const formData = new FormData();
    formData.append('image', new Blob([fs.readFileSync(testImagePath)], { type: 'image/jpeg' }), 'test-detect.jpg');
    const res = await fetch(`${baseUrl}/api/detect`, {
      method: 'POST',
      body: formData
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.category);
  });
});
