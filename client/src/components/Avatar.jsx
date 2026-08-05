import React from 'react';

export const DEFAULT_AVATAR = {
  face: 'round',
  skin: '#f2c49b',
  hair: 'short',
  hairColor: '#3b2416',
  eyes: 'happy',
  mouth: 'smile',
  beard: 'none',
  glasses: 'none',
  hat: 'none',
  shirt: 'tshirt',
  shirtColor: '#08a36a',
  background: '#fff1cc',
  frame: '#f2b84b'
};

export const AVATAR_OPTIONS = {
  face: [
    ['round', 'עגול'],
    ['oval', 'אליפסה'],
    ['square', 'מרובע']
  ],
  skin: [
    ['#f6d7b8', 'בהיר'],
    ['#f2c49b', 'בינוני'],
    ['#c88455', 'שזוף'],
    ['#7a4a2b', 'כהה']
  ],
  hair: [
    ['none', 'בלי שיער'],
    ['short', 'קצר'],
    ['spiky', 'קוצים'],
    ['curly', 'מתולתל'],
    ['afro', 'אפרו'],
    ['long', 'ארוך'],
    ['ponytail', 'קוקו']
  ],
  hairColor: [
    ['#1d1d1d', 'שחור'],
    ['#3b2416', 'חום'],
    ['#d6a13b', 'בלונד'],
    ['#9f3a21', 'ג׳ינג׳י'],
    ['#5b2a86', 'סגול'],
    ['#1f6feb', 'כחול']
  ],
  eyes: [
    ['happy', 'שמחות'],
    ['calm', 'רגועות'],
    ['sharp', 'חדות'],
    ['sleepy', 'עייפות']
  ],
  mouth: [
    ['smile', 'חיוך'],
    ['laugh', 'צוחק'],
    ['serious', 'רציני']
  ],
  beard: [
    ['none', 'בלי'],
    ['mustache', 'שפם'],
    ['short', 'זקן קצר'],
    ['full', 'זקן מלא']
  ],
  glasses: [
    ['none', 'בלי'],
    ['round', 'עגולים'],
    ['square', 'מרובעים'],
    ['sun', 'שמש']
  ],
  hat: [
    ['none', 'בלי'],
    ['cap', 'כובע מצחייה'],
    ['beanie', 'כובע גרב'],
    ['crown', 'כתר'],
    ['headphones', 'אוזניות']
  ],
  shirt: [
    ['tshirt', 'חולצה'],
    ['hoodie', 'קפוצ׳ון'],
    ['jacket', 'ז׳קט']
  ],
  shirtColor: [
    ['#08a36a', 'ירוק'],
    ['#f2b84b', 'זהב'],
    ['#1f6feb', 'כחול'],
    ['#d92d20', 'אדום'],
    ['#5b2a86', 'סגול'],
    ['#111827', 'שחור']
  ],
  background: [
    ['#fff1cc', 'צהוב בהיר'],
    ['#e8f4ef', 'ירוק בהיר'],
    ['#e8f0ff', 'כחול בהיר'],
    ['#f5e8ff', 'סגול בהיר'],
    ['#ffe5e5', 'אדום בהיר']
  ],
  frame: [
    ['#f2b84b', 'זהב'],
    ['#08a36a', 'ירוק'],
    ['#1f6feb', 'כחול'],
    ['#5b2a86', 'סגול'],
    ['#111827', 'שחור']
  ]
};

export function createRandomAvatar() {
  const avatar = {};

  for (const [key, options] of Object.entries(AVATAR_OPTIONS)) {
    const option = options[Math.floor(Math.random() * options.length)];
    avatar[key] = option[0];
  }

  return avatar;
}

function getFacePath(face) {
  if (face === 'square') {
    return <rect x="31" y="29" width="38" height="42" rx="12" />;
  }

  if (face === 'oval') {
    return <ellipse cx="50" cy="50" rx="19" ry="25" />;
  }

  return <circle cx="50" cy="50" r="21" />;
}

function Avatar({ avatar = DEFAULT_AVATAR, size = 'medium', className = '' }) {
  const data = { ...DEFAULT_AVATAR, ...avatar };

  return (
    <div className={`avatar avatar-${size} ${className}`}>
      <svg viewBox="0 0 100 100" className="avatar-svg" aria-hidden="true">
        <defs>
          <filter id="avatarSoftShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.22" />
          </filter>

          <linearGradient id="avatarGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fff0a8" />
            <stop offset="45%" stopColor="#f2b84b" />
            <stop offset="100%" stopColor="#a86800" />
          </linearGradient>

          <linearGradient id="avatarCapBlue" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4f8cff" />
            <stop offset="100%" stopColor="#0f4fc4" />
          </linearGradient>

          <linearGradient id="avatarBeaniePurple" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8d5cf6" />
            <stop offset="100%" stopColor="#4a1f86" />
          </linearGradient>
        </defs>

        <circle cx="50" cy="50" r="48" fill={data.background} />
        <circle cx="50" cy="50" r="46" fill="none" stroke={data.frame} strokeWidth="4" />

        {/* Clothes */}
        {data.shirt === 'tshirt' && (
          <path d="M24 88 C28 72, 72 72, 76 88 Z" fill={data.shirtColor} />
        )}

        {data.shirt === 'jacket' && (
          <>
            <path d="M22 89 C27 72, 73 72, 78 89 Z" fill={data.shirtColor} />
            <path d="M42 73 L50 90 L58 73 Z" fill="#ffffff" />
            <path d="M50 73 L50 91" stroke="#d6d6d6" strokeWidth="3" />
            <path d="M35 75 L45 91" stroke="#000000" strokeOpacity="0.16" strokeWidth="3" />
            <path d="M65 75 L55 91" stroke="#000000" strokeOpacity="0.16" strokeWidth="3" />
          </>
        )}

        {data.shirt === 'hoodie' && (
          <>
            <path d="M22 90 C27 70, 73 70, 78 90 Z" fill={data.shirtColor} />

            <path
              d="M29 82 C28 61, 36 43, 50 43 C64 43, 72 61, 71 82 C65 73, 58 68, 50 68 C42 68, 35 73, 29 82 Z"
              fill={data.shirtColor}
            />

            <path
              d="M34 84 C37 73, 43 66, 50 66 C57 66, 63 73, 66 84"
              fill="none"
              stroke="#ffffff"
              strokeWidth="4"
              strokeLinecap="round"
              opacity="0.9"
            />

            <path d="M44 75 L41 90" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
            <path d="M56 75 L59 90" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />

            <path
              d="M36 88 C42 84, 58 84, 64 88"
              fill="none"
              stroke="#000000"
              strokeOpacity="0.16"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </>
        )}

        {/* Hair behind the face */}
        {data.hair === 'long' && (
          <path
            d="M26 42 C25 26, 35 17, 50 17 C65 17, 75 26, 74 42 C79 58, 73 82, 62 88 C61 75, 56 68, 50 68 C44 68, 39 75, 38 88 C27 82, 21 58, 26 42 Z"
            fill={data.hairColor}
            filter="url(#avatarSoftShadow)"
          />
        )}

        {data.hair === 'ponytail' && (
          <>
            <path
              d="M28 40 C28 25, 37 18, 50 18 C63 18, 72 25, 72 40 C70 55, 62 65, 50 65 C38 65, 30 55, 28 40 Z"
              fill={data.hairColor}
              filter="url(#avatarSoftShadow)"
            />
            <path
              d="M68 48 C84 54, 82 77, 67 83 C74 70, 73 59, 64 54 Z"
              fill={data.hairColor}
              filter="url(#avatarSoftShadow)"
            />
          </>
        )}

        {data.hair === 'afro' && (
          <g fill={data.hairColor} filter="url(#avatarSoftShadow)">
            <circle cx="31" cy="39" r="10" />
            <circle cx="38" cy="29" r="11" />
            <circle cx="50" cy="25" r="12" />
            <circle cx="62" cy="29" r="11" />
            <circle cx="69" cy="39" r="10" />
            <circle cx="30" cy="51" r="9" />
            <circle cx="70" cy="51" r="9" />
          </g>
        )}

        {/* Ears and face */}
        <g fill={data.skin}>
          <circle cx="29" cy="50" r="5" />
          <circle cx="71" cy="50" r="5" />
          {getFacePath(data.face)}
        </g>

        {/* Hair on top/front */}
        {data.hair === 'short' && (
          <path
            d="M29 39 C33 25, 67 25, 71 39 C62 34, 56 32, 50 32 C44 32, 38 34, 29 39 Z"
            fill={data.hairColor}
            filter="url(#avatarSoftShadow)"
          />
        )}

        {data.hair === 'spiky' && (
          <g filter="url(#avatarSoftShadow)">
            <path
              d="M28 40
                 C30 31, 34 27, 39 25
                 C40 30, 41 34, 43 37
                 C45 30, 47 24, 50 20
                 C53 25, 55 31, 57 37
                 C60 33, 64 28, 69 25
                 C69 31, 70 36, 72 40
                 C61 34, 39 34, 28 40 Z"
              fill={data.hairColor}
            />

            <path
              d="M34 36 C39 31, 44 30, 50 31 C56 30, 62 31, 68 36"
              fill="none"
              stroke="#ffffff"
              strokeOpacity="0.16"
              strokeWidth="3"
              strokeLinecap="round"
            />

            <path
              d="M39 25 C41 30, 42 34, 43 37"
              fill="none"
              stroke="#000000"
              strokeOpacity="0.12"
              strokeWidth="2"
              strokeLinecap="round"
            />

            <path
              d="M57 37 C60 33, 64 28, 69 25"
              fill="none"
              stroke="#000000"
              strokeOpacity="0.12"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </g>
        )}

        {data.hair === 'curly' && (
          <g fill={data.hairColor} filter="url(#avatarSoftShadow)">
            <circle cx="32" cy="37" r="7" />
            <circle cx="39" cy="30" r="8" />
            <circle cx="48" cy="28" r="8" />
            <circle cx="57" cy="29" r="8" />
            <circle cx="66" cy="35" r="7" />
            <circle cx="37" cy="39" r="6" />
            <circle cx="58" cy="39" r="6" />
          </g>
        )}

        {data.hair === 'long' && (
          <g filter="url(#avatarSoftShadow)">
            <path
              d="M30 40 C33 24, 67 24, 70 40 C60 34, 40 34, 30 40 Z"
              fill={data.hairColor}
            />
            <path
              d="M32 43 C36 36, 44 31, 50 31 C45 38, 39 43, 32 46 Z"
              fill="#ffffff"
              opacity="0.14"
            />
          </g>
        )}

        {data.hair === 'ponytail' && (
          <g filter="url(#avatarSoftShadow)">
            <path
              d="M29 39 C33 25, 67 25, 71 39 C62 34, 55 32, 50 32 C43 32, 36 34, 29 39 Z"
              fill={data.hairColor}
            />
            <path
              d="M63 38 C69 39, 73 44, 73 49"
              fill="none"
              stroke={data.hairColor}
              strokeWidth="7"
              strokeLinecap="round"
            />
          </g>
        )}

        {/* Cap */}
        {data.hat === 'cap' && (
          <g filter="url(#avatarSoftShadow)">
            <path
              d="M30 35 C34 22, 64 21, 70 35 C58 31, 42 31, 30 35 Z"
              fill="url(#avatarCapBlue)"
              stroke="#0b3a8f"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path
              d="M62 34 C72 33, 79 36, 83 41 C73 43, 66 40, 61 36 Z"
              fill="#0f4fc4"
              stroke="#0b3a8f"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path
              d="M37 29 C44 25, 56 25, 63 29"
              fill="none"
              stroke="#ffffff"
              strokeOpacity="0.45"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </g>
        )}

        {/* Beanie */}
        {data.hat === 'beanie' && (
          <g filter="url(#avatarSoftShadow)">
            <path
              d="M31 35 C34 22, 66 22, 69 35 Z"
              fill="url(#avatarBeaniePurple)"
              stroke="#35105f"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <circle cx="50" cy="22" r="5" fill="#5b2a86" stroke="#35105f" strokeWidth="2" />
            <path d="M32 35 Q50 39, 68 35" fill="none" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="3" />
            <path d="M38 27 L38 35" stroke="#ffffff" strokeOpacity="0.25" strokeWidth="2" />
            <path d="M50 25 L50 36" stroke="#ffffff" strokeOpacity="0.25" strokeWidth="2" />
            <path d="M62 27 L62 35" stroke="#ffffff" strokeOpacity="0.25" strokeWidth="2" />
          </g>
        )}

        {/* Crown */}
        {data.hat === 'crown' && (
          <g filter="url(#avatarSoftShadow)">
            <path
              d="M30 37 L35 23 L44 33 L50 19 L56 33 L65 23 L70 37 Z"
              fill="url(#avatarGold)"
              stroke="#7a4a00"
              strokeWidth="2"
              strokeLinejoin="round"
            />

            <path
              d="M31 37 Q50 42, 69 37 L67 44 Q50 49, 33 44 Z"
              fill="url(#avatarGold)"
              stroke="#7a4a00"
              strokeWidth="2"
              strokeLinejoin="round"
            />

            <circle cx="35" cy="23" r="3" fill="#fff4b8" stroke="#7a4a00" strokeWidth="1.5" />
            <circle cx="50" cy="19" r="3.5" fill="#fff4b8" stroke="#7a4a00" strokeWidth="1.5" />
            <circle cx="65" cy="23" r="3" fill="#fff4b8" stroke="#7a4a00" strokeWidth="1.5" />

            <circle cx="42" cy="39" r="2.4" fill="#5b2a86" />
            <circle cx="50" cy="41" r="2.4" fill="#d92d20" />
            <circle cx="58" cy="39" r="2.4" fill="#1f6feb" />
          </g>
        )}

        {/* Headphones */}
        {data.hat === 'headphones' && (
          <g filter="url(#avatarSoftShadow)">
            <path
              d="M26 52 C26 27, 74 27, 74 52"
              fill="none"
              stroke="#111827"
              strokeWidth="6"
              strokeLinecap="round"
            />
            <path
              d="M30 51 C30 33, 70 33, 70 51"
              fill="none"
              stroke="#ffffff"
              strokeOpacity="0.35"
              strokeWidth="2"
              strokeLinecap="round"
            />

            <rect x="19" y="46" width="13" height="22" rx="6" fill="#111827" />
            <rect x="68" y="46" width="13" height="22" rx="6" fill="#111827" />

            <rect x="22" y="50" width="7" height="14" rx="3" fill="#2f3a4d" />
            <rect x="71" y="50" width="7" height="14" rx="3" fill="#2f3a4d" />

            <circle cx="25.5" cy="57" r="2" fill="#1f6feb" />
            <circle cx="74.5" cy="57" r="2" fill="#1f6feb" />
          </g>
        )}

        {/* Eyes */}
        <g stroke="#111827" strokeWidth="3" strokeLinecap="round" fill="none">
          {data.eyes === 'happy' && (
            <>
              <path d="M38 49 Q42 45 46 49" />
              <path d="M54 49 Q58 45 62 49" />
            </>
          )}

          {data.eyes === 'calm' && (
            <>
              <path d="M38 49 L46 49" />
              <path d="M54 49 L62 49" />
            </>
          )}

          {data.eyes === 'sharp' && (
            <>
              <path d="M38 47 L47 50" />
              <path d="M62 47 L53 50" />
            </>
          )}

          {data.eyes === 'sleepy' && (
            <>
              <path d="M38 51 Q42 53 46 51" />
              <path d="M54 51 Q58 53 62 51" />
            </>
          )}
        </g>

        {/* Glasses */}
        {data.glasses === 'round' && (
          <g fill="none" stroke="#0a5b3d" strokeWidth="3" filter="url(#avatarSoftShadow)">
            <circle cx="42" cy="49" r="7" />
            <circle cx="58" cy="49" r="7" />
            <path d="M49 49 L51 49" />
            <path d="M35 48 L31 46" />
            <path d="M65 48 L69 46" />
          </g>
        )}

        {data.glasses === 'square' && (
          <g fill="none" stroke="#0a5b3d" strokeWidth="3" filter="url(#avatarSoftShadow)">
            <rect x="34" y="43" width="15" height="12" rx="3" />
            <rect x="51" y="43" width="15" height="12" rx="3" />
            <path d="M49 49 L51 49" />
            <path d="M34 47 L30 45" />
            <path d="M66 47 L70 45" />
          </g>
        )}

        {data.glasses === 'sun' && (
          <g filter="url(#avatarSoftShadow)">
            <rect x="34" y="43" width="15" height="12" rx="4" fill="#111827" />
            <rect x="51" y="43" width="15" height="12" rx="4" fill="#111827" />
            <path d="M49 49 L51 49" stroke="#111827" strokeWidth="3" strokeLinecap="round" />
            <path d="M38 46 L45 46" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="2" strokeLinecap="round" />
            <path d="M55 46 L62 46" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="2" strokeLinecap="round" />
          </g>
        )}

        {/* Beard */}
        {data.beard === 'mustache' && (
          <path
            d="M41 60 Q50 55 59 60"
            stroke={data.hairColor}
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
          />
        )}

        {data.beard === 'short' && (
          <path
            d="M36 61 Q50 76 64 61 Q58 70 50 70 Q42 70 36 61"
            fill={data.hairColor}
            opacity="0.85"
          />
        )}

        {data.beard === 'full' && (
          <path
            d="M33 58 Q50 84 67 58 Q62 78 50 80 Q38 78 33 58"
            fill={data.hairColor}
            opacity="0.9"
          />
        )}

        {/* Mouth */}
        <g stroke="#7a2f1d" strokeWidth="3" strokeLinecap="round" fill="none">
          {data.mouth === 'smile' && <path d="M42 62 Q50 68 58 62" />}
          {data.mouth === 'laugh' && <path d="M41 62 Q50 72 59 62" />}
          {data.mouth === 'serious' && <path d="M43 64 L57 64" />}
        </g>
      </svg>
    </div>
  );
}

function PlayerAvatarDisplay({
  player,
  isCurrentTurn,
  isEliminated,
  isRoundWinner
}) {
  const avatarData = player.avatarData || player.avatar || { ...DEFAULT_AVATAR };

  return (
    <div
      className={[
        'player-avatar-box',
        isCurrentTurn ? 'current-turn' : '',
        isEliminated ? 'eliminated' : '',
        isRoundWinner ? 'round-winner' : ''
      ].join(' ')}
    >
      {isRoundWinner && <div className="avatar-badge crown-badge">👑</div>}
      {isCurrentTurn && <div className="avatar-badge turn-badge">תור</div>}

      <Avatar avatar={avatarData} size="small" />
    </div>
  );
}

export default Avatar;