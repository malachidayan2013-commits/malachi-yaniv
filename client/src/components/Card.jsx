import React from 'react';

const suitSymbols = {
  spades: '♠',
  clubs: '♣',
  diamonds: '♦',
  hearts: '♥'
};

function isRed(card) {
  return card?.suit === 'diamonds' || card?.suit === 'hearts' || card?.color === 'red';
}

function isJoker(card) {
  return Boolean(card?.isJoker || card?.rank === 'JOKER');
}

function Card({ card, hidden = false, selected = false, pasteable = false, onClick, disabled = false }) {
  const classes = [
    'card',
    selected ? 'selected-card' : '',
    pasteable ? 'pasteable-card' : '',
    hidden ? 'card-back' : '',
    card && !hidden && isRed(card) ? 'red-card' : '',
    card && !hidden && !isRed(card) ? 'black-card' : '',
    card && !hidden && isJoker(card) ? 'joker-card' : ''
  ]
    .filter(Boolean)
    .join(' ');

  if (hidden) {
    return (
      <button className={classes} onClick={onClick} disabled={disabled || !onClick} type="button">
        <span className="card-back-text">YANIV</span>
      </button>
    );
  }

  if (!card) {
    return (
      <button className="card empty-card" onClick={onClick} disabled={disabled || !onClick} type="button">
        —
      </button>
    );
  }

  if (isJoker(card)) {
    return (
      <button className={classes} onClick={onClick} disabled={disabled || !onClick} type="button">
        <span className="joker-corner">★</span>
        <span className="joker-center">🃏</span>
        <span className="joker-label">JOKER</span>
      </button>
    );
  }

  const symbol = suitSymbols[card.suit] || '';

  return (
    <button className={classes} onClick={onClick} disabled={disabled || !onClick} type="button">
      <span className="card-rank">{card.rank}</span>
      <span className="card-symbol">{symbol}</span>
      <span className="card-rank bottom-rank">{card.rank}</span>
    </button>
  );
}

export default Card;