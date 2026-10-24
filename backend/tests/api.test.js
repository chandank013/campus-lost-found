import test from 'node:test';
import assert from 'node:assert/strict';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import app from '../src/index.js';
import { Item } from '../src/models/Item.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('Backend API & Contact Privacy Lifecycle', async (t) => {
  let mongoServer;
  let server;
  let baseUrl;
  const testImagePath = path.join(__dirname, 'test-image.jpg');

  // Create temporary test image
  fs.writeFileSync(testImagePath, 'fake image content for testing');

  t.before(async () => {
    process.env.NODE_ENV = 'test';
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

  await t.test('POST /api/items creates item and returns it without contact', async () => {
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
      body: formData
    });

    assert.equal(res.status, 201);
    const data = await res.json();
    assert.ok(data._id);
    assert.equal(data.category, 'bag');
    assert.equal(data.color, 'blue');
    assert.equal(data.contact, undefined, 'contact MUST NOT be in response');
  });

  await t.test('GET /api/items returns items strictly excluding contact', async () => {
    const res = await fetch(`${baseUrl}/api/items`);
    assert.equal(res.status, 200);
    const items = await res.json();
    assert.ok(items.length >= 1);
    assert.equal(items[0].contact, undefined, 'contact MUST NOT be in feed payload');
  });

  await t.test('GET /api/items/:id excludes contact', async () => {
    const item = await Item.findOne();
    assert.ok(item);

    const res = await fetch(`${baseUrl}/api/items/${item._id}`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.category, 'bag');
    assert.equal(data.contact, undefined, 'contact MUST NOT be in detail payload');
  });

  await t.test('POST /api/items/:id/reveal-contact reveals contact', async () => {
    const item = await Item.findOne();
    const res = await fetch(`${baseUrl}/api/items/${item._id}/reveal-contact`, {
      method: 'POST'
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.contact, 'student@campus.edu');
  });

  await t.test('PATCH /api/items/:id/return marks item as returned', async () => {
    const item = await Item.findOne();
    const res = await fetch(`${baseUrl}/api/items/${item._id}/return`, {
      method: 'PATCH'
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.item.status, 'returned');
    assert.equal(data.item.contact, undefined);
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
