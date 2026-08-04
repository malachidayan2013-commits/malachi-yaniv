const suits = ['spades', 'clubs', 'diamonds', 'hearts'];

const ranks = [
  { rank: 'A', value: 1 },
  { rank: '2', value: 2 },
  { rank: '3', value: 3 },
  { rank: '4', value: 4 },
  { rank: '5', value: 5 },
  { rank: '6', value: 6 },
  { rank: '7', value: 7 },
  { rank: '8', value: 8 },
  { rank: '9', value: 9 },
  { rank: '10', value: 10 },
  { rank: 'J', value: 10 },
  { rank: 'Q', value: 10 },
  { rank: 'K', value: 10 }
];

export function createDeck() {
  const deck = [];

  for (const suit of suits) {
    for (const card of ranks) {
      deck.push({
        id: `${suit}-${card.rank}`,
        suit,
        rank: card.rank,
        value: card.value,
        isJoker: false
      });
    }
  }

  deck.push({
    id: 'joker-red',
    suit: 'joker',
    rank: 'JOKER',
    value: 0,
    isJoker: true,
    color: 'red'
  });

  deck.push({
    id: 'joker-black',
    suit: 'joker',
    rank: 'JOKER',
    value: 0,
    isJoker: true,
    color: 'black'
  });

  return deck;
}

export function shuffleDeck(deck) {
  const shuffled = [...deck];

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

export function handValue(hand = []) {
  return hand.reduce((sum, card) => sum + Number(card?.value || 0), 0);
}