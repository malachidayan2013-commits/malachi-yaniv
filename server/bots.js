import { handValue } from './deck.js';

const rankOrder = { A: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, 10: 10, J: 11, Q: 12, K: 13 };
const suitOrder = { spades: 1, clubs: 2, diamonds: 3, hearts: 4 };

export function createBotName(index) {
  return `בוט${index + 1}`;
}

function sortedCards(cards = []) {
  return [...cards].sort((a, b) => {
    const suitDiff = (suitOrder[a.suit] || 0) - (suitOrder[b.suit] || 0);
    if (suitDiff !== 0) return suitDiff;
    return (rankOrder[a.rank] || a.value) - (rankOrder[b.rank] || b.value);
  });
}

function uniqueByKey(items, keyFn) {
  const seen = new Set();
  const result = [];
  for (const item of items) {
    const key = keyFn(item);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }
  return result;
}

function legalDiscardOptions(hand = []) {
  const options = [];

  for (const card of hand) {
    options.push([card]);
  }

  const byRank = new Map();
  for (const card of hand) {
    if (!byRank.has(card.rank)) byRank.set(card.rank, []);
    byRank.get(card.rank).push(card);
  }
  for (const cards of byRank.values()) {
    if (cards.length >= 2) options.push(sortedCards(cards));
  }

  const bySuit = new Map();
  for (const card of hand) {
    if (!bySuit.has(card.suit)) bySuit.set(card.suit, []);
    bySuit.get(card.suit).push(card);
  }

  for (const cards of bySuit.values()) {
    const sorted = sortedCards(cards);
    for (let start = 0; start < sorted.length; start += 1) {
      const run = [sorted[start]];
      for (let end = start + 1; end < sorted.length; end += 1) {
        const previousValue = rankOrder[sorted[end - 1].rank] || sorted[end - 1].value;
        const currentValue = rankOrder[sorted[end].rank] || sorted[end].value;
        if (currentValue === previousValue + 1) {
          run.push(sorted[end]);
          if (run.length >= 3) options.push([...run]);
        } else if (currentValue > previousValue + 1) {
          break;
        }
      }
    }
  }

  return uniqueByKey(options, (cards) => sortedCards(cards).map((card) => card.id).join('|'));
}

function drawSourceScore(remainingHand, topDiscard) {
  if (!topDiscard) return { source: 'deck', score: 0 };

  let score = 0;
  if (topDiscard.value <= 3) score += 6;
  if (topDiscard.value <= 5) score += 3;

  if (remainingHand.some((card) => card.rank === topDiscard.rank)) score += 5;

  const suitValues = remainingHand
    .filter((card) => card.suit === topDiscard.suit)
    .map((card) => rankOrder[card.rank] || card.value);
  const value = rankOrder[topDiscard.rank] || topDiscard.value;
  if (suitValues.includes(value - 1) || suitValues.includes(value + 1)) score += 3;
  if (suitValues.includes(value - 2) || suitValues.includes(value + 2)) score += 2;

  score -= Math.max(0, topDiscard.value - 6);
  return score > 1 ? { source: 'discard', score } : { source: 'deck', score };
}

export function chooseBotMove(hand = [], topDiscard = null) {
  const options = legalDiscardOptions(hand);
  if (!options.length) return { cardIds: [], source: 'deck' };

  const ranked = options
    .map((cards) => {
      const ids = new Set(cards.map((card) => card.id));
      const remaining = hand.filter((card) => !ids.has(card.id));
      const discardedValue = cards.reduce((sum, card) => sum + card.value, 0);
      const sourceChoice = drawSourceScore(remaining, topDiscard);
      const score = discardedValue + cards.length * 1.5 + sourceChoice.score - Math.max(0, handValue(remaining) - handValue(hand));
      return { cards, remaining, source: sourceChoice.source, score };
    })
    .sort((a, b) => b.score - a.score);

  const bestChoices = ranked.slice(0, Math.min(3, ranked.length));
  const chosen = bestChoices[Math.floor(Math.random() * bestChoices.length)];
  return {
    cardIds: chosen.cards.map((card) => card.id),
    source: chosen.source
  };
}

export function shouldBotDeclareYaniv(hand, threshold) {
  const value = handValue(hand);
  if (value > threshold) return false;
  if (value <= Math.floor(threshold / 2)) return Math.random() < 0.85;
  return Math.random() < 0.45;
}
