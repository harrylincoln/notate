export type Accidental = false | 'flat' | 'sharp' | 'natural';
export type Pitch = Record<string, number>;
export interface Stave {
  x0: number; y0: number; x1: number; y1: number;
  ledger?: number[]; draw?: boolean; note: Pitch;
}
export interface SavedNote {
  closestBeatX: number; lineY: number; baseNoteSize: number;
  activeNoteLength: number; closestStave: Stave; accidentalOverride: Accidental;
}
export type SavedBars = Record<string, SavedNote[]>;
export interface UserData {
  appStep: 0 | 1;
  userKey: string;
  activeBarNumber?: number;
  savedNotesArr?: SavedBars;
}
export interface ConversionNote {
  accidentalOverride: Accidental; activeNoteLength: number; pitch: Pitch;
  closestBeatX: number; lowerBoundValue: number; upperBoundValue: number;
}
export interface TabPosition { string: number; fret: number }
export interface AssignedNote extends ConversionNote { tabPosition: TabPosition[] }
export interface PositionedNote extends ConversionNote { tabPosition?: TabPosition }
export type StringGroups = Record<number, PositionedNote[]>;
