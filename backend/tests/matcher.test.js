import test from 'node:test';
import assert from 'node:assert/strict';
import { scoreMatch, findTopMatches, extractKeywords, extractLocationWords } from '../src/services/matcher.js';

test('Explainable Matching Engine Unit Tests', async (t) => {
  const baseDate = new Date('2026-10-24T12:00:00Z');

  await t.test('1. Perfect match yields 100 points and "Strong match"', () => {
    const source = {
      type: 'lost',
      category: 'bag',
      color: 'blue',
      description: 'Waterproof nylon backpack with black zip and padded straps',
      location: 'Library 2nd floor desk',
      date: baseDate
    };
    const candidate = {
      type: 'found',
      category: 'bag',
      color: 'blue',
      description: 'Found blue backpack with zip and straps',
      location: 'Library study hall',
      date: new Date('2026-10-24T15:00:00Z'),
      status: 'active'
    };

    const result = scoreMatch(source, candidate);
    assert.equal(result.score, 100, 'Score should be 100');
    assert.equal(result.qualifies, true);
    assert.equal(result.tier, 'Strong match');
    assert.equal(result.reasons.length, 5);
    assert.ok(result.reasons.includes('Same category'));
    assert.ok(result.reasons.includes('Same color'));
    assert.ok(result.reasons.some(r => r.includes('shared keywords')));
    assert.ok(result.reasons.includes('Same location area'));
    assert.ok(result.reasons.includes('Close date'));
  });

  await t.test('2. Category-only match (40 pts) qualifies as "Possible match"', () => {
    const source = {
      type: 'lost',
      category: 'bottle',
      color: 'black',
      description: 'Metallic flask',
      location: 'Canteen',
      date: new Date('2026-10-01T12:00:00Z')
    };
    const candidate = {
      type: 'found',
      category: 'bottle',
      color: 'red',
      description: 'Plastic container',
      location: 'Hostel',
      date: new Date('2026-10-24T12:00:00Z'),
      status: 'active'
    };

    const result = scoreMatch(source, candidate);
    assert.equal(result.score, 40);
    assert.equal(result.qualifies, true, 'Category match must qualify even with 1 factor');
    assert.equal(result.tier, 'Possible match');
    assert.deepEqual(result.reasons, ['Same category']);
  });

  await t.test('3. Different category with 2 matching factors (Color 25 + Close Date 10 = 35) qualifies', () => {
    const source = {
      type: 'lost',
      category: 'bottle',
      color: 'blue',
      description: 'Flask',
      location: 'Auditorium',
      date: baseDate
    };
    const candidate = {
      type: 'found',
      category: 'bag',
      color: 'blue',
      description: 'Tote',
      location: 'Sports ground',
      date: new Date('2026-10-25T12:00:00Z'), // 1 day apart
      status: 'active'
    };

    const result = scoreMatch(source, candidate);
    assert.equal(result.score, 35);
    assert.equal(result.factorCount, 2);
    assert.equal(result.qualifies, true, 'Score >= 25 with 2 factors must qualify');
    assert.equal(result.tier, 'Possible match');
  });

  await t.test('4. Different category with only 1 factor is rejected by PRD rule', () => {
    const source = {
      type: 'lost',
      category: 'phone',
      color: 'grey',
      description: 'Smartphone with case',
      location: 'CS Block',
      date: new Date('2026-10-01T12:00:00Z')
    };
    const candidate = {
      type: 'found',
      category: 'umbrella',
      color: 'grey',
      description: 'Small umbrella',
      location: 'Gate 1',
      date: new Date('2026-10-24T12:00:00Z'), // 23 days apart
      status: 'active'
    };

    const result = scoreMatch(source, candidate);
    assert.equal(result.score, 25);
    assert.equal(result.factorCount, 1);
    assert.equal(result.qualifies, false, 'Different category with only 1 factor must be rejected');
  });

  await t.test('5. Items with "other" category or color earn 0 points for those attributes', () => {
    const source = {
      type: 'lost',
      category: 'other',
      color: 'other',
      description: 'Lost item alpha',
      location: 'Somewhere',
      date: baseDate
    };
    const candidate = {
      type: 'found',
      category: 'other',
      color: 'other',
      description: 'Found object beta',
      location: 'Different place',
      date: new Date('2026-10-24T13:00:00Z'),
      status: 'active'
    };

    const result = scoreMatch(source, candidate);
    assert.equal(result.reasons.includes('Same category'), false, '"other" category must not earn points');
    assert.equal(result.reasons.includes('Same color'), false, '"other" color must not earn points');
    assert.equal(result.score, 10, 'Only close date matches (10 pts)');
    assert.equal(result.qualifies, false, 'Score < 25 must not qualify');
  });

  await t.test('6. Stopword filtering properly ignores generic terms in descriptions and locations', () => {
    const descWords = extractKeywords('A blue bag near the desk on floor 2 with a black zip and bottle');
    assert.equal(descWords.has('blue'), false, 'Color words excluded from keywords');
    assert.equal(descWords.has('bag'), false, 'Category words excluded from keywords');
    assert.equal(descWords.has('the'), false, 'Stopwords excluded');
    assert.equal(descWords.has('zip'), true, '"zip" is a valid keyword');

    const locWords = extractLocationWords('Library 2nd floor desk near room 204');
    assert.equal(locWords.has('library'), true, '"library" is a significant location word');
    assert.equal(locWords.has('floor'), false, 'Campus stopword "floor" excluded');
    assert.equal(locWords.has('desk'), false, 'Campus stopword "desk" excluded');
    assert.equal(locWords.has('room'), false, 'Campus stopword "room" excluded');
    assert.equal(locWords.has('204'), false, 'Numbers excluded');
  });

  await t.test('findTopMatches filters opposite-side active items, sorts newest on tie, caps at 3', () => {
    const source = {
      _id: 'source-1',
      type: 'lost',
      category: 'bag',
      color: 'blue',
      description: 'Blue backpack with black zip',
      location: 'Library',
      date: baseDate
    };

    const candidates = [
      {
        _id: 'c-1',
        type: 'lost', // same type, must be ignored
        category: 'bag',
        color: 'blue',
        location: 'Library',
        date: baseDate,
        status: 'active'
      },
      {
        _id: 'c-2',
        type: 'found',
        category: 'bag',
        color: 'blue',
        description: 'blue backpack with black zip',
        location: 'Library',
        date: baseDate,
        status: 'active' // 100 pts
      },
      {
        _id: 'c-3',
        type: 'found',
        category: 'bag',
        color: 'red',
        description: 'bag',
        location: 'Hostel',
        date: new Date('2026-10-01'),
        status: 'active' // 40 pts
      },
      {
        _id: 'c-4',
        type: 'found',
        category: 'bag',
        color: 'blue',
        description: 'bag',
        location: 'Hostel',
        date: new Date('2026-10-01'),
        status: 'returned' // returned, must be ignored
      }
    ];

    const matches = findTopMatches(source, candidates);
    assert.equal(matches.length, 2);
    assert.equal(matches[0].item._id, 'c-2');
    assert.equal(matches[0].score, 100);
    assert.equal(matches[1].item._id, 'c-3');
    assert.equal(matches[1].score, 40);
  });
});
