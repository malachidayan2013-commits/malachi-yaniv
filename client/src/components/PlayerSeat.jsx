import React from 'react';
import Card from './Card.jsx';
import Avatar from './Avatar.jsx';

function PlayerSeat({ player, position, isCurrentTurn }) {
  if (!player) {
    return <div className={`player-seat ${position} empty-seat`}>מקום פנוי</div>;
  }

  const cards = player.hand?.length ? player.hand : Array.from({ length: player.cardCount || 0 });
  const revealed = Boolean(player.hand?.length);

  return (
    <div
      className={[
        'player-seat',
        position,
        isCurrentTurn ? 'active-turn' : '',
        !player.active ? 'eliminated' : ''
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="seat-name-row">
        <Avatar avatar={player.avatar} size="seat" />
        <span>{player.name}</span>
        {player.isBot && <span className="bot-badge">בוט</span>}
      </div>

      <div className="seat-score">ניקוד: {player.score}</div>

      {!player.connected && !player.isBot && <span className="disconnected">מנותק</span>}

      <div className={revealed ? 'opponent-cards revealed-opponent-cards' : 'opponent-cards'}>
        {cards.map((card, index) => (
          <Card key={card?.id || index} card={card} hidden={!revealed} disabled />
        ))}
      </div>
    </div>
  );
}

export default PlayerSeat;