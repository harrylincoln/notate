import type { SavedBars, SavedNote, UserData } from '../types';

const defaults = (): UserData => ({ appStep: 0, userKey: 'C' });

function isNote(value: unknown): value is SavedNote {
  if (!value || typeof value !== 'object') return false;
  const note = value as SavedNote;
  return [note.closestBeatX, note.lineY, note.baseNoteSize, note.activeNoteLength,
    note.closestStave?.x0, note.closestStave?.y0, note.closestStave?.x1, note.closestStave?.y1]
    .every(Number.isFinite) && Boolean(note.closestStave?.note)
    && ['flat', 'sharp', 'natural', false].includes(note.accidentalOverride)
    && Object.values(note.closestStave.note).every(Number.isFinite);
}

export function retrieveUserData(): UserData {
  try {
    const raw = localStorage.getItem('userData');
    if (!raw) return defaults();
    const stored = JSON.parse(raw) as Partial<UserData> & Record<string, unknown>;
    const savedNotesArr: SavedBars = {};
    // Older builds sometimes stored bars at the root instead of savedNotesArr.
    const bars = stored.savedNotesArr || stored;
    for (const [bar, notes] of Object.entries(bars)) {
      if (/^[1-9]\d*$/.test(bar) && Array.isArray(notes)) savedNotesArr[bar] = notes.filter(isNote);
    }
    return {
      appStep: stored.appStep === 1 ? 1 : 0,
      userKey: typeof stored.userKey === 'string' ? stored.userKey : 'C',
      ...(stored.activeBarNumber && Number.isInteger(stored.activeBarNumber) && stored.activeBarNumber > 0
        ? { activeBarNumber: stored.activeBarNumber } : {}),
      ...(Object.keys(savedNotesArr).length ? { savedNotesArr } : {}),
    };
  } catch {
    return defaults();
  }
}

export function writeToUserData(data: UserData): void {
  try { localStorage.setItem('userData', JSON.stringify(data)); } catch {
    // Private browsing, full storage or blocked storage must not stop conversion.
  }
}
