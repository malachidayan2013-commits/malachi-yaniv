import React from 'react';

const suitSymbols = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣'
};

function getSuitColor(suit) {
  if (suit === 'hearts' || suit === 'diamonds') return 'red';
  return 'black';
}

export default function Card({
  card = null,
  hidden = false,
  selected = false,
  pasteable = false,
  onClick = null
}) {
  const isClickable = typeof onClick === 'function';
  const joker = Boolean(card?.isJoker || card?.rank === 'JOKER');

  const className = [
    'playing-card',
    hidden ? 'card-hidden' : '',
    selected ? 'selected' : '',
    pasteable ? 'pasteable' : '',
    isClickable ? 'clickable' : '',
    joker ? 'joker-card-wrapper' : ''
  ]
    .filter(Boolean)
    .join(' ');

  if (hidden) {
    return (
      <button
        type="button"
        className={className}
        onClick={onClick}
        disabled={!isClickable}
      >
        <div className="card-back">
          <div className="card-back-inner">YANIV</div>
        </div>
      </button>
    );
  }

  if (!card) {
    return (
      <div className={className}>
        <div className="card-empty" />
      </div>
    );
  }

  if (joker) {
    return (
      <button
        type="button"
        className={className}
        onClick={onClick}
        disabled={!isClickable}
      >
        <img
          src="/cards/joker-card.png"
          alt="ג׳וקר"
          className="joker-card-image"
          draggable="false"
        />
      </button>
    );
  }

  const suitSymbol = suitSymbols[card.suit] || '';
  const suitColor = getSuitColor(card.suit);

  return (
    <button
      type="button"
      className={className}
      onClick={onClick}
      disabled={!isClickable}
    >
      <div className={`card-face ${suitColor}`}>
        <div className="card-corner top-left">
          <div className="card-rank">{card.rank}</div>
          <div className="card-suit">{suitSymbol}</div>
        </div>

        <div className="card-center-symbol">{suitSymbol}</div>

        <div className="card-corner bottom-right">
          <div className="card-rank">{card.rank}</div>
          <div className="card-suit">{suitSymbol}</div>
        </div>
      </div>
    </button>
  );
}