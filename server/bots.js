import { handValue } from './deck.js';

const rankOrder = {
  JOKER: 0,
  A: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
  8: 8,
  9: 9,
  10: 10,
  J: 11,
  Q: 12,
  K: 13
};

const suitOrder = {
  spades: 1,
  clubs: 2,
  diamonds: 3,
  hearts: 4,
  joker: 0
};

export function createBotName(index) {
  return `בוט${index + 1}`;
}

function isJoker(card) {
  return Boolean(card?.isJoker || card?.rank === 'JOKER');
}

function sortedCards(cards = []) {
  return [...cards].sort((a, b) => {
    const rankDiff = (rankOrder[a.rank] || a.value || 0) - (rankOrder[b.rank] || b.value || 0);
    if (rankDiff !== 0) return rankDiff;
    return (suitOrder[a.suit] || 0) - (suitOrder[b.suit] || 0);
  });
}

function groupByRank(cards = []) {
  const groups = new Map();

  for (const card of cards) {
    if (isJoker(card)) continue;

    if (!groups.has(card.rank)) groups.set(card.rank, []);
    groups.get(card.rank).push(card);
  }

  return [...groups.values()].filter((group) => group.length >= 2);
}

function chooseHighestSingle(hand = []) {
  const nonJokers = hand.filter((card) => !isJoker(card));
  const candidates = nonJokers.length ? nonJokers : hand;

  return [...candidates].sort((a, b) => {
    const valueDiff = (b.value || 0) - (a.value || 0);
    if (valueDiff !== 0) return valueDiff;
    return (rankOrder[b.rank] || 0) - (rankOrder[a.rank] || 0);
  })[0];
}

function shouldTakeVisibleCard(hand = [], topDiscard, difficulty = 'normal') {
  if (!topDiscard) return false;

  if (isJoker(topDiscard)) return true;

  if (difficulty === 'easy') {
    return (topDiscard.value || 0) <= 3;
  }

  if ((topDiscard.value || 0) <= 4) return true;

  const sameRankCount = hand.filter((card) => !isJoker(card) && card.rank === topDiscard.rank).length;
  if (sameRankCount >= 1) return true;

  if (difficulty === 'hard') {
    const sameSuitNeighbors = hand.filter((card) => {
      if (isJoker(card)) return false;
      if (card.suit !== topDiscard.suit) return false;

      const diff = Math.abs((rankOrder[card.rank] || 0) - (rankOrder[topDiscard.rank] || 0));
      return diff === 1 || diff === 2;
    });

    return sameSuitNeighbors.length >= 1;
  }

  return false;
}

export function shouldBotDeclareYaniv(hand = [], yanivThreshold = 7, difficulty = 'normal') {
  const value = handValue(hand);

  if (value > yanivThreshold) return false;

  if (difficulty === 'easy') {
    return value <= Math.max(2, yanivThreshold - 3) && Math.random() < 0.45;
  }

  if (difficulty === 'hard') {
    return true;
  }

  if (value <= Math.max(4, yanivThreshold - 2)) return true;

  return Math.random() < 0.65;
}

export function chooseBotMove(hand = [], topDiscard = null, difficulty = 'normal') {
  const sorted = sortedCards(hand);
  const rankGroups = groupByRank(sorted);

  let selectedCards = [];

  if (difficulty !== 'easy' && rankGroups.length) {
    const bestGroup = rankGroups.sort((a, b) => {
      const sumA = a.reduce((sum, card) => sum + (card.value || 0), 0);
      const sumB = b.reduce((sum, card) => sum + (card.value || 0), 0);
      return sumB - sumA;
    })[0];

    selectedCards = bestGroup;
  } else {
    const highest = chooseHighestSingle(sorted);
    selectedCards = highest ? [highest] : [];
  }

  const source = shouldTakeVisibleCard(hand, topDiscard, difficulty) ? 'discard' : 'deck';

  return {
    cardIds: selectedCards.map((card) => card.id),
    source
  };
}