import React, { useEffect, useMemo, useState } from 'react';
import Avatar, { AVATAR_OPTIONS, DEFAULT_AVATAR, createRandomAvatar } from './Avatar.jsx';

function makeId() {
  return `avatar-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getNextAvatarName(avatars) {
  const existingNames = new Set((avatars || []).map((item) => item.name));
  let number = (avatars?.length || 0) + 1;
  let name = `אווטאר ${number}`;

  while (existingNames.has(name)) {
    number += 1;
    name = `אווטאר ${number}`;
  }

  return name;
}

function AvatarBuilder({ avatars, activeAvatarId, onSaveAll, onBack }) {
  const [localAvatars, setLocalAvatars] = useState(() => (avatars?.length ? avatars : []));
  const [localActiveId, setLocalActiveId] = useState(activeAvatarId || '');

  const [mode, setMode] = useState('gallery');
  const [selectedId, setSelectedId] = useState(null);
  const selectedAvatar = localAvatars.find((item) => item.id === selectedId);

  const [draftName, setDraftName] = useState('האוואטר שלי');
  const [draft, setDraft] = useState({ ...DEFAULT_AVATAR });

  useEffect(() => {
    setLocalAvatars(avatars?.length ? avatars : []);
  }, [avatars]);

  useEffect(() => {
    setLocalActiveId(activeAvatarId || '');
  }, [activeAvatarId]);

  const selectedTitle = useMemo(() => {
    if (selectedAvatar) return selectedAvatar.name;
    return 'אווטאר חדש';
  }, [selectedAvatar]);

  function persist(nextAvatars, nextActiveId = localActiveId) {
    setLocalAvatars(nextAvatars);
    setLocalActiveId(nextActiveId || '');
    onSaveAll(nextAvatars, nextActiveId || '');
  }

  function openEditor(item) {
    setSelectedId(item.id);
    setDraftName(item.name);
    setDraft({ ...DEFAULT_AVATAR, ...item.data });
    setMode('editor');
  }

  function createNewAvatar() {
    const id = makeId();
    const name = getNextAvatarName(localAvatars);
    const data = { ...DEFAULT_AVATAR };

    const nextAvatars = [
      ...localAvatars,
      {
        id,
        name,
        data
      }
    ];

    persist(nextAvatars, id);

    setSelectedId(id);
    setDraftName(name);
    setDraft(data);
    setMode('editor');
  }

  function updateDraft(key, value) {
    const nextDraft = { ...draft, [key]: value };
    setDraft(nextDraft);

    if (selectedId) {
      const nextAvatars = localAvatars.map((item) =>
        item.id === selectedId ? { ...item, data: nextDraft } : item
      );

      persist(nextAvatars, localActiveId);
    }
  }

  function updateDraftName(value) {
    setDraftName(value);

    if (selectedId) {
      const nextAvatars = localAvatars.map((item) =>
        item.id === selectedId ? { ...item, name: value.trim() || item.name } : item
      );

      persist(nextAvatars, localActiveId);
    }
  }

  function saveAvatar() {
    const cleanName = draftName.trim() || 'האוואטר שלי';

    if (!selectedId) return;

    const nextAvatars = localAvatars.map((item) =>
      item.id === selectedId
        ? {
            ...item,
            name: cleanName,
            data: { ...draft }
          }
        : item
    );

    setDraftName(cleanName);
    persist(nextAvatars, selectedId);
  }

  function chooseAvatar() {
    if (!selectedId) return;
    persist(localAvatars, selectedId);
  }

  function randomize() {
    const nextDraft = createRandomAvatar();
    setDraft(nextDraft);

    if (selectedId) {
      const nextAvatars = localAvatars.map((item) =>
        item.id === selectedId ? { ...item, data: nextDraft } : item
      );

      persist(nextAvatars, localActiveId);
    }
  }

  function duplicateAvatar() {
    const id = makeId();
    const name = `${draftName || selectedTitle} - עותק`;

    const nextAvatars = [
      ...localAvatars,
      {
        id,
        name,
        data: { ...draft }
      }
    ];

    persist(nextAvatars, id);

    setSelectedId(id);
    setDraftName(name);
    setDraft({ ...draft });
    setMode('editor');
  }

  function deleteAvatar() {
    if (!selectedId) return;

    const nextAvatars = localAvatars.filter((item) => item.id !== selectedId);
    const nextActiveId = localActiveId === selectedId ? nextAvatars[0]?.id || '' : localActiveId;

    persist(nextAvatars, nextActiveId);

    setSelectedId(null);
    setDraftName('האוואטר שלי');
    setDraft({ ...DEFAULT_AVATAR });
    setMode('gallery');
  }

  if (mode === 'gallery') {
    return (
      <main className="app-shell center-screen">
        <section className="panel avatar-gallery-panel">
          <div className="avatar-gallery-header">
            <h1>האוואטרים שלי</h1>
            <p>בחר אווטאר לעריכה, או צור אווטאר חדש.</p>
          </div>

          <div className="avatar-gallery-layout">
            <div className="avatar-gallery-grid">
              {localAvatars.length > 0 ? (
                localAvatars.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={item.id === localActiveId ? 'avatar-gallery-card active' : 'avatar-gallery-card'}
                    onClick={() => openEditor(item)}
                  >
                    <Avatar avatar={item.data} size="large" />

                    <strong>{item.name}</strong>

                    {item.id === localActiveId && <span className="active-avatar-label">נבחר למשחק</span>}
                  </button>
                ))
              ) : (
                <div className="empty-avatar-gallery">
                  <strong>אין לך עדיין אווטארים</strong>
                  <span>לחץ על “צור אווטאר חדש” כדי להתחיל.</span>
                </div>
              )}
            </div>

            <aside className="avatar-gallery-actions">
              <button type="button" className="primary-button" onClick={createNewAvatar}>
                צור אווטאר חדש
              </button>

              <button type="button" className="link-button" onClick={onBack}>
                חזרה לתפריט
              </button>
            </aside>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell center-screen">
      <section className="panel avatar-editor-panel">
        <div className="avatar-editor-header">
          <button type="button" className="small-button" onClick={() => setMode('gallery')}>
            חזרה לאוואטרים שלי
          </button>

          <h1>עריכת אווטאר</h1>
        </div>

        <div className="avatar-editor-layout">
          <div className="avatar-preview-box">
            <Avatar avatar={draft} size="large" />

            <input
              value={draftName}
              onChange={(event) => updateDraftName(event.target.value)}
              placeholder="שם לאווטאר"
            />

            <div className="avatar-actions">
              <button type="button" className="primary-button" onClick={chooseAvatar}>
                בחר למשחק
              </button>

              <button type="button" className="secondary-button" onClick={saveAvatar}>
                שמור אווטאר
              </button>

              <button type="button" className="secondary-button" onClick={randomize}>
                אווטאר אקראי
              </button>

              <button type="button" className="link-button" onClick={duplicateAvatar}>
                שכפל
              </button>

              <button
                type="button"
                className="small-danger-button"
                onClick={deleteAvatar}
                disabled={localAvatars.length <= 1}
              >
                מחק אווטאר
              </button>
            </div>
          </div>

          <div className="avatar-controls">
            {Object.entries(AVATAR_OPTIONS).map(([key, options]) => (
              <label key={key}>
                {categoryTitle(key)}

                <select value={draft[key]} onChange={(event) => updateDraft(key, event.target.value)}>
                  {options.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function categoryTitle(key) {
  const titles = {
    face: 'צורת פנים',
    skin: 'צבע עור',
    hair: 'שיער',
    hairColor: 'צבע שיער',
    eyes: 'עיניים',
    mouth: 'פה',
    beard: 'זקן / שפם',
    glasses: 'משקפיים',
    hat: 'כובע / אביזר',
    shirt: 'חולצה',
    shirtColor: 'צבע חולצה',
    background: 'רקע',
    frame: 'מסגרת'
  };

  return titles[key] || key;
}

export default AvatarBuilder;