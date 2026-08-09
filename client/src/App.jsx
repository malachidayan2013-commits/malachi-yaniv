import React, { useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import Card from './components/Card.jsx';
import PlayerSeat from './components/PlayerSeat.jsx';
import Avatar from './components/Avatar.jsx';
import AvatarBuilder from './components/AvatarBuilder.jsx';

const SERVER_URL =
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:10000'
    : 'https://yaniv-game.onrender.com';

const AVATARS_KEY = 'yanivAvatars';
const ACTIVE_AVATAR_KEY = 'yanivActiveAvatarId';

function wakeGameServer() {
  fetch(`${SERVER_URL}/`, {
    method: 'GET',
    cache: 'no-store'
  }).catch(() => {});
}

function loadAvatars() {
  try {
    return JSON.parse(localStorage.getItem(AVATARS_KEY) || '[]');
  } catch {
    return [];
  }
}

const suitOrder = { joker: 0, spades: 1, clubs: 2, diamonds: 3, hearts: 4 };

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

  for (
    let start = Math.max(1, max - totalLength + 1);
    start <= Math.min(min, 13 - totalLength + 1);
    start += 1
  ) {
    const end = start + totalLength - 1;

    if (min >= start && max <= end) {
      return true;
    }
  }

  return false;
}

function isLegalDiscardSelection(cards = []) {
  if (cards.length === 0) return false;
  if (cards.length === 1) return true;

  if (canBeSameRank(cards)) return true;

  return canCompleteSequence(cards);
}

function getRoundWinnerId(roundSummary) {
  if (!roundSummary) return null;

  if (roundSummary.isAsaf) {
    return roundSummary.players?.find((player) => player.isAsaf)?.id || null;
  }

  return roundSummary.declarerId || null;
}

function getRoundYanivCallerId(roundSummary) {
  return roundSummary?.declarerId || null;
}

function getAsafPlayerIds(roundSummary) {
  return new Set((roundSummary?.players || []).filter((player) => player.isAsaf).map((player) => player.id));
}

function getApprovedPlayerIds(nextRoundApproval) {
  return new Set(nextRoundApproval?.approvedPlayerIds || []);
}

function PlayerStatusBadges({ isYanivCaller, isAsafPlayer, hasApprovedNextRound }) {
  if (!isYanivCaller && !isAsafPlayer && !hasApprovedNextRound) return null;

  return (
    <div className="seat-status-badges">
      {isYanivCaller && <span className="game-status-badge status-yaniv">יניב</span>}
      {isAsafPlayer && <span className="game-status-badge status-asaf">אסף</span>}
      {hasApprovedNextRound && <span className="game-status-badge status-approved">✓ אישר</span>}
    </div>
  );
}

function AvatarStatusBox({
  player,
  isCurrentTurn,
  isRoundWinner,
  isYanivCaller,
  isAsafPlayer,
  hasApprovedNextRound
}) {
  if (!player) return null;

  const isEliminated = !player.active;

  return (
    <div
      className={[
        'player-avatar-box',
        isCurrentTurn ? 'current-turn' : '',
        isRoundWinner ? 'round-winner' : '',
        isYanivCaller ? 'yaniv-caller-avatar' : '',
        isAsafPlayer ? 'asaf-player-avatar' : '',
        hasApprovedNextRound ? 'approved-avatar' : '',
        isEliminated ? 'avatar-eliminated' : ''
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {isRoundWinner && <span className="avatar-badge crown-badge">👑</span>}
      {isCurrentTurn && <span className="avatar-badge turn-badge">תור</span>}
      {hasApprovedNextRound && <span className="avatar-badge approved-badge-avatar">✓</span>}

      <Avatar avatar={player.avatar} size="seat" />
    </div>
  );
}

function App() {
  const pathJoinCode = window.location.pathname.match(/^\/game\/([^/]+)/i)?.[1]?.toUpperCase() || '';

  const socket = useMemo(
    () =>
      io(SERVER_URL, {
        autoConnect: false,
        reconnection: true,
        reconnectionAttempts: 8,
        reconnectionDelay: 900
      }),
    []
  );

  const [avatars, setAvatars] = useState(loadAvatars);
  const [activeAvatarId, setActiveAvatarId] = useState(localStorage.getItem(ACTIVE_AVATAR_KEY) || '');

  const activeAvatar = avatars.find((item) => item.id === activeAvatarId)?.data || avatars[0]?.data || null;

  const [name, setName] = useState(localStorage.getItem('yanivName') || '');
  const [screen, setScreen] = useState(name ? (pathJoinCode ? 'join' : 'menu') : 'login');
  const [avatarBackScreen, setAvatarBackScreen] = useState(pathJoinCode ? 'join' : 'menu');
  const [howToBackScreen, setHowToBackScreen] = useState('menu');
  const [room, setRoom] = useState(null);
  const [joinCode, setJoinCode] = useState(pathJoinCode);
  const [joinBackScreen, setJoinBackScreen] = useState('menu');
  const [error, setError] = useState('');
  const [isOpeningGame, setIsOpeningGame] = useState(false);
  const [openingGameText, setOpeningGameText] = useState('');
  const [createSettings, setCreateSettings] = useState({
    yanivThreshold: 7,
    eliminationScore: 150,
    botGame: false,
    totalPlayers: 4,
    botDifficulty: 'normal',
    botSpeed: 'normal'
  });

  useEffect(() => {
    wakeGameServer();

    socket.on('roomState', (state) => {
      finishOpeningGame();
      setRoom(state);
      setScreen('game');
      setError('');
    });

    socket.on('gameError', (message) => {
      finishOpeningGame();
      setError(message);
    });

    socket.on('connect_error', () => {
      finishOpeningGame();
      setError('לא ניתן להתחבר לשרת המשחק כרגע. נסה שוב בעוד כמה שניות.');
    });

    return () => {
      socket.off('roomState');
      socket.off('gameError');
      socket.off('connect_error');
    };
  }, [socket]);

  function saveAvatars(nextAvatars, nextActiveId) {
    setAvatars(nextAvatars);
    setActiveAvatarId(nextActiveId || '');

    localStorage.setItem(AVATARS_KEY, JSON.stringify(nextAvatars));

    if (nextActiveId) {
      localStorage.setItem(ACTIVE_AVATAR_KEY, nextActiveId);
    } else {
      localStorage.removeItem(ACTIVE_AVATAR_KEY);
    }
  }

  function ensureSocket() {
    if (!socket.connected) socket.connect();
  }

  function beginOpeningGame(text) {
    setIsOpeningGame(true);
    setOpeningGameText(text || 'פותח משחק... זה יכול לקחת כמה שניות בפעם הראשונה.');

    window.clearTimeout(window.openingGameTimeout);

    window.openingGameTimeout = window.setTimeout(() => {
      setIsOpeningGame(false);
      setOpeningGameText('');
      setError('החיבור לשרת המשחק לוקח יותר מדי זמן. נסה שוב בעוד כמה שניות.');
    }, 45000);
  }

  function finishOpeningGame() {
    window.clearTimeout(window.openingGameTimeout);
    setIsOpeningGame(false);
    setOpeningGameText('');
  }

  function submitName(event) {
    event.preventDefault();

    const cleanName = name.trim();

    if (!cleanName) {
      setError('צריך להכניס שם');
      return;
    }

    localStorage.setItem('yanivName', cleanName);
    setName(cleanName);
    setError('');

    if (!avatars.length) {
      setAvatarBackScreen(pathJoinCode ? 'join' : 'menu');
      setScreen('avatar');
      return;
    }

    setScreen(pathJoinCode ? 'join' : 'menu');
  }

  function createRoom() {
    const isBotGame = Boolean(createSettings.botGame);

    setError('');
    beginOpeningGame(
      isBotGame
        ? 'פותח משחק נגד בוטים... אם זו הכניסה הראשונה, השרת מתעורר וזה יכול לקחת כמה שניות.'
        : 'פותח חדר משחק... אם זו הכניסה הראשונה, השרת מתעורר וזה יכול לקחת כמה שניות.'
    );

    wakeGameServer();
    ensureSocket();

    socket.emit(
      'createRoom',
      {
        name,
        avatar: activeAvatar,
        settings: {
          yanivThreshold: Number(createSettings.yanivThreshold),
          eliminationScore: Number(createSettings.eliminationScore),
          maxPlayers: 4,
          botGame: isBotGame,
          totalPlayers: Number(createSettings.totalPlayers),
          botDifficulty: createSettings.botDifficulty,
          botSpeed: createSettings.botSpeed
        }
      },
      (response) => {
        if (!response?.ok) {
          finishOpeningGame();
          setError(response?.error || 'לא ניתן ליצור משחק');
        }
      }
    );
  }

  function joinRoom() {
    const cleanCode = joinCode.trim().toUpperCase();

    if (!cleanCode) {
      setError('צריך להכניס קוד משחק');
      return;
    }

    setError('');
    beginOpeningGame('מצטרף למשחק... אם השרת היה רדום, זה יכול לקחת כמה שניות.');

    wakeGameServer();
    ensureSocket();

    socket.emit('joinRoom', { code: cleanCode, name, avatar: activeAvatar }, (response) => {
      if (!response?.ok) {
        finishOpeningGame();
        setError(response?.error || 'לא ניתן להצטרף למשחק');
      }
    });
  }

  function startGame() {
    socket.emit('startGame', {}, (response) => {
      if (!response?.ok) setError(response?.error || 'לא ניתן להתחיל משחק');
    });
  }

  function approveNextRound() {
    socket.emit('approveNextRound', {}, (response) => {
      if (!response?.ok) setError(response?.error || 'לא ניתן לאשר סבב הבא');
    });
  }

  function discardAndDraw(cardIds, source) {
    socket.emit('discardAndDraw', { cardIds, source });
  }

  function pasteCard(cardId) {
    socket.emit('pasteCard', { cardId });
  }

  function togglePause() {
    socket.emit('togglePause');
  }

  function leaveRoom() {
    socket.emit('leaveRoom', {}, (response) => {
      if (!response?.ok) {
        setError(response?.error || 'לא ניתן לעזוב את החדר');
        return;
      }

      setRoom(null);
      setScreen('menu');
      setError('');
    });
  }

  function declareYaniv() {
    socket.emit('declareYaniv');
  }

  function copyInviteLink() {
    if (!room?.code) return;

    const url = `${window.location.origin}/game/${room.code}`;
    navigator.clipboard?.writeText(url);
  }

  function openHowToPlayFromMenu() {
    setHowToBackScreen('menu');
    setScreen('howToPlay');
  }

  function openHowToPlayFromGame() {
    setHowToBackScreen('game');
    setScreen('howToPlay');
  }

  function openAvatarFromMenu() {
    setAvatarBackScreen('menu');
    setScreen('avatar');
  }

  function openBotGameSettings() {
    wakeGameServer();

    setCreateSettings((current) => ({
      ...current,
      botGame: true,
      totalPlayers: current.totalPlayers || 4,
      botDifficulty: current.botDifficulty || 'normal',
      botSpeed: current.botSpeed || 'normal'
    }));

    setScreen('create');
    setError('');
  }

  function openJoinFromFriendMenu() {
    wakeGameServer();

    setJoinBackScreen('friendMenu');
    setScreen('join');
    setError('');
  }

  function openFriendGameSettings() {
    wakeGameServer();

    setCreateSettings((current) => ({
      ...current,
      botGame: false,
      totalPlayers: 4
    }));

    setScreen('create');
    setError('');
  }

  if (screen === 'login') {
    return (
      <main className="app-shell center-screen">
        <section className="panel login-panel">
          <h1>יניב</h1>

          <form onSubmit={submitName} className="stack-form">
            <label htmlFor="playerName">הכנס את שמך</label>
            <input
              id="playerName"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="הכנס כאן את שמך"
              autoFocus
            />
            <button className="primary-button" type="submit">
              המשך
            </button>
          </form>

          {error && <p className="error-text">{error}</p>}
        </section>
      </main>
    );
  }

  if (screen === 'avatar') {
    return (
      <AvatarBuilder
        avatars={avatars}
        activeAvatarId={activeAvatarId}
        onSaveAll={saveAvatars}
        onBack={() => setScreen(avatarBackScreen)}
      />
    );
  }

  if (screen === 'menu') {
    return (
      <main className="app-shell center-screen">
        <section className="panel menu-panel game-mode-panel">
          <div className="menu-profile">
            <Avatar avatar={activeAvatar} size="small" />
            <div className="top-name">שלום, {name}</div>
          </div>

          <h1>יניב אונליין</h1>
          <p className="menu-subtitle">שחקו יניב נגד חברים או נגד בוטים, בחינם וישירות מהדפדפן.</p>

          <div className="mode-choice-grid">
            <button className="mode-card-button" onClick={openBotGameSettings}>
              <span className="mode-icon">🤖</span>
              <strong>שחק נגד בוט</strong>
              <span>משחק מהיר עם בוטים</span>
            </button>

            <button className="mode-card-button" onClick={() => setScreen('friendMenu')}>
              <span className="mode-icon">⚔️</span>
              <strong>שחק נגד חבר</strong>
              <span>צור חדר או הצטרף לקוד</span>
            </button>
          </div>

          <button type="button" className="how-to-button" onClick={openHowToPlayFromMenu}>
            <span className="how-to-icon">?</span>
            <span>איך משחקים?</span>
          </button>

          <button className="link-button" onClick={() => setScreen('login')}>
            שנה שם
          </button>

          <button className="link-button" onClick={openAvatarFromMenu}>
            שנה אווטאר
          </button>

          {error && <p className="error-text">{error}</p>}
        </section>
      </main>
    );
  }

  if (screen === 'howToPlay') {
    return <HowToPlayScreen onBack={() => setScreen(howToBackScreen)} />;
  }

  if (screen === 'friendMenu') {
    return (
      <main className="app-shell center-screen">
        <section className="panel menu-panel friend-menu-panel">
          <div className="top-name">שלום, {name}</div>
          <h1>משחק נגד חבר</h1>

          <button className="primary-button" onClick={openFriendGameSettings}>
            צור משחק
          </button>

          <button className="secondary-button" onClick={openJoinFromFriendMenu}>
            הצטרף למשחק
          </button>

          <button className="link-button" onClick={() => setScreen('menu')}>
            חזרה לתפריט
          </button>

          {error && <p className="error-text">{error}</p>}
        </section>
      </main>
    );
  }

  if (screen === 'join') {
    return (
      <main className="app-shell center-screen">
        <section className="panel menu-panel">
          <h1>הצטרפות למשחק</h1>

          <div className="stack-form">
            <label htmlFor="joinCode">קוד משחק</label>
            <input
              id="joinCode"
              value={joinCode}
              onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
              placeholder="הכנס קוד משחק"
            />

            <button className="primary-button" onClick={joinRoom}>
              הצטרף
            </button>

            <button className="link-button" onClick={() => setScreen(joinBackScreen)}>
              חזרה
            </button>
          </div>

          {isOpeningGame && <OpeningGameOverlay text={openingGameText} />}

          {error && <p className="error-text">{error}</p>}
        </section>
      </main>
    );
  }

  if (screen === 'create') {
    const isBotGame = Boolean(createSettings.botGame);

    return (
      <main className="app-shell center-screen">
        <section className="panel create-panel">
          <h1>{isBotGame ? 'משחק נגד בוט' : 'יצירת משחק נגד חבר'}</h1>

          <div className="settings-grid">
            <label>
              סף יניב
              <input
                type="number"
                min="1"
                max="20"
                value={createSettings.yanivThreshold}
                onChange={(event) =>
                  setCreateSettings({ ...createSettings, yanivThreshold: event.target.value })
                }
              />
            </label>

            <label>
              ניקוד הדחה
              <input
                type="number"
                min="30"
                max="300"
                value={createSettings.eliminationScore}
                onChange={(event) =>
                  setCreateSettings({ ...createSettings, eliminationScore: event.target.value })
                }
              />
            </label>

            {isBotGame && (
              <>
                <label>
                  מספר שחקנים כולל
                  <select
                    value={createSettings.totalPlayers}
                    onChange={(event) =>
                      setCreateSettings({ ...createSettings, totalPlayers: event.target.value })
                    }
                  >
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                  </select>
                </label>

                <label>
                  רמת קושי לבוטים
                  <select
                    value={createSettings.botDifficulty}
                    onChange={(event) =>
                      setCreateSettings({ ...createSettings, botDifficulty: event.target.value })
                    }
                  >
                    <option value="easy">קל</option>
                    <option value="normal">רגיל</option>
                    <option value="hard">קשה</option>
                  </select>
                </label>

                <label>
                  מהירות הבוטים
                  <select
                    value={createSettings.botSpeed}
                    onChange={(event) =>
                      setCreateSettings({ ...createSettings, botSpeed: event.target.value })
                    }
                  >
                    <option value="slow">איטי</option>
                    <option value="normal">רגיל</option>
                    <option value="fast">מהיר</option>
                  </select>
                </label>
              </>
            )}
          </div>

          <button className="primary-button" onClick={createRoom}>
            {isBotGame ? 'התחל משחק נגד בוטים' : 'צור משחק'}
          </button>

          <button className="link-button" onClick={() => setScreen(isBotGame ? 'menu' : 'friendMenu')}>
            חזרה
          </button>

          {isOpeningGame && <OpeningGameOverlay text={openingGameText} />}

          {error && <p className="error-text">{error}</p>}
        </section>
      </main>
    );
  }

  return (
    <GameScreen
      room={room}
      mySocketId={socket.id}
      onStart={startGame}
      onDiscardAndDraw={discardAndDraw}
      onPaste={pasteCard}
      onYaniv={declareYaniv}
      onTogglePause={togglePause}
      onLeaveRoom={leaveRoom}
      onCopyInvite={copyInviteLink}
      onApproveNextRound={approveNextRound}
      onShowHowToPlay={openHowToPlayFromGame}
      error={error}
    />
  );
}

function HowToPlayScreen({ onBack }) {
  const [openRuleIds, setOpenRuleIds] = useState(new Set());

  const rules = [
    {
      id: 'goal',
      icon: '🎯',
      title: 'מטרת המשחק',
      text: 'המטרה היא להישאר עם סכום קלפים נמוך ככל האפשר. ככל שהניקוד המצטבר שלך גבוה יותר, אתה מתקרב להדחה מהמשחק.'
    },
    {
      id: 'turn',
      icon: '🔁',
      title: 'מה עושים בתור?',
      text: 'בכל תור קודם זורקים קלף אחד, כמה קלפים מאותו מספר, או רצף חוקי של 3 קלפים ומעלה מאותה צורה. ג׳וקר יכול להשלים רצף או להצטרף לקלפים מאותו מספר. לאחר מכן לוקחים קלף מהקופה המוסתרת או מהקלף הגלוי.'
    },
    {
      id: 'yaniv',
      icon: '📣',
      title: 'מתי אומרים יניב?',
      text: 'כאשר סכום הקלפים ביד שווה לסף יניב או נמוך ממנו, אפשר ללחוץ על “הגד יניב”. ברירת המחדל באתר היא סף 7, אך אפשר לשנות זאת ביצירת המשחק.'
    },
    {
      id: 'asaf',
      icon: '⚠️',
      title: 'מה זה אסף?',
      text: 'אם שחקן אמר יניב, אבל לשחקן אחד או יותר יש סכום קלפים נמוך יותר או שווה לו, המערכת מזהה אסף. מי שאמר יניב מקבל את סכום הקלפים שבידו ועוד 30 נקודות על כל שחקן שעשה עליו אסף.'
    },
    {
      id: 'score',
      icon: '➕',
      title: 'על מה מוסיפים נקודות?',
      text: 'בסוף סבב רגיל שבו מישהו אמר יניב והצליח, כל שאר השחקנים מקבלים לניקוד הכללי שלהם את סכום הקלפים שנשארו בידם. מי שאמר יניב לא מקבל נקודות באותו סבב. אם היה אסף, מי שאמר יניב מקבל את סכום הקלפים שבידו ועוד 30 נקודות על כל אסף שעשו עליו.'
    },
    {
      id: 'paste',
      icon: '⚡',
      title: 'מהי הדבקה?',
      text: 'אם זרקת קלף או קבוצה ולקחת מהקופה המוסתרת קלף רגיל עם המספר המתאים, יש לך 3 שניות להדביק אותו לערימה ולהיפטר ממנו.'
    },
    {
      id: 'joker',
      icon: '🃏',
      title: 'מה עושה ג׳וקר?',
      text: 'ג׳וקר שווה 0 נקודות. הוא יכול להיות כל קלף שתרצה, להשלים רצף מאותה צורה או להצטרף לקבוצה של קלפים מאותו מספר. עם זאת, ג׳וקר שנלקח מהקופה לא פותח אפשרות הדבקה.'
    },
    {
      id: 'win',
      icon: '🏆',
      title: 'איך מנצחים?',
      text: 'בסוף כל סבב מתווסף ניקוד לשחקנים. מי שעובר את ניקוד ההדחה מודח. השחקן האחרון שנשאר במשחק הוא המנצח.'
    }
  ];

  function toggleRule(ruleId) {
    setOpenRuleIds((current) => {
      const next = new Set(current);

      if (next.has(ruleId)) {
        next.delete(ruleId);
      } else {
        next.add(ruleId);
      }

      return next;
    });
  }

  return (
    <main className="app-shell center-screen">
      <section className="panel how-to-panel">
        <div className="how-to-hero">
          <h1>
            <span className="how-to-title-icon">🃏</span>
            איך משחקים יניב?
          </h1>

          <p>
            יניב הוא משחק קלפים ישראלי שבו המטרה היא לסיים כל סבב עם כמה שפחות נקודות ביד.
            באתר אפשר לשחק יניב אונליין נגד בוטים או לפתוח חדר פרטי ולשחק נגד חברים.
          </p>
        </div>

        <div className="rules-accordion">
          {rules.map((rule) => {
            const isOpen = openRuleIds.has(rule.id);

            return (
              <article key={rule.id} className={isOpen ? 'rule-accordion-item open' : 'rule-accordion-item'}>
                <button
                  type="button"
                  className="rule-toggle"
                  onClick={() => toggleRule(rule.id)}
                  aria-expanded={isOpen}
                >
                  <span className="rule-title-row">
                    <span className="rule-icon-inline">{rule.icon}</span>
                    <span>{rule.title}</span>
                  </span>

                  <span className="rule-chevron">{isOpen ? '−' : '+'}</span>
                </button>

                {isOpen && <p className="rule-content">{rule.text}</p>}
              </article>
            );
          })}
        </div>

        <button className="primary-button" onClick={onBack}>
          חזרה
        </button>
      </section>
    </main>
  );
}

function GameScreen({
  room,
  mySocketId,
  onStart,
  onDiscardAndDraw,
  onPaste,
  onYaniv,
  onTogglePause,
  onLeaveRoom,
  onCopyInvite,
  onApproveNextRound,
  onShowHowToPlay,
  error
}) {
  const [selectedCardIds, setSelectedCardIds] = useState([]);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    setSelectedCardIds([]);
  }, [room?.currentTurn, room?.discardedThisTurn, room?.round]);

  useEffect(() => {
    if (!room?.pasteWindow && !room?.turnEndsAt) return undefined;

    setNow(Date.now());

    const timer = window.setInterval(() => setNow(Date.now()), 200);

    return () => window.clearInterval(timer);
  }, [room?.pasteWindow?.expiresAt, room?.turnEndsAt]);

  if (!room) {
    return (
      <main className="app-shell center-screen">
        <section className="panel">טוען משחק...</section>
      </main>
    );
  }

  const roundWinnerId = getRoundWinnerId(room.roundSummary);
  const yanivCallerId = getRoundYanivCallerId(room.roundSummary);
  const asafPlayerIds = getAsafPlayerIds(room.roundSummary);
  const approvedPlayerIds = getApprovedPlayerIds(room.nextRoundApproval);

  const me = room.players.find((player) => player.id === mySocketId) || room.players[0];

  const myIndex = Math.max(0, room.players.findIndex((player) => player.id === me?.id));
  const turnOrderFromMe = [...room.players.slice(myIndex + 1), ...room.players.slice(0, myIndex)];

  const leftPlayer = turnOrderFromMe[0];
  const topPlayer = turnOrderFromMe[1];
  const rightPlayer = turnOrderFromMe[2];

  const inviteUrl = `${window.location.origin}/game/${room.code}`;
  const isHost = room.hostId === mySocketId;
  const humanPlayersCount = room.players.filter((player) => !player.isBot).length;
  const targetPlayers = room.settings.botGame ? room.players.length : 4;

  const canRequestStart = room.status === 'lobby' && isHost;
  const canStartNow =
    canRequestStart &&
    (room.settings.botGame || (room.mode === 'random' ? humanPlayersCount === 4 : humanPlayersCount >= 2));

  const currentTurnPlayer = room.players.find((player) => player.id === room.currentTurn);
  const turnSecondsLeft = room.turnEndsAt ? Math.max(0, Math.ceil((room.turnEndsAt - now) / 1000)) : null;

  const myHand = sortedCards(me?.hand || []);
  const selectedCards = myHand.filter((card) => selectedCardIds.includes(card.id));
  const legalSelection = isLegalDiscardSelection(selectedCards);

  const canSelectCards = room.status === 'playing' && room.isMyTurn && !room.paused && !room.discardedThisTurn;
  const canPlayToPile = canSelectCards && legalSelection;

  const activePasteWindow = room.pasteWindow && room.pasteWindow.expiresAt > now ? room.pasteWindow : null;

  const canPaste = Boolean(
    activePasteWindow &&
      room.status === 'playing' &&
      !room.paused &&
      me?.id &&
      activePasteWindow.targetPlayerId === me.id
  );

  const pasteSecondsLeft = activePasteWindow ? Math.max(0, Math.ceil((activePasteWindow.expiresAt - now) / 1000)) : 0;

  const nextRoundApproval = room.nextRoundApproval;
  const needsNextRoundApproval = room.status === 'roundEnded' && nextRoundApproval?.canApprove;
  const isMeEliminated = Boolean(me && !me.active);

  function toggleCard(card) {
    if (canPaste && activePasteWindow?.pasteCardId === card.id) {
      onPaste(card.id);
      return;
    }

    if (!canSelectCards) return;

    setSelectedCardIds((current) =>
      current.includes(card.id) ? current.filter((id) => id !== card.id) : [...current, card.id]
    );
  }

  function playToPile(source) {
    if (!canPlayToPile) return;

    onDiscardAndDraw(selectedCardIds, source);
    setSelectedCardIds([]);
  }

  function playerProps(player) {
    return {
      isCurrentTurn: room.currentTurn === player?.id,
      isRoundWinner: roundWinnerId === player?.id,
      isYanivCaller: yanivCallerId === player?.id,
      isAsafPlayer: player?.id ? asafPlayerIds.has(player.id) : false,
      hasApprovedNextRound: player?.id ? approvedPlayerIds.has(player.id) : false
    };
  }

  return (
    <main className="game-shell">
      <header className="game-header">
        <div>
          <strong>יניב</strong>

          <span className="divider">|</span>
          <span>חדר: {room.code}</span>

          {room.round > 0 && (
            <>
              <span className="divider">|</span>
              <span>סיבוב: {room.round}</span>
            </>
          )}

          {room.status === 'playing' && currentTurnPlayer && (
            <>
              <span className="divider">|</span>
              <span>תור: {currentTurnPlayer.name}</span>
              {turnSecondsLeft !== null && <span className="turn-timer">{turnSecondsLeft}</span>}
            </>
          )}
        </div>

        <div className="header-actions">
          {room.settings.botGame && room.status === 'playing' && (
            <button className="small-button" onClick={onTogglePause}>
              {room.paused ? 'המשך' : 'השהיה'}
            </button>
          )}

          <button className="small-button" onClick={onCopyInvite}>
            העתק קישור
          </button>

          <button className="small-danger-button" onClick={onLeaveRoom}>
            עזוב חדר
          </button>

          {canRequestStart && (
            <button className="small-primary-button" onClick={onStart} disabled={!canStartNow}>
              התחל עכשיו
            </button>
          )}
        </div>
      </header>

      {room.status === 'lobby' && (
        <section className="lobby-box">
          <strong>ממתינים לשחקנים</strong>
          <p>
            שחקנים: {humanPlayersCount}/{targetPlayers}
          </p>

          {isHost && !room.settings.botGame && (
            <p className="lobby-note">אפשר להתחיל עכשיו כשיש לפחות 2 שחקנים, או להמשיך לחכות.</p>
          )}

          <p className="url-line">{inviteUrl}</p>

          <button type="button" className="secondary-button" onClick={onShowHowToPlay}>
            איך משחקים?
          </button>
        </section>
      )}

      {isMeEliminated && room.status !== 'finished' && (
        <section className="spectator-banner">
          <strong>הודחת מהמשחק</strong>
          <span>אפשר להישאר ולצפות במשחק, או ללחוץ על "עזוב חדר".</span>

          {room.settings.botGame && <span>אם נשארת לצפות, עדיין תוכל לאשר את הסבב הבא.</span>}
        </section>
      )}

      {room.roundSummary && (
        <section className="round-summary">
          <div className="round-summary-header">
            <strong className="round-summary-title">{room.roundSummary.title}</strong>
            <span className="round-summary-subtitle">סיכום תוצאות הסבב האחרון</span>
          </div>

          {room.roundSummary.eliminatedPlayers?.length > 0 && (
            <div className="elimination-banners">
              {room.roundSummary.eliminatedPlayers.map((player) => (
                <div key={player.id} className="elimination-banner">
                  שחקן {player.name} הודח
                </div>
              ))}
            </div>
          )}

          <div className="summary-grid summary-grid-beautiful">
            {room.roundSummary.players.map((player) => {
              const sourcePlayer = room.players.find((p) => p.id === player.id);
              const avatarData = player.avatar || sourcePlayer?.avatar || null;

              const isWinner = roundWinnerId === player.id;
              const isDeclarer = room.roundSummary.declarerId === player.id;
              const hasApproved = approvedPlayerIds.has(player.id);

              return (
                <div
                  key={player.id}
                  className={[
                    'summary-card',
                    'beautiful-summary-card',
                    player.isAsaf ? 'asaf-summary' : '',
                    isWinner ? 'winner-summary' : '',
                    isDeclarer ? 'declarer-summary' : ''
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <div className="summary-card-top">
                    <div className="summary-avatar-wrap">
                      <Avatar avatar={avatarData} size="small" />
                    </div>

                    <div className="summary-player-meta">
                      <strong className="summary-player-name">{player.name}</strong>

                      <div className="summary-badges">
                        {isDeclarer && <span className="summary-badge yaniv-badge">יניב</span>}
                        {player.isAsaf && <span className="summary-badge asaf-badge">אסף</span>}
                        {isWinner && <span className="summary-badge winner-badge">מנצח הסבב</span>}
                        {hasApproved && <span className="summary-badge approved-summary-badge">✓ אישר</span>}
                      </div>
                    </div>
                  </div>

                  <div className="summary-stats">
                    <div className="summary-stat-row">
                      <span className="summary-stat-label">סכום ביד</span>
                      <span className="summary-stat-value">{player.handValue}</span>
                    </div>

                    <div className="summary-stat-row">
                      <span className="summary-stat-label">נוסף לניקוד</span>
                      <span className="summary-stat-value">{player.scoreAdded ?? 0}</span>
                    </div>

                    <div className="summary-stat-row total-row">
                      <span className="summary-stat-label">סה״כ ניקוד</span>
                      <span className="summary-stat-value">{player.score}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {room.status === 'roundEnded' && nextRoundApproval && (
            <div className="next-round-box">
              <strong>אישור לסבב הבא</strong>
              <span>
                אישרו: {nextRoundApproval.approvedCount}/{nextRoundApproval.requiredCount}
              </span>

              {needsNextRoundApproval ? (
                <button
                  className="small-primary-button"
                  onClick={onApproveNextRound}
                  disabled={nextRoundApproval.hasApproved}
                >
                  {nextRoundApproval.hasApproved ? 'אישרת — ממתינים לשאר' : 'אישור לסבב הבא'}
                </button>
              ) : (
                <span className="lobby-note">ממתינים לאישור השחקנים הפעילים</span>
              )}
            </div>
          )}
        </section>
      )}

      {room.status === 'finished' && room.finalRanking?.length > 0 && (
        <section className="final-ranking">
          <h2>דירוג סופי</h2>

          <div className="ranking-list">
            {room.finalRanking.map((player) => (
              <div key={player.id} className={player.isWinner ? 'ranking-row winner-row' : 'ranking-row'}>
                <strong>{player.label}</strong>
                <span>{player.name}</span>
                <span>{player.score} נק׳</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {room.status !== 'lobby' && (
        <section className="game-table">
          <PlayerSeat player={topPlayer} position="top-seat" {...playerProps(topPlayer)} />
          <PlayerSeat player={rightPlayer} position="right-seat" {...playerProps(rightPlayer)} />
          <PlayerSeat player={leftPlayer} position="left-seat" {...playerProps(leftPlayer)} />

          <div className="center-piles">
            <div className={`pile-block ${canPlayToPile ? 'clickable-pile' : ''}`}>
              <Card hidden onClick={() => playToPile('deck')} />
              <span>קופה</span>
            </div>

            <div className={`pile-block ${canPlayToPile && room.topDiscard ? 'clickable-pile' : ''}`}>
              <Card card={room.topDiscard} onClick={() => playToPile('discard')} />
              <span>קלף גלוי</span>
            </div>

            {activePasteWindow && <div className="paste-window-badge">הדבקה: {pasteSecondsLeft} שנ׳</div>}

            {room.paused && <div className="pause-overlay">מושהה</div>}
          </div>

          <div className={`my-area ${room.isMyTurn ? 'active-turn' : ''}`}>
            <div className="my-info-row">
              <AvatarStatusBox player={me} {...playerProps(me)} />

              <div className="my-name-block">
                <strong>{me?.name}</strong>

                <PlayerStatusBadges
                  isYanivCaller={yanivCallerId === me?.id}
                  isAsafPlayer={me?.id ? asafPlayerIds.has(me.id) : false}
                  hasApprovedNextRound={me?.id ? approvedPlayerIds.has(me.id) : false}
                />
              </div>

              <span>ניקוד: {me?.score}</span>
              <span>סכום יד: {room.myHandValue ?? '-'}</span>
              {room.isMyTurn && <span className="turn-pill">התור שלך</span>}
            </div>

            <div className="my-cards">
              {myHand.map((card) => (
                <Card
                  key={card.id}
                  card={card}
                  selected={selectedCardIds.includes(card.id)}
                  pasteable={canPaste && activePasteWindow?.pasteCardId === card.id}
                  onClick={() => toggleCard(card)}
                />
              ))}
            </div>

            <div className="action-row">
              {selectedCardIds.length > 0 && !legalSelection && <span className="warning-text">הבחירה לא חוקית</span>}

              {room.canDeclareYaniv && (
                <button className="yaniv-button" onClick={onYaniv}>
                  הגד יניב
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {error && <div className="floating-error">{error}</div>}
    </main>
  );
}

function OpeningGameOverlay({ text }) {
  return (
    <div className="opening-game-overlay" role="status" aria-live="polite">
      <div className="opening-game-card">
        <div className="opening-game-spinner" aria-hidden="true" />

        <strong>מכין את המשחק</strong>

        <p>{text || 'פותח משחק... זה יכול לקחת כמה שניות בפעם הראשונה.'}</p>

        <span>נא לא לרענן את הדף.</span>
      </div>
    </div>
  );
}

export default App;