// Category words excluded from keyword extraction
export const CATEGORY_WORDS = new Set([
  'bag', 'phone', 'bottle', 'umbrella', 'laptop', 'book', 'earbuds', 'airphone', 'hearphone', 'headphone', 'earphone', 'other'
]);

// Color words excluded from keyword extraction
export const COLOR_WORDS = new Set([
  'black', 'white', 'grey', 'gray', 'red', 'blue', 'green', 'yellow', 'brown', 'other'
]);

// Standard English stopwords excluded from keywords
export const STANDARD_STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'with', 'by',
  'from', 'of', 'my', 'is', 'it', 'was', 'this', 'that', 'i', 'me', 'has', 'have'
]);

// Location stopwords excluded from location matching
export const LOCATION_STOPWORDS = new Set([
  'floor', 'block', 'building', 'room', 'desk', 'near', 'gate', 'hall', 'area',
  'dept', 'department', 'ground', 'first', 'second', 'third', '1st', '2nd', '3rd',
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'
]);

/**
 * Tokenize description text, filtering out punctuation, stopwords, category words, and color words.
 */
export function extractKeywords(text = '') {
  if (!text) return new Set();
  const tokens = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(token => (
      token.length > 2 &&
      !STANDARD_STOPWORDS.has(token) &&
      !CATEGORY_WORDS.has(token) &&
      !COLOR_WORDS.has(token) &&
      !/^\d+$/.test(token)
    ));
  return new Set(tokens);
}

/**
 * Tokenize location string, filtering out generic campus location stopwords and digits.
 */
export function extractLocationWords(location = '') {
  if (!location) return new Set();
  const tokens = location
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(token => (
      token.length > 2 &&
      !STANDARD_STOPWORDS.has(token) &&
      !LOCATION_STOPWORDS.has(token) &&
      !/^\d+$/.test(token)
    ));
  return new Set(tokens);
}

/**
 * Calculate match score and reasons between a source item and a candidate item.
 * Maximum score: 100.
 */
export function scoreMatch(source, candidate) {
  let score = 0;
  const reasons = [];
  let factorCount = 0;

  // 1. Same Category (40 pts) - 'other' earns 0 pts
  const isCategoryMatch = (
    source.category &&
    source.category === candidate.category &&
    source.category !== 'other'
  );
  if (isCategoryMatch) {
    score += 40;
    factorCount++;
    reasons.push('Same category');
  }

  // 2. Same Color (25 pts) - 'other' earns 0 pts
  const isColorMatch = (
    source.color &&
    source.color === candidate.color &&
    source.color !== 'other'
  );
  if (isColorMatch) {
    score += 25;
    factorCount++;
    reasons.push('Same color');
  }

  // 3. Shared Description Keywords (8 pts for 1 word, 15 pts for 2+ words)
  const sourceKeywords = extractKeywords(source.description);
  const candidateKeywords = extractKeywords(candidate.description);
  const sharedKeywords = [];
  for (const word of sourceKeywords) {
    if (candidateKeywords.has(word)) {
      sharedKeywords.push(word);
    }
  }

  if (sharedKeywords.length >= 2) {
    score += 15;
    factorCount++;
    reasons.push(`${sharedKeywords.length} shared keywords: ${sharedKeywords.slice(0, 3).join(', ')}`);
  } else if (sharedKeywords.length === 1) {
    score += 8;
    factorCount++;
    reasons.push(`1 shared keyword: ${sharedKeywords[0]}`);
  }

  // 4. Location Overlap (10 pts)
  const sourceLocation = extractLocationWords(source.location);
  const candidateLocation = extractLocationWords(candidate.location);
  let hasLocationMatch = false;
  for (const word of sourceLocation) {
    if (candidateLocation.has(word)) {
      hasLocationMatch = true;
      break;
    }
  }
  if (hasLocationMatch) {
    score += 10;
    factorCount++;
    reasons.push('Same location area');
  }

  // 5. Close Date (10 pts) - within 3 days
  if (source.date && candidate.date) {
    const sourceDate = new Date(source.date).getTime();
    const candidateDate = new Date(candidate.date).getTime();
    const diffDays = Math.abs(sourceDate - candidateDate) / (1000 * 60 * 60 * 24);
    if (diffDays <= 3) {
      score += 10;
      factorCount++;
      reasons.push('Close date');
    }
  }

  // Qualification Rule: (Same Category OR >= 2 matching factors) AND Score >= 25
  const qualifies = (isCategoryMatch || factorCount >= 2) && score >= 25;

  let tier = null;
  if (score >= 70) {
    tier = 'Strong match';
  } else if (score >= 55) {
    tier = 'Good match';
  } else if (score >= 25) {
    tier = 'Possible match';
  }

  return {
    score,
    qualifies,
    tier,
    reasons,
    factorCount
  };
}

/**
 * Filter and rank candidates against source item. Returns top 3 matches.
 */
export function findTopMatches(sourceItem, candidateItems = []) {
  const oppositeType = sourceItem.type === 'lost' ? 'found' : 'lost';

  const matches = [];

  for (const candidate of candidateItems) {
    // Exclude self, wrong type, or non-active status
    if (
      String(candidate._id) === String(sourceItem._id) ||
      candidate.type !== oppositeType ||
      candidate.status !== 'active'
    ) {
      continue;
    }

    const result = scoreMatch(sourceItem, candidate);
    if (result.qualifies) {
      matches.push({
        item: candidate,
        score: result.score,
        tier: result.tier,
        reasons: result.reasons
      });
    }
  }

  // Sort by score descending; break ties by date newest first
  matches.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const dateA = new Date(a.item.date || a.item.createdAt || 0).getTime();
    const dateB = new Date(b.item.date || b.item.createdAt || 0).getTime();
    return dateB - dateA;
  });

  return matches.slice(0, 3);
}
