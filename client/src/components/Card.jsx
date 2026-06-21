import React from 'react';
export default function Card({ card, hidden = false, onClick, disabled = false, selected = false, pasteable = false }) {
  if (hidden) {
    return <button className="card card-back" disabled={disabled} onClick={onClick}>יניב</button>;
  }

  if (!card) {
    return <div className="card empty-card">—</div>;
  }

  return (
    <button
      className={`card ${card.color === 'red' ? 'red-card' : 'black-card'} ${selected ? 'selected-card' : ''} ${pasteable ? 'pasteable-card' : ''}`}
      disabled={disabled}
      onClick={onClick}
      title={`ערך: ${card.value}`}
    >
      <span className="card-rank">{card.rank}</span>
      <span className="card-symbol">{card.symbol}</span>
      <span className="card-rank bottom-rank">{card.rank}</span>
    </button>
  );
}
