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
    ['long', 'ארוך']
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
  if (face === 'square') return <rect x="31" y="29" width="38" height="42" rx="12" />;
  if (face === 'oval') return <ellipse cx="50" cy="50" rx="19" ry="25" />;
  return <circle cx="50" cy="50" r="21" />;
}

function Avatar({ avatar = DEFAULT_AVATAR, size = 'medium', className = '' }) {
  const data = { ...DEFAULT_AVATAR, ...avatar };

  return (
    <div className={`avatar avatar-${size} ${className}`}>
      <svg viewBox="0 0 100 100" className="avatar-svg" aria-hidden="true">
        <circle cx="50" cy="50" r="48" fill={data.background} />
        <circle cx="50" cy="50" r="46" fill="none" stroke={data.frame} strokeWidth="4" />

        <path d="M24 88 C28 72, 72 72, 76 88 Z" fill={data.shirtColor} />
        {data.shirt === 'hoodie' && <path d="M34 77 C38 68, 62 68, 66 77" fill="none" stroke="#ffffff" strokeWidth="4" />}
        {data.shirt === 'jacket' && <path d="M50 73 L50 91" stroke="#ffffff" strokeWidth="4" />}

        <g fill={data.skin}>
          {getFacePath(data.face)}
          <circle cx="29" cy="50" r="5" />
          <circle cx="71" cy="50" r="5" />
        </g>

        {data.hair === 'short' && (
          <path d="M30 38 C34 24, 66 24, 70 38 C58 31, 42 31, 30 38 Z" fill={data.hairColor} />
        )}
        {data.hair === 'spiky' && (
          <path d="M30 38 L36 23 L43 36 L50 21 L57 36 L64 23 L70 38 C58 31, 42 31, 30 38 Z" fill={data.hairColor} />
        )}
        {data.hair === 'curly' && (
          <g fill={data.hairColor}>
            <circle cx="34" cy="34" r="7" />
            <circle cx="43" cy="30" r="7" />
            <circle cx="52" cy="29" r="7" />
            <circle cx="61" cy="31" r="7" />
            <circle cx="68" cy="36" r="6" />
          </g>
        )}
        {data.hair === 'long' && (
          <path d="M28 40 C29 23, 71 23, 72 40 L69 68 C61 61, 39 61, 31 68 Z" fill={data.hairColor} />
        )}

        {data.hat === 'cap' && (
          <>
            <path d="M31 34 C37 22, 63 22, 69 34 Z" fill="#1f6feb" />
            <path d="M66 34 C76 34, 80 38, 70 40" fill="#1f6feb" />
          </>
        )}
        {data.hat === 'beanie' && <path d="M31 35 C35 21, 65 21, 69 35 Z" fill="#5b2a86" />}
        {data.hat === 'crown' && (
          <path d="M31 34 L38 22 L47 33 L56 22 L65 34 Z" fill="#f2b84b" stroke="#7a4a00" strokeWidth="2" />
        )}
        {data.hat === 'headphones' && (
          <>
            <path d="M28 49 C28 28, 72 28, 72 49" fill="none" stroke="#111827" strokeWidth="5" />
            <rect x="20" y="47" width="10" height="18" rx="4" fill="#111827" />
            <rect x="70" y="47" width="10" height="18" rx="4" fill="#111827" />
          </>
        )}

        <g stroke="#111827" strokeWidth="3" strokeLinecap="round">
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

        {data.glasses !== 'none' && (
          <g fill="none" stroke={data.glasses === 'sun' ? '#111827' : '#0a5b3d'} strokeWidth="3">
            <circle cx="42" cy="49" r={data.glasses === 'square' ? 6 : 7} />
            <circle cx="58" cy="49" r={data.glasses === 'square' ? 6 : 7} />
            <path d="M49 49 L51 49" />
          </g>
        )}

        {data.beard === 'mustache' && <path d="M41 60 Q50 55 59 60" stroke={data.hairColor} strokeWidth="5" strokeLinecap="round" fill="none" />}
        {data.beard === 'short' && <path d="M36 61 Q50 76 64 61 Q58 70 50 70 Q42 70 36 61" fill={data.hairColor} opacity="0.85" />}
        {data.beard === 'full' && <path d="M33 58 Q50 84 67 58 Q62 78 50 80 Q38 78 33 58" fill={data.hairColor} opacity="0.9" />}

        <g stroke="#7a2f1d" strokeWidth="3" strokeLinecap="round" fill="none">
          {data.mouth === 'smile' && <path d="M42 62 Q50 68 58 62" />}
          {data.mouth === 'laugh' && <path d="M41 62 Q50 72 59 62" />}
          {data.mouth === 'serious' && <path d="M43 64 L57 64" />}
        </g>
      </svg>
    </div>
  );
}

export default Avatar;