import { createDeck, shuffleDeck, handValue } from './deck.js';
import { createBotName, chooseBotMove, shouldBotDeclareYaniv } from './bots.js';

const rooms = new Map();
const playerRoom = new Map();

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
  joker: 0,
  spades: 1,
  clubs: 2,
  diamonds: 3,
  hearts: 4
};

const TURN_LIMIT_MS = 15000;

function isJoker(card) {
  return Boolean(card?.isJoker || card?.rank === 'JOKER');
}

function makeRoomCode() {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';

  for (let i = 0; i < 6; i += 1) {
    code += letters[Math.floor(Math.random() * letters.length)];
  }

  return rooms.has(code) ? makeRoomCode() : code;
}

function makeBotId(roomCode, index) {
  return `bot-${roomCode}-${index}-${Date.now()}`;
}

function defaultSettings(settings = {}) {
  const botGame = Boolean(settings.botGame);
  const yanivThreshold = Number(settings.yanivThreshold || 7);
  const eliminationScore = Number(settings.eliminationScore || 150);
  const totalPlayers = Number(settings.totalPlayers || 4);

  return {
    yanivThreshold: Math.max(1, Math.min(20, yanivThreshold)),
    eliminationScore: Math.max(30, Math.min(300, eliminationScore)),
    maxPlayers: 4,
    botGame,
    totalPlayers: Math.max(2, Math.min(4, totalPlayers))
  };
}

function createRoom({ hostId, hostName, mode = 'private', settings = {} }) {
  const code = makeRoomCode();
  const finalSettings = defaultSettings(settings);

  const room = {
    code,
    mode,
    hostId,
    status: 'lobby',
    createdAt: Date.now(),
    settings: finalSettings,
    players: [],
    deck: [],
    discardPile: [],
    currentTurn: null,
    turnTimer: null,
    turnEndsAt: null,
    nextStarterId: null,
    paused: false,
    turnState: { discarded: false, drew: false, availableDiscardCard: null },
    pasteWindow: null,
    round: 0,
    messages: [],
    roundSummary: null,
    nextRoundApprovals: new Set(),
    finalRanking: null
  };

  rooms.set(code, room);
  addHumanPlayer(room, hostId, hostName);

  if (finalSettings.botGame) {
    const botsToAdd = Math.max(1, Math.min(3, finalSettings.totalPlayers - 1));

    for (let i = 0; i < botsToAdd; i += 1) {
      addBotPlayer(room, i);
    }
  }

  return room;
}

function addMessage(room, text) {
  room.messages.unshift({ id: `${Date.now()}-${Math.random()}`, text, time: Date.now() });
  room.messages = room.messages.slice(0, 10);
}

function clearPasteWindow(room) {
  if (room?.pasteWindow?.timer) {
    clearTimeout(room.pasteWindow.timer);
  }

  if (room) room.pasteWindow = null;
}

function addHumanPlayer(room, socketId, name) {
  const player = {
    id: socketId,
    name: String(name || 'שחקן').trim().slice(0, 18) || 'שחקן',
    hand: [],
    score: 0,
    active: true,
    eliminatedRound: null,
    eliminatedAt: null,
    isBot: false,
    connected: true
  };

  room.players.push(player);
  playerRoom.set(socketId, room.code);
  addMessage(room, `${player.name} הצטרף למשחק`);

  return player;
}

function addBotPlayer(room, index) {
  const player = {
    id: makeBotId(room.code, index),
    name: createBotName(index),
    hand: [],
    score: 0,
    active: true,
    eliminatedRound: null,
    eliminatedAt: null,
    isBot: true,
    connected: true
  };

  room.players.push(player);
  addMessage(room, `${player.name} הצטרף כבוט`);

  return player;
}

function sortedCards(cards = []) {
  return [...cards].sort((a, b) => {
    const rankDiff = (rankOrder[a.rank] || a.value || 0) - (rankOrder[b.rank] || b.value || 0);
    if (rankDiff !== 0) return rankDiff;
    return (suitOrder[a.suit] || 0) - (suitOrder[b.suit] || 0);
  });
}

function nonJokers(cards = []) {
  return cards.filter((card) => !isJoker(card));
}

function canBeSameRank(cards = []) {
  if (!cards.length) return false;

  const realCards = nonJokers(cards);
  if (realCards.length <= 1) return true;

  return realCards.every((card) => card.rank === realCards[0].rank);
}

function canCompleteSequence(cards = []) {
  if (cards.length < 3) return false;

  const realCards = nonJokers(cards);
  const jokerCount = cards.length - realCards.length;

  if (realCards.length === 0) return true;

  const suit = realCards[0].suit;
  if (!realCards.every((card) => card.suit === suit)) return false;

  const values = sortedCards(realCards).map((card) => rankOrder[card.rank] || card.value);
  const uniqueValues = [...new Set(values)];

  if (uniqueValues.length !== values.length) return false;

  const min = uniqueValues[0];
  const max = uniqueValues[uniqueValues.length - 1];
  const gapsInside = max - min + 1 - uniqueValues.length;

  if (gapsInside > jokerCount) return false;

  const totalLength = cards.length;

  for (let start = Math.max(1, max - totalLength + 1); start <= Math.min(min, 13 - totalLength + 1); start += 1) {
    const end = start + totalLength - 1;

    if (min >= start && max <= end) {
      return true;
    }
  }

  return false;
}

function isLegalDiscardSelection(cards = []) {
  if (!cards.length) return false;
  if (cards.length === 1) return true;

  if (canBeSameRank(cards)) return true;

  return canCompleteSequence(cards);
}

function visiblePlayersFor(room, viewerId) {
  const revealAllHands = room.status === 'roundEnded' || room.status === 'finished';

  return room.players.map((player) => {
    const shouldShowHand = revealAllHands || player.id === viewerId;

    return {
      id: player.id,
      name: player.name,
      score: player.score,
      active: player.active,
      isBot: player.isBot,
      connected: player.connected,
      cardCount: player.hand.length,
      hand: shouldShowHand ? sortedCards(player.hand) : [],
      handValue: shouldShowHand ? handValue(player.hand) : null
    };
  });
}

function publicRoomState(room, viewerId) {
  const viewer = room.players.find((player) => player.id === viewerId);
  const realTopDiscard = room.discardPile.length ? room.discardPile[room.discardPile.length - 1] : null;
  const activePasteWindow = room.pasteWindow && Date.now() < room.pasteWindow.expiresAt ? room.pasteWindow : null;

  const topDiscard =
    !activePasteWindow && room.currentTurn === viewerId && room.turnState.discarded
      ? room.turnState.availableDiscardCard
      : realTopDiscard;

  return {
    code: room.code,
    mode: room.mode,
    status: room.status,
    settings: room.settings,
    hostId: room.hostId,
    round: room.round,
    players: visiblePlayersFor(room, viewerId),
    currentTurn: room.currentTurn,
    turnEndsAt: room.turnEndsAt,
    isMyTurn: room.currentTurn === viewerId,
    topDiscard,
    deckCount: room.deck.length,
    discardCount: room.discardPile.length,
    drewThisTurn: room.turnState.drew,
    discardedThisTurn: room.turnState.discarded,
    myHandValue: viewer ? handValue(viewer.hand) : null,
    isViewerEliminated: Boolean(viewer && !viewer.active),
    pasteWindow: activePasteWindow
      ? {
          expiresAt: activePasteWindow.expiresAt,
          allowedRanks: activePasteWindow.allowedRanks,
          discarderId: activePasteWindow.discarderId,
          discarderName: activePasteWindow.discarderName,
          targetPlayerId: activePasteWindow.targetPlayerId,
          targetPlayerName: activePasteWindow.targetPlayerName,
          pasteCardId: activePasteWindow.pasteCardId,
          jokerMatch: activePasteWindow.jokerMatch
        }
      : null,
    canDeclareYaniv: Boolean(
      viewer &&
        room.status === 'playing' &&
        room.currentTurn === viewerId &&
        !room.paused &&
        !activePasteWindow &&
        handValue(viewer.hand) <= room.settings.yanivThreshold &&
        !room.turnState.discarded
    ),
    messages: room.messages,
    roundSummary: room.roundSummary,
    nextRoundApproval: nextRoundApprovalState(room, viewerId),
    finalRanking: room.finalRanking,
    paused: Boolean(room.paused)
  };
}

function clearTurnTimer(room) {
  if (room?.turnTimer) {
    clearTimeout(room.turnTimer);
  }

  if (room) {
    room.turnTimer = null;
    room.turnEndsAt = null;
  }
}

function scheduleTurnTimer(io, room) {
  clearTurnTimer(room);

  if (!room || room.status !== 'playing' || room.paused || room.pasteWindow || !room.currentTurn) return;

  const turnId = room.currentTurn;

  room.turnEndsAt = Date.now() + TURN_LIMIT_MS;
  room.turnTimer = setTimeout(() => handleTurnTimeout(io, room.code, turnId), TURN_LIMIT_MS);
}

function handleTurnTimeout(io, roomCode, turnId) {
  const room = rooms.get(roomCode);

  if (!room || room.status !== 'playing' || room.paused || room.pasteWindow || room.currentTurn !== turnId) return;

  const player = getCurrentPlayer(room);
  if (player) addMessage(room, `הזמן של ${player.name} הסתיים`);

  nextTurn(room);
  scheduleTurnTimer(io, room);
  emitRoom(io, room);
  scheduleBotIfNeeded(io, room);
}

function emitRoom(io, room) {
  for (const player of room.players) {
    if (!player.isBot && player.connected) {
      io.to(player.id).emit('roomState', publicRoomState(room, player.id));
    }
  }
}

function activePlayers(room) {
  return room.players.filter((player) => player.active);
}

function nextRoundRequiredPlayerIds(room) {
  if (!room || room.status !== 'roundEnded') return [];

  return room.players
    .filter((player) => {
      if (player.isBot || !player.connected) return false;

      if (!room.settings.botGame) return player.active;

      return true;
    })
    .map((player) => player.id);
}

function buildFinalRanking(room) {
  const placeLabels = ['מקום ראשון', 'מקום שני', 'מקום שלישי', 'מקום רביעי'];

  const active = activePlayers(room).sort((a, b) => a.score - b.score);

  const eliminated = room.players
    .filter((player) => !player.active)
    .sort((a, b) => {
      const roundDiff = (b.eliminatedRound || 0) - (a.eliminatedRound || 0);
      if (roundDiff !== 0) return roundDiff;

      const scoreDiff = a.score - b.score;
      if (scoreDiff !== 0) return scoreDiff;

      return (b.eliminatedAt || 0) - (a.eliminatedAt || 0);
    });

  return [...active, ...eliminated].slice(0, 4).map((player, index) => ({
    id: player.id,
    name: player.name,
    score: player.score,
    place: index + 1,
    label: placeLabels[index] || `מקום ${index + 1}`,
    isWinner: index === 0,
    isBot: player.isBot
  }));
}

function finishGame(io, room) {
  clearPasteWindow(room);
  clearTurnTimer(room);

  room.status = 'finished';
  room.currentTurn = null;
  room.turnState = { discarded: false, drew: false, availableDiscardCard: null };
  room.nextRoundApprovals = new Set();
  room.finalRanking = buildFinalRanking(room);

  const winner = room.finalRanking[0];
  if (winner) addMessage(room, `${winner.name} ניצח במשחק`);

  emitRoom(io, room);
}

function nextRoundApprovalState(room, viewerId) {
  if (!room || room.status !== 'roundEnded') return null;

  const requiredIds = nextRoundRequiredPlayerIds(room);
  const approvals = room.nextRoundApprovals || new Set();

  return {
    requiredCount: requiredIds.length,
    approvedCount: requiredIds.filter((id) => approvals.has(id)).length,
    approvedPlayerIds: requiredIds.filter((id) => approvals.has(id)),
    hasApproved: approvals.has(viewerId),
    canApprove: requiredIds.includes(viewerId)
  };
}

function startRound(io, room) {
  clearPasteWindow(room);
  clearTurnTimer(room);

  const active = activePlayers(room);

  if (active.length <= 1) {
    finishGame(io, room);
    return;
  }

  room.status = 'playing';
  room.paused = false;
  room.round += 1;
  room.deck = shuffleDeck(createDeck());
  room.discardPile = [];
  room.turnState = { discarded: false, drew: false, availableDiscardCard: null };
  room.roundSummary = null;
  room.nextRoundApprovals = new Set();
  room.finalRanking = null;

  for (const player of room.players) {
    player.hand = [];
  }

  for (let i = 0; i < 5; i += 1) {
    for (const player of active) {
      player.hand.push(room.deck.pop());
    }
  }

  room.discardPile.push(room.deck.pop());

  const starter = active.find((player) => player.id === room.nextStarterId) || active[0];
  room.currentTurn = starter.id;

  addMessage(room, `סיבוב ${room.round} התחיל`);
  scheduleTurnTimer(io, room);
  emitRoom(io, room);
  scheduleBotIfNeeded(io, room);
}

function startGame(io, room) {
  if (room.status !== 'lobby' && room.status !== 'roundEnded') {
    return { ok: false, error: 'המשחק כבר התחיל' };
  }

  if (!room.settings.botGame) {
    const humanPlayers = room.players.filter((p) => !p.isBot).length;

    if (room.mode === 'random' && humanPlayers !== 4) {
      return { ok: false, error: 'משחק רנדומלי מתחיל רק עם 4 שחקנים' };
    }

    if (room.mode === 'private' && humanPlayers < 2) {
      return { ok: false, error: 'אפשר להתחיל חדר פרטי רק כשיש לפחות 2 שחקנים' };
    }
  }

  if (room.settings.botGame && room.players.length < 2) {
    return { ok: false, error: 'צריך לפחות 2 שחקנים למשחק עם בוטים' };
  }

  startRound(io, room);

  return { ok: true };
}

function nextTurn(room) {
  clearTurnTimer(room);

  const active = activePlayers(room);
  if (active.length <= 1) return null;

  const currentIndex = active.findIndex((player) => player.id === room.currentTurn);
  const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % active.length;

  room.currentTurn = active[nextIndex].id;
  room.turnState = { discarded: false, drew: false, availableDiscardCard: null };

  return room.currentTurn;
}

function refillDeckFromDiscard(room) {
  if (room.deck.length > 0 || room.discardPile.length <= 1) return;

  const topCard = room.discardPile.pop();

  room.deck = shuffleDeck(room.discardPile);
  room.discardPile = [topCard];

  addMessage(room, 'הקופה התחדשה מערימת הזריקה');
}

function getRoomBySocket(socketId) {
  const code = playerRoom.get(socketId);
  return code ? rooms.get(code) : null;
}

function getCurrentPlayer(room) {
  return room.players.find((player) => player.id === room.currentTurn);
}

function drawCard(io, socket, source) {
  const room = getRoomBySocket(socket.id);

  if (!room || room.status !== 'playing' || room.paused || room.pasteWindow) return;

  const player = getCurrentPlayer(room);

  if (!player || player.id !== socket.id) return;
  if (!room.turnState.discarded || room.turnState.drew) return;

  let card = null;

  if (source === 'deck') {
    refillDeckFromDiscard(room);
    card = room.deck.pop();
  } else if (source === 'discard') {
    const availableCard = room.turnState.availableDiscardCard;

    if (availableCard) {
      const index = room.discardPile.findIndex((discardedCard) => discardedCard.id === availableCard.id);

      if (index !== -1) {
        [card] = room.discardPile.splice(index, 1);
      }
    }
  }

  if (!card) return;

  player.hand.push(card);
  room.turnState.drew = true;

  addMessage(room, `${player.name} לקח קלף`);
  nextTurn(room);
  scheduleTurnTimer(io, room);
  emitRoom(io, room);
  scheduleBotIfNeeded(io, room);
}

function discardCards(io, socket, cardIds) {
  const room = getRoomBySocket(socket.id);

  if (!room || room.status !== 'playing' || room.paused) return;

  const player = getCurrentPlayer(room);

  if (!player || player.id !== socket.id) return;
  if (room.turnState.discarded) return;

  const ids = Array.isArray(cardIds) ? [...new Set(cardIds)] : [];
  if (!ids.length) return;

  const selected = ids.map((cardId) => player.hand.find((card) => card.id === cardId)).filter(Boolean);

  if (selected.length !== ids.length) {
    socket.emit('gameError', 'אחד הקלפים שנבחרו לא נמצא ביד שלך');
    return;
  }

  if (!isLegalDiscardSelection(selected)) {
    socket.emit('gameError', 'אפשר לזרוק קלף בודד, כמה קלפים מאותו ערך, או רצף של 3+ מאותה צורה. ג׳וקר יכול להשלים רצף או סט.');
    return;
  }

  const availableDiscardCard = room.discardPile.length ? room.discardPile[room.discardPile.length - 1] : null;
  const selectedIds = new Set(ids);

  player.hand = player.hand.filter((card) => !selectedIds.has(card.id));

  const discardOrder = sortedCards(selected);
  room.discardPile.push(...discardOrder);
  room.turnState = { discarded: true, drew: false, availableDiscardCard };

  addMessage(room, `${player.name} זרק ${discardOrder.length} ${discardOrder.length === 1 ? 'קלף' : 'קלפים'}`);
  emitRoom(io, room);
}

function makeRoundSummary(room, declarer, result) {
  const players = room.players
    .filter((player) => player.active || player.id === declarer.id || result.valuesByPlayerId[player.id] !== undefined)
    .map((player) => ({
      id: player.id,
      name: player.name,
      handValue: result.valuesByPlayerId[player.id] ?? handValue(player.hand),
      score: player.score,
      isAsaf: result.asafIds.includes(player.id)
    }));

  return {
    title: result.isAsaf
      ? `${declarer.name} אמר יניב, אבל ${result.asafNames.join(', ')} עשה אסף`
      : `${declarer.name} אמר יניב וניצח בסיבוב`,
    declarerId: declarer.id,
    isAsaf: result.isAsaf,
    players,
    eliminatedPlayers: result.eliminatedPlayers || []
  };
}

function calculateYanivResult(room, declarer) {
  const results = room.players.filter((player) => player.active).map((player) => ({ player, value: handValue(player.hand) }));

  const declarerValue = handValue(declarer.hand);

  const asafPlayers = results
    .filter((entry) => entry.player.id !== declarer.id && entry.value <= declarerValue)
    .map((entry) => entry.player);

  const isAsaf = asafPlayers.length > 0;
  const valuesByPlayerId = Object.fromEntries(results.map((entry) => [entry.player.id, entry.value]));

  for (const entry of results) {
    if (entry.player.id === declarer.id) {
      entry.player.score += isAsaf ? declarerValue + 30 : 0;
    } else if (isAsaf && asafPlayers.some((p) => p.id === entry.player.id)) {
      entry.player.score += 0;
    } else {
      entry.player.score += entry.value;
    }
  }

  const eliminatedPlayers = [];

  for (const player of room.players) {
    if (player.active && player.score >= room.settings.eliminationScore) {
      player.active = false;
      player.eliminatedRound = room.round;
      player.eliminatedAt = Date.now();

      const eliminatedInfo = { id: player.id, name: player.name, score: player.score };
      eliminatedPlayers.push(eliminatedInfo);

      addMessage(room, `${player.name} הודח עם ${player.score} נקודות`);
    }
  }

  return {
    isAsaf,
    roundWinnerId: isAsaf ? asafPlayers[0]?.id : declarer.id,
    declarerValue,
    asafNames: asafPlayers.map((player) => player.name),
    asafIds: asafPlayers.map((player) => player.id),
    valuesByPlayerId,
    eliminatedPlayers
  };
}

function finishRound(io, room, declarer, result) {
  clearPasteWindow(room);
  clearTurnTimer(room);

  room.nextStarterId = result.roundWinnerId || declarer.id;
  room.status = 'roundEnded';
  room.currentTurn = null;
  room.turnState = { discarded: false, drew: false, availableDiscardCard: null };
  room.roundSummary = makeRoundSummary(room, declarer, result);

  if (result.isAsaf) {
    addMessage(room, `${declarer.name} אמר יניב עם ${result.declarerValue}, אבל ${result.asafNames.join(', ')} עשה אסף`);
  } else {
    addMessage(room, `${declarer.name} אמר יניב וניצח בסיבוב`);
  }

  const active = activePlayers(room);

  if (active.length <= 1) {
    finishGame(io, room);
    return;
  }

  room.nextRoundApprovals = new Set();
  emitRoom(io, room);
}

function declareYaniv(io, socket) {
  const room = getRoomBySocket(socket.id);

  if (!room || room.status !== 'playing' || room.paused || room.pasteWindow) return;

  const player = getCurrentPlayer(room);

  if (!player || player.id !== socket.id) return;

  const value = handValue(player.hand);

  if (value > room.settings.yanivThreshold) {
    socket.emit('gameError', `אפשר להגיד יניב רק עם ${room.settings.yanivThreshold} או פחות`);
    return;
  }

  const result = calculateYanivResult(room, player);
  finishRound(io, room, player, result);
}

function takeCardAfterDiscard(room, player, source, availableDiscardCard) {
  let card = null;

  if (source === 'discard' && availableDiscardCard) {
    const index = room.discardPile.findIndex((discardedCard) => discardedCard.id === availableDiscardCard.id);

    if (index !== -1) {
      [card] = room.discardPile.splice(index, 1);
    }
  }

  if (!card) {
    refillDeckFromDiscard(room);
    card = room.deck.pop();
  }

  if (card) player.hand.push(card);

  return card;
}

function applyDiscard(room, player, ids, socket = null) {
  const cleanIds = Array.isArray(ids) ? [...new Set(ids)] : [];

  if (!cleanIds.length) return { ok: false, error: 'צריך לבחור קלף אחד לפחות' };

  const selected = cleanIds.map((cardId) => player.hand.find((card) => card.id === cardId)).filter(Boolean);

  if (selected.length !== cleanIds.length) {
    const error = 'אחד הקלפים שנבחרו לא נמצא ביד שלך';
    socket?.emit('gameError', error);
    return { ok: false, error };
  }

  if (!isLegalDiscardSelection(selected)) {
    const error = 'הבחירה לא חוקית';
    socket?.emit('gameError', error);
    return { ok: false, error };
  }

  const availableDiscardCard = room.discardPile.length ? room.discardPile[room.discardPile.length - 1] : null;
  const selectedIds = new Set(cleanIds);

  player.hand = player.hand.filter((card) => !selectedIds.has(card.id));

  const discardOrder = sortedCards(selected);
  room.discardPile.push(...discardOrder);

  return { ok: true, availableDiscardCard, discardOrder };
}

function finishPasteWindow(io, roomCode) {
  const room = rooms.get(roomCode);

  if (!room || !room.pasteWindow) return;

  clearPasteWindow(room);

  room.turnState = { discarded: true, drew: true, availableDiscardCard: null };

  nextTurn(room);
  scheduleTurnTimer(io, room);
  emitRoom(io, room);
  scheduleBotIfNeeded(io, room);
}

function applyPaste(room, player, cardId) {
  const pasteWindow = room.pasteWindow;

  if (!pasteWindow) return { ok: false, error: 'אין כרגע אפשרות הדבקה' };
  if (Date.now() > pasteWindow.expiresAt) return { ok: false, error: 'עבר זמן ההדבקה' };
  if (player.id !== pasteWindow.targetPlayerId) return { ok: false, error: 'רק מי שקיבל את הקלף הזהה יכול להדביק' };
  if (!player.active) return { ok: false, error: 'שחקן מודח לא יכול להדביק' };
  if (cardId !== pasteWindow.pasteCardId) return { ok: false, error: 'אפשר להדביק רק את הקלף החדש שקיבלת' };

  const index = player.hand.findIndex((card) => card.id === pasteWindow.pasteCardId);
  if (index === -1) return { ok: false, error: 'הקלף לא נמצא ביד שלך' };

  const card = player.hand[index];

  const allowed =
    isJoker(card) ||
    pasteWindow.jokerMatch ||
    pasteWindow.allowedRanks.includes(card.rank);

  if (!allowed) {
    return { ok: false, error: 'אפשר להדביק רק קלף זהה למה שזרקת' };
  }

  player.hand.splice(index, 1);
  room.discardPile.push(card);

  return { ok: true, card };
}

function pasteCard(io, socket, cardId) {
  const room = getRoomBySocket(socket.id);

  if (!room || room.status !== 'playing' || room.paused) return;

  const player = room.players.find((candidate) => candidate.id === socket.id);
  if (!player) return;

  const result = applyPaste(room, player, cardId);

  if (!result.ok) {
    socket.emit('gameError', result.error);
    return;
  }

  clearPasteWindow(room);

  room.turnState = { discarded: true, drew: true, availableDiscardCard: null };

  nextTurn(room);
  scheduleTurnTimer(io, room);
  emitRoom(io, room);
  scheduleBotIfNeeded(io, room);
}

function botPasteIfPossible(io, roomCode, botId) {
  const room = rooms.get(roomCode);

  if (!room || room.status !== 'playing' || room.paused || !room.pasteWindow) return;
  if (Date.now() > room.pasteWindow.expiresAt) return;

  const bot = room.players.find((player) => player.id === botId && player.isBot && player.active);

  if (!bot || bot.id !== room.pasteWindow.targetPlayerId) return;

  const result = applyPaste(room, bot, room.pasteWindow.pasteCardId);

  if (!result.ok) return;

  clearPasteWindow(room);

  room.turnState = { discarded: true, drew: true, availableDiscardCard: null };

  nextTurn(room);
  scheduleTurnTimer(io, room);
  emitRoom(io, room);
  scheduleBotIfNeeded(io, room);
}

function openPasteWindow(io, room, player, discardResult, drawnCard) {
  clearPasteWindow(room);
  clearTurnTimer(room);

  const allowedRanks = [...new Set(discardResult.discardOrder.filter((card) => !isJoker(card)).map((card) => card.rank))];
  const discardedHasJoker = discardResult.discardOrder.some(isJoker);

  room.turnState = { discarded: true, drew: true, availableDiscardCard: null };

  room.pasteWindow = {
    expiresAt: Date.now() + 3000,
    allowedRanks,
    jokerMatch: discardedHasJoker || isJoker(drawnCard),
    discarderId: player.id,
    discarderName: player.name,
    targetPlayerId: player.id,
    targetPlayerName: player.name,
    pasteCardId: drawnCard.id,
    timer: null
  };

  room.pasteWindow.timer = setTimeout(() => finishPasteWindow(io, room.code), 3000);

  emitRoom(io, room);

  if (player.isBot) {
    setTimeout(() => botPasteIfPossible(io, room.code, player.id), 350);
  }
}

function isPasteMatch(discardedCards, drawnCard) {
  if (!drawnCard) return false;

  if (isJoker(drawnCard)) return true;
  if (discardedCards.some(isJoker)) return true;

  return discardedCards.some((card) => card.rank === drawnCard.rank);
}

function completeDiscardAndDrawNow(io, room, player, discardResult, source) {
  const drawnCard = takeCardAfterDiscard(room, player, source, discardResult.availableDiscardCard);

  if (source === 'deck' && isPasteMatch(discardResult.discardOrder, drawnCard)) {
    openPasteWindow(io, room, player, discardResult, drawnCard);
    return;
  }

  room.turnState = { discarded: true, drew: true, availableDiscardCard: null };

  nextTurn(room);
  scheduleTurnTimer(io, room);
  emitRoom(io, room);
  scheduleBotIfNeeded(io, room);
}

function discardAndDraw(io, socket, cardIds, source) {
  const room = getRoomBySocket(socket.id);

  if (!room || room.status !== 'playing' || room.paused || room.pasteWindow) return;

  const player = getCurrentPlayer(room);

  if (!player || player.id !== socket.id) return;
  if (room.turnState.discarded) return;

  const discardResult = applyDiscard(room, player, cardIds, socket);

  if (!discardResult.ok) return;

  completeDiscardAndDrawNow(io, room, player, discardResult, source);
}

function botTakeTurn(io, room, bot) {
  if (!room || room.status !== 'playing' || room.paused || room.pasteWindow || room.currentTurn !== bot.id || !bot.active) return;

  if (shouldBotDeclareYaniv(bot.hand, room.settings.yanivThreshold)) {
    const result = calculateYanivResult(room, bot);
    finishRound(io, room, bot, result);
    return;
  }

  const topDiscard = room.discardPile.length ? room.discardPile[room.discardPile.length - 1] : null;
  const move = chooseBotMove(bot.hand, topDiscard);
  const discardResult = applyDiscard(room, bot, move.cardIds);

  if (discardResult.ok) {
    completeDiscardAndDrawNow(io, room, bot, discardResult, move.source);
    return;
  }

  refillDeckFromDiscard(room);

  const drawn = room.deck.pop();

  if (drawn) bot.hand.push(drawn);

  nextTurn(room);
  scheduleTurnTimer(io, room);
  emitRoom(io, room);
  scheduleBotIfNeeded(io, room);
}

function scheduleBotIfNeeded(io, room) {
  const current = getCurrentPlayer(room);

  if (!current || !current.isBot || room.status !== 'playing' || room.paused) return;

  setTimeout(() => botTakeTurn(io, room, current), 350);
}

function joinRoom(io, socket, { code, name }) {
  const room = rooms.get(String(code || '').toUpperCase());

  if (!room) return { ok: false, error: 'לא נמצא משחק עם הקוד הזה' };
  if (room.status !== 'lobby') return { ok: false, error: 'אי אפשר להצטרף למשחק שכבר התחיל' };
  if (room.players.length >= room.settings.maxPlayers) return { ok: false, error: 'החדר מלא' };
  if (room.settings.botGame) return { ok: false, error: 'אי אפשר להצטרף למשחק בוטים שכבר נוצר' };

  addHumanPlayer(room, socket.id, name);

  socket.join(room.code);
  emitRoom(io, room);

  if (room.players.length === 4 && room.mode === 'random') {
    startGame(io, room);
  }

  return { ok: true, code: room.code };
}

function quickPlay(io, socket, name) {
  let room = [...rooms.values()].find(
    (candidate) =>
      candidate.mode === 'random' &&
      candidate.status === 'lobby' &&
      !candidate.settings.botGame &&
      candidate.players.length < 4
  );

  if (!room) {
    room = createRoom({
      hostId: socket.id,
      hostName: name,
      mode: 'random',
      settings: { yanivThreshold: 7, eliminationScore: 150, maxPlayers: 4, botGame: false }
    });

    socket.join(room.code);
    emitRoom(io, room);

    return { ok: true, code: room.code };
  }

  return joinRoom(io, socket, { code: room.code, name });
}

function removePlayerFromRoom(io, socket, reason = 'עזב את החדר') {
  const room = getRoomBySocket(socket.id);

  if (!room) return { ok: true };

  const player = room.players.find((p) => p.id === socket.id);

  if (player) {
    addMessage(room, `${player.name} ${reason}`);
  }

  playerRoom.delete(socket.id);
  socket.leave(room.code);

  if (room.status === 'lobby') {
    room.players = room.players.filter((p) => p.id !== socket.id);

    if (room.players.length === 0 || room.players.every((p) => p.isBot)) {
      rooms.delete(room.code);
      return { ok: true };
    }

    if (room.hostId === socket.id) {
      const newHost = room.players.find((p) => !p.isBot);
      if (newHost) room.hostId = newHost.id;
    }

    emitRoom(io, room);
    return { ok: true };
  }

  if (player) {
    player.connected = false;
    player.active = false;
  }

  const connectedHumans = room.players.filter((p) => !p.isBot && p.connected);

  if (connectedHumans.length === 0) {
    clearPasteWindow(room);
    clearTurnTimer(room);
    rooms.delete(room.code);
    return { ok: true };
  }

  if (room.currentTurn === socket.id) {
    nextTurn(room);
    scheduleTurnTimer(io, room);
    scheduleBotIfNeeded(io, room);
  }

  const active = activePlayers(room);

  if (active.length <= 1 && room.status === 'playing') {
    finishGame(io, room);
    return { ok: true };
  }

  emitRoom(io, room);

  return { ok: true };
}

function handleDisconnect(io, socket) {
  removePlayerFromRoom(io, socket, 'התנתק');
}

function approveNextRound(io, socket) {
  const room = getRoomBySocket(socket.id);

  if (!room) return { ok: false, error: 'לא נמצא חדר משחק' };
  if (room.status !== 'roundEnded') return { ok: false, error: 'אין כרגע סבב שממתין לאישור' };

  const active = activePlayers(room);

  if (active.length <= 1) {
    finishGame(io, room);
    return { ok: true };
  }

  const requiredIds = nextRoundRequiredPlayerIds(room);

  if (!requiredIds.includes(socket.id)) {
    return {
      ok: false,
      error: room.settings.botGame
        ? 'רק שחקן אנושי שנשאר לצפות יכול לאשר את הסבב הבא'
        : 'רק שחקן פעיל יכול לאשר את הסבב הבא'
    };
  }

  if (!room.nextRoundApprovals) room.nextRoundApprovals = new Set();

  room.nextRoundApprovals.add(socket.id);
  emitRoom(io, room);

  const allApproved = requiredIds.every((id) => room.nextRoundApprovals.has(id));

  if (allApproved) {
    startRound(io, room);
  }

  return { ok: true };
}

export function registerGameSockets(io) {
  io.on('connection', (socket) => {
    socket.on('createRoom', (payload, callback) => {
      const name = payload?.name || 'שחקן';
      const settings = defaultSettings(payload?.settings || {});

      const room = createRoom({
        hostId: socket.id,
        hostName: name,
        mode: 'private',
        settings
      });

      socket.join(room.code);

      if (room.settings.botGame) {
        startGame(io, room);
      } else {
        emitRoom(io, room);
      }

      callback?.({ ok: true, code: room.code });
    });

    socket.on('joinRoom', (payload, callback) => {
      const result = joinRoom(io, socket, payload || {});
      callback?.(result);
    });

    socket.on('quickPlay', (payload, callback) => {
      const result = quickPlay(io, socket, payload?.name || 'שחקן');
      callback?.(result);
    });

    socket.on('startGame', (_payload, callback) => {
      const room = getRoomBySocket(socket.id);

      if (!room) return callback?.({ ok: false, error: 'לא נמצא חדר משחק' });
      if (room.hostId !== socket.id) return callback?.({ ok: false, error: 'רק יוצר המשחק יכול להתחיל' });

      const result = startGame(io, room);
      callback?.(result);
    });

    socket.on('approveNextRound', (_payload, callback) => {
      const result = approveNextRound(io, socket);
      callback?.(result);
    });

    socket.on('drawCard', (payload) => {
      drawCard(io, socket, payload?.source || 'deck');
    });

    socket.on('discardCard', (payload) => {
      discardCards(io, socket, payload?.cardId ? [payload.cardId] : []);
    });

    socket.on('discardCards', (payload) => {
      discardCards(io, socket, payload?.cardIds || []);
    });

    socket.on('discardAndDraw', (payload) => {
      discardAndDraw(io, socket, payload?.cardIds || [], payload?.source || 'deck');
    });

    socket.on('pasteCard', (payload) => {
      pasteCard(io, socket, payload?.cardId);
    });

    socket.on('togglePause', () => {
      const room = getRoomBySocket(socket.id);

      if (!room || !room.settings.botGame || room.status !== 'playing') return;

      room.paused = !room.paused;

      if (room.paused) {
        clearTurnTimer(room);
      } else {
        scheduleTurnTimer(io, room);
      }

      emitRoom(io, room);

      if (!room.paused) scheduleBotIfNeeded(io, room);
    });

    socket.on('declareYaniv', () => {
      declareYaniv(io, socket);
    });

    socket.on('leaveRoom', (_payload, callback) => {
      const result = removePlayerFromRoom(io, socket);
      callback?.(result);
    });

    socket.on('disconnect', () => {
      handleDisconnect(io, socket);
    });
  });
}