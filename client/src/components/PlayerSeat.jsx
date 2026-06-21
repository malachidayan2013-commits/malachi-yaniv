import React from 'react';
import Card from './Card.jsx';

const suitOrder = { spades: 1, clubs: 2, diamonds: 3, hearts: 4 };
const rankOrder = { A: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, 10: 10, J: 11, Q: 12, K: 13 };

function sortedCards(cards = []) {
  return [...cards].sort((a, b) => {
    const rankDiff = (rankOrder[a.rank] || a.value) - (rankOrder[b.rank] || b.value);
    if (rankDiff !== 0) return rankDiff;
    return (suitOrder[a.suit] || 0) - (suitOrder[b.suit] || 0);
  });
}

export default function PlayerSeat({ player, position, isCurrentTurn }) {
  if (!player) {
    return <div className={`player-seat ${position} empty-seat`}>ממתין לשחקן</div>;
  }

  const shownCards = sortedCards(player.hand || []);
  const hiddenCards = Array.from({ length: player.cardCount || 0 });
  const revealHand = shownCards.length > 0;

  return (
    <div className={`player-seat ${position} ${isCurrentTurn ? 'active-turn' : ''} ${!player.active ? 'eliminated' : ''}`}>
      <div className="seat-name-row">
        <span className="seat-name">{player.name}</span>
        {player.isBot && <span className="bot-badge">בוט</span>}
      </div>
      <div className="seat-score">ניקוד: {player.score}</div>
      {player.handValue !== null && player.handValue !== undefined && <div className="seat-score">יד: {player.handValue}</div>}
      <div className={`opponent-cards ${revealHand ? 'revealed-opponent-cards' : ''}`}>
        {revealHand
          ? shownCards.map((card) => <Card key={card.id} card={card} disabled />)
          : hiddenCards.map((_, index) => <Card key={index} hidden disabled />)}
      </div>
      {!player.connected && !player.isBot && <div className="disconnected">מנותק</div>}
    </div>
  );
}
