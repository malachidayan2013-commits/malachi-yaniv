import React from 'react';
import Card from './Card.jsx';
import Avatar from './Avatar.jsx';

function AvatarStatusBox({ player, isCurrentTurn, isRoundWinner }) {
  const isEliminated = !player.active;

  return (
    <div
      className={[
        'player-avatar-box',
        isCurrentTurn ? 'current-turn' : '',
        isRoundWinner ? 'round-winner' : '',
        isEliminated ? 'avatar-eliminated' : ''
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {isRoundWinner && <span className="avatar-badge crown-badge">👑</span>}
      {isCurrentTurn && <span className="avatar-badge turn-badge">תור</span>}

      <Avatar avatar={player.avatar} size="seat" />
    </div>
  );
}

function PlayerSeat({ player, position, isCurrentTurn, isRoundWinner = false }) {
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
        <AvatarStatusBox player={player} isCurrentTurn={isCurrentTurn} isRoundWinner={isRoundWinner} />

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