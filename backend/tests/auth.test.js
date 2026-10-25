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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('User Authentication and Item Ownership Suite', async (t) => {
  let mongoServer;
  let server;
  let baseUrl;
  const testImagePath = path.join(__dirname, 'test-auth-image.jpg');

  fs.writeFileSync(testImagePath, 'fake image data for testing');

  t.before(async () => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test_jwt_secret_key_antigravity_2026';
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri, { dbName: 'campus_lost_found_auth_test' });

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
    if (fs.existsSync(testImagePath)) fs.unlinkSync(testImagePath);
  });

  let user1Token;
  let user1Id;
  let user2Token;
  let user2Id;
  let user1ItemId;

  await t.test('POST /api/auth/register registers a user and returns a 7-day token without passwordHash', async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'alice@campus.edu',
        password: 'securepassword123'
      })
    });

    assert.equal(res.status, 201);
    const data = await res.json();
    assert.ok(data.token, 'Must return JWT token');
    assert.ok(data.user);
    assert.equal(data.user.email, 'alice@campus.edu');
    assert.ok(data.user.id);
    assert.equal(data.user.passwordHash, undefined, 'passwordHash MUST NOT be returned in register');
    assert.equal(data.passwordHash, undefined, 'passwordHash MUST NOT be in response');

    user1Token = data.token;
    user1Id = data.user.id;
  });

  await t.test('POST /api/auth/register rejects duplicate email (case-insensitive)', async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'ALICE@campus.edu',
        password: 'anotherpassword123'
      })
    });

    assert.equal(res.status, 409);
    const data = await res.json();
    assert.match(data.error, /already exists/i);
  });

  await t.test('POST /api/auth/register validates email format and password length >= 8', async () => {
    // Invalid email
    const res1 = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'invalid-email-address',
        password: 'securepassword123'
      })
    });
    assert.equal(res1.status, 400);

    // Password < 8 characters
    const res2 = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'valid@campus.edu',
        password: 'short'
      })
    });
    assert.equal(res2.status, 400);
    const data2 = await res2.json();
    assert.match(data2.error, /8 characters/i);
  });

  await t.test('POST /api/auth/login succeeds with valid credentials', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'alice@campus.edu',
        password: 'securepassword123'
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.token);
    assert.equal(data.user.email, 'alice@campus.edu');
    assert.equal(data.user.passwordHash, undefined, 'passwordHash MUST NOT be returned in login');
  });

  await t.test('POST /api/auth/login rejects incorrect password', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'alice@campus.edu',
        password: 'wrongpassword'
      })
    });

    assert.equal(res.status, 401);
    const data = await res.json();
    assert.match(data.error, /invalid email or password/i);
  });

  await t.test('Register second user Bob for ownership testing', async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'bob@campus.edu',
        password: 'bobpassword123'
      })
    });
    assert.equal(res.status, 201);
    const data = await res.json();
    user2Token = data.token;
    user2Id = data.user.id;
  });

  await t.test('Protected routes reject missing or invalid tokens', async () => {
    // GET /api/auth/me without token
    const res1 = await fetch(`${baseUrl}/api/auth/me`);
    assert.equal(res1.status, 401);

    // GET /api/auth/me with bogus token
    const res2 = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { 'Authorization': 'Bearer bogus-token-12345' }
    });
    assert.equal(res2.status, 401);

    // POST /api/items without token
    const res3 = await fetch(`${baseUrl}/api/items`, { method: 'POST' });
    assert.equal(res3.status, 401);

    // GET /api/items/mine without token
    const res4 = await fetch(`${baseUrl}/api/items/mine`);
    assert.equal(res4.status, 401);

    // POST /api/items/:id/reveal-contact without token
    const res5 = await fetch(`${baseUrl}/api/items/123456789012345678901234/reveal-contact`, { method: 'POST' });
    assert.equal(res5.status, 401);

    // PATCH /api/items/:id/return without token
    const res6 = await fetch(`${baseUrl}/api/items/123456789012345678901234/return`, { method: 'PATCH' });
    assert.equal(res6.status, 401);
  });

  await t.test('GET /api/auth/me returns current user info with valid token', async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${user1Token}` }
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.user.email, 'alice@campus.edu');
    assert.equal(data.user.id, user1Id);
    assert.equal(data.user.passwordHash, undefined);
  });

  await t.test('POST /api/items creates item assigned to authenticated user (Alice)', async () => {
    const formData = new FormData();
    formData.append('type', 'lost');
    formData.append('category', 'bag');
    formData.append('color', 'blue');
    formData.append('description', 'Alice blue backpack');
    formData.append('location', 'Library');
    formData.append('contact', 'alice.private@campus.edu');
    formData.append('image', new Blob([fs.readFileSync(testImagePath)], { type: 'image/jpeg' }), 'backpack.jpg');

    const res = await fetch(`${baseUrl}/api/items`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${user1Token}`
      },
      body: formData
    });

    assert.equal(res.status, 201);
    const data = await res.json();
    assert.ok(data._id);
    user1ItemId = data._id;
    assert.equal(data.owner, user1Id);
    assert.equal(data.contact, undefined, 'contact MUST NOT be returned in creation response');
    assert.equal(data.manageCode, undefined, 'manageCode logic is removed');
    assert.equal(data.privateAnswerHash, undefined);
  });

  await t.test('GET /api/items/mine returns only current user items', async () => {
    // Alice's mine
    const res1 = await fetch(`${baseUrl}/api/items/mine`, {
      headers: { 'Authorization': `Bearer ${user1Token}` }
    });
    assert.equal(res1.status, 200);
    const aliceItems = await res1.json();
    assert.equal(aliceItems.length, 1);
    assert.equal(aliceItems[0]._id, user1ItemId);

    // Bob's mine (has 0 items)
    const res2 = await fetch(`${baseUrl}/api/items/mine`, {
      headers: { 'Authorization': `Bearer ${user2Token}` }
    });
    assert.equal(res2.status, 200);
    const bobItems = await res2.json();
    assert.equal(bobItems.length, 0);
  });

  await t.test('Non-owner (Bob) CANNOT mark Alice item returned (returns 403 Forbidden)', async () => {
    const res = await fetch(`${baseUrl}/api/items/${user1ItemId}/return`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${user2Token}`,
        'Content-Type': 'application/json'
      }
    });

    assert.equal(res.status, 403);
    const data = await res.json();
    assert.match(data.error, /Only the owner/i);

    // Verify item is still active
    const checkRes = await fetch(`${baseUrl}/api/items/${user1ItemId}`);
    const checkData = await checkRes.json();
    assert.equal(checkData.status, 'active');
  });

  await t.test('Owner (Alice) CAN mark her item returned (returns 200 OK)', async () => {
    const res = await fetch(`${baseUrl}/api/items/${user1ItemId}/return`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${user1Token}`,
        'Content-Type': 'application/json'
      }
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.item.status, 'returned');
    assert.equal(data.item.contact, undefined);
  });

  await t.test('reveal-contact requires login and reveals contact to authenticated user', async () => {
    // Anonymous request rejected
    const anonRes = await fetch(`${baseUrl}/api/items/${user1ItemId}/reveal-contact`, {
      method: 'POST'
    });
    assert.equal(anonRes.status, 401);

    // Logged-in request succeeds
    const authRes = await fetch(`${baseUrl}/api/items/${user1ItemId}/reveal-contact`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${user2Token}`
      }
    });
    assert.equal(authRes.status, 200);
    const data = await authRes.json();
    assert.equal(data.contact, 'alice.private@campus.edu');
    assert.equal(data.privateAnswerHash, undefined);
  });

  await t.test('Found item with private question requires login AND correct answer', async () => {
    // Bob posts a found item with a private question
    const formData = new FormData();
    formData.append('type', 'found');
    formData.append('category', 'phone');
    formData.append('color', 'black');
    formData.append('description', 'Black phone found in Canteen');
    formData.append('location', 'Canteen');
    formData.append('contact', 'bob.private@campus.edu');
    formData.append('privateQuestion', 'What is the lock screen wallpaper?');
    formData.append('privateAnswer', 'Golden Gate Bridge');
    formData.append('image', new Blob([fs.readFileSync(testImagePath)], { type: 'image/jpeg' }), 'phone.jpg');

    const createRes = await fetch(`${baseUrl}/api/items`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${user2Token}` },
      body: formData
    });
    assert.equal(createRes.status, 201);
    const item = await createRes.json();
    assert.equal(item.privateAnswerHash, undefined);

    // Anonymous reveal fails with 401
    const resAnon = await fetch(`${baseUrl}/api/items/${item._id}/reveal-contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answer: 'Golden Gate Bridge' })
    });
    assert.equal(resAnon.status, 401);

    // Authenticated reveal with wrong answer fails with 401 (Incorrect answer)
    const resWrong = await fetch(`${baseUrl}/api/items/${item._id}/reveal-contact`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${user1Token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ answer: 'Eiffel Tower' })
    });
    assert.equal(resWrong.status, 401);
    const wrongData = await resWrong.json();
    assert.equal(wrongData.contact, undefined);
    assert.equal(wrongData.attemptsRemaining, 2);

    // Authenticated reveal with correct answer succeeds with 200
    const resCorrect = await fetch(`${baseUrl}/api/items/${item._id}/reveal-contact`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${user1Token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ answer: '  golden gate bridge  ' })
    });
    assert.equal(resCorrect.status, 200);
    const correctData = await resCorrect.json();
    assert.equal(correctData.contact, 'bob.private@campus.edu');
    assert.equal(correctData.privateAnswerHash, undefined);
  });

  await t.test('Comprehensive check: no response in any route returns passwordHash or privateAnswerHash', async () => {
    // Feed check
    const feedRes = await fetch(`${baseUrl}/api/items`);
    const feed = await feedRes.json();
    for (const it of feed) {
      assert.equal(it.contact, undefined);
      assert.equal(it.privateAnswerHash, undefined);
      assert.equal(it.manageCodeHash, undefined);
      assert.equal(it.manageCode, undefined);
    }
  });
});
