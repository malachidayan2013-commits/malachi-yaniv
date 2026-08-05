import React, { useMemo, useState } from 'react';
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
  const safeAvatars = avatars?.length ? avatars : [];
  const activeAvatar = safeAvatars.find((item) => item.id === activeAvatarId) || safeAvatars[0];

  const [selectedId, setSelectedId] = useState(activeAvatar?.id || null);
  const selectedAvatar = safeAvatars.find((item) => item.id === selectedId);

  const [draftName, setDraftName] = useState(selectedAvatar?.name || 'האוואטר שלי');
  const [draft, setDraft] = useState(selectedAvatar?.data || { ...DEFAULT_AVATAR });

  const selectedTitle = useMemo(() => {
    if (selectedAvatar) return selectedAvatar.name;
    return 'אווטאר חדש';
  }, [selectedAvatar]);

  function persist(nextAvatars, nextActiveId) {
    onSaveAll(nextAvatars, nextActiveId);
  }

  function updateDraft(key, value) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function chooseAvatar(item) {
    setSelectedId(item.id);
    setDraftName(item.name);
    setDraft(item.data);
    persist(safeAvatars, item.id);
  }

  function saveAvatar() {
    const cleanName = draftName.trim() || 'האוואטר שלי';

    if (selectedId && safeAvatars.some((item) => item.id === selectedId)) {
      const next = safeAvatars.map((item) =>
        item.id === selectedId
          ? {
              ...item,
              name: cleanName,
              data: draft
            }
          : item
      );

      persist(next, selectedId);
      return;
    }

    const id = makeId();
    const next = [
      ...safeAvatars,
      {
        id,
        name: cleanName,
        data: draft
      }
    ];

    setSelectedId(id);
    persist(next, id);
  }

  function saveAsNew() {
    const id = makeId();
    const cleanName = draftName.trim() || getNextAvatarName(safeAvatars);

    const next = [
      ...safeAvatars,
      {
        id,
        name: cleanName,
        data: draft
      }
    ];

    setSelectedId(id);
    persist(next, id);
  }

  function createNew() {
    const id = makeId();
    const name = getNextAvatarName(safeAvatars);
    const data = { ...DEFAULT_AVATAR };

    const next = [
      ...safeAvatars,
      {
        id,
        name,
        data
      }
    ];

    setSelectedId(id);
    setDraftName(name);
    setDraft(data);

    persist(next, id);
  }

  function randomize() {
    setDraft(createRandomAvatar());
  }

  function duplicateAvatar() {
    const id = makeId();
    const name = `${draftName || selectedTitle} - עותק`;

    const next = [
      ...safeAvatars,
      {
        id,
        name,
        data: draft
      }
    ];

    setSelectedId(id);
    setDraftName(name);
    persist(next, id);
  }

  function deleteAvatar(id) {
    const next = safeAvatars.filter((item) => item.id !== id);
    const nextActiveId = activeAvatarId === id ? next[0]?.id || null : activeAvatarId;

    if (selectedId === id) {
      setSelectedId(next[0]?.id || null);
      setDraftName(next[0]?.name || 'האוואטר שלי');
      setDraft(next[0]?.data || { ...DEFAULT_AVATAR });
    }

    persist(next, nextActiveId);
  }

  return (
    <main className="app-shell center-screen">
      <section className="panel avatar-builder-panel">
        <h1>צור אווטאר</h1>

        <div className="avatar-builder-layout">
          <div className="avatar-preview-box">
            <Avatar avatar={draft} size="large" />

            <input
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              placeholder="שם לאווטאר"
            />

            <div className="avatar-actions">
              <button className="primary-button" onClick={saveAvatar}>
                שמור אווטאר
              </button>

              <button className="secondary-button" onClick={saveAsNew}>
                שמור כחדש
              </button>

              <button className="secondary-button" onClick={randomize}>
                אווטאר אקראי
              </button>

              <button className="link-button" onClick={duplicateAvatar}>
                שכפל
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

        <div className="saved-avatars-box">
          <div className="saved-avatars-title">האוואטרים שלי</div>

          <div className="saved-avatars-grid">
            {safeAvatars.map((item) => (
              <div key={item.id} className={item.id === activeAvatarId ? 'saved-avatar active' : 'saved-avatar'}>
                <Avatar avatar={item.data} size="small" />

                <strong>{item.name}</strong>

                <button className="small-primary-button" onClick={() => chooseAvatar(item)}>
                  בחר
                </button>

                <button
                  className="small-button"
                  onClick={() => {
                    setSelectedId(item.id);
                    setDraftName(item.name);
                    setDraft(item.data);
                  }}
                >
                  ערוך
                </button>

                <button
                  className="small-danger-button"
                  onClick={() => deleteAvatar(item.id)}
                  disabled={safeAvatars.length <= 1}
                >
                  מחק
                </button>
              </div>
            ))}

            <button className="saved-avatar create-avatar-card" onClick={createNew}>
              <span className="create-avatar-plus">+</span>
              <strong>צור חדש</strong>
            </button>
          </div>
        </div>

        <button className="link-button" onClick={onBack}>
          חזרה לתפריט
        </button>
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