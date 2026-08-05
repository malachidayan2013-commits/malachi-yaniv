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

  const safeAvatars = localAvatars;
  const activeAvatar = safeAvatars.find((item) => item.id === localActiveId) || safeAvatars[0];

  const [selectedId, setSelectedId] = useState(activeAvatar?.id || null);
  const selectedAvatar = safeAvatars.find((item) => item.id === selectedId);

  const [draftName, setDraftName] = useState(selectedAvatar?.name || 'האוואטר שלי');
  const [draft, setDraft] = useState(selectedAvatar?.data || { ...DEFAULT_AVATAR });

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

  function persist(nextAvatars, nextActiveId) {
    setLocalAvatars(nextAvatars);
    setLocalActiveId(nextActiveId || '');
    onSaveAll(nextAvatars, nextActiveId || '');
  }

  function updateDraft(key, value) {
    const nextDraft = { ...draft, [key]: value };
    setDraft(nextDraft);

    if (selectedId && safeAvatars.some((item) => item.id === selectedId)) {
      const nextAvatars = safeAvatars.map((item) =>
        item.id === selectedId ? { ...item, data: nextDraft } : item
      );

      persist(nextAvatars, localActiveId);
    }
  }

  function updateDraftName(value) {
    setDraftName(value);

    if (selectedId && safeAvatars.some((item) => item.id === selectedId)) {
      const nextAvatars = safeAvatars.map((item) =>
        item.id === selectedId ? { ...item, name: value.trim() || item.name } : item
      );

      persist(nextAvatars, localActiveId);
    }
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
      const nextAvatars = safeAvatars.map((item) =>
        item.id === selectedId ? { ...item, name: cleanName, data: draft } : item
      );

      persist(nextAvatars, selectedId);
      return;
    }

    const id = makeId();

    const nextAvatars = [
      ...safeAvatars,
      {
        id,
        name: cleanName,
        data: { ...draft }
      }
    ];

    setSelectedId(id);
    setDraftName(cleanName);
    setDraft({ ...draft });

    persist(nextAvatars, id);
  }

  function createNew() {
    const id = makeId();
    const name = getNextAvatarName(safeAvatars);
    const data = { ...DEFAULT_AVATAR };

    const nextAvatars = [
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

    persist(nextAvatars, id);
  }

  function randomize() {
    const nextDraft = createRandomAvatar();
    setDraft(nextDraft);

    if (selectedId && safeAvatars.some((item) => item.id === selectedId)) {
      const nextAvatars = safeAvatars.map((item) =>
        item.id === selectedId ? { ...item, data: nextDraft } : item
      );

      persist(nextAvatars, localActiveId);
    }
  }

  function duplicateAvatar() {
    const id = makeId();
    const name = `${draftName || selectedTitle} - עותק`;

    const nextAvatars = [
      ...safeAvatars,
      {
        id,
        name,
        data: { ...draft }
      }
    ];

    setSelectedId(id);
    setDraftName(name);
    setDraft({ ...draft });

    persist(nextAvatars, id);
  }

  function deleteAvatar(id) {
    const nextAvatars = safeAvatars.filter((item) => item.id !== id);
    const nextActiveId = localActiveId === id ? nextAvatars[0]?.id || '' : localActiveId;

    if (selectedId === id) {
      const nextSelected = nextAvatars[0] || null;

      setSelectedId(nextSelected?.id || null);
      setDraftName(nextSelected?.name || 'האוואטר שלי');
      setDraft(nextSelected?.data || { ...DEFAULT_AVATAR });
    }

    persist(nextAvatars, nextActiveId);
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
              onChange={(event) => updateDraftName(event.target.value)}
              placeholder="שם לאווטאר"
            />

            <div className="avatar-actions">
              <button type="button" className="primary-button" onClick={saveAvatar}>
                שמור אווטאר
              </button>

              <button type="button" className="secondary-button" onClick={randomize}>
                אווטאר אקראי
              </button>

              <button type="button" className="link-button" onClick={duplicateAvatar}>
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
              <div key={item.id} className={item.id === localActiveId ? 'saved-avatar active' : 'saved-avatar'}>
                <Avatar avatar={item.data} size="small" />

                <strong>{item.name}</strong>

                <button type="button" className="small-primary-button" onClick={() => chooseAvatar(item)}>
                  בחר
                </button>

                <button
                  type="button"
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
                  type="button"
                  className="small-danger-button"
                  onClick={() => deleteAvatar(item.id)}
                  disabled={safeAvatars.length <= 1}
                >
                  מחק
                </button>
              </div>
            ))}

            <button type="button" className="saved-avatar create-avatar-card" onClick={createNew}>
              <span className="create-avatar-plus">+</span>
              <strong>צור אווטאר חדש</strong>
            </button>
          </div>
        </div>

        <button type="button" className="link-button" onClick={onBack}>
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