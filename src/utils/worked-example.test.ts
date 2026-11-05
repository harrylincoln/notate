import { mutateNotesToActiveKey, assignTabValues, groupByPosition, groupByString, buildAsciTable } from './notation-rules';
import type { ConversionNote } from '../types';

it('verifies the guide E4 F4 G4 E4 example against the existing guitar mapping', () => {
  // Internal octave group 2 at E/F/G corresponds to guitar written E5/F5/G5.
  const notes: ConversionNote[] = ['E', 'F', 'G', 'E'].map((pitch, index) => ({
    pitch: { [pitch]: 2 }, accidentalOverride: false, activeNoteLength: 16,
    closestBeatX: 40 + index * 160, lowerBoundValue: 0, upperBoundValue: 12,
  }));
  const result = buildAsciTable(groupByString(groupByPosition(assignTabValues(mutateNotesToActiveKey(notes, 'C')))));
  expect([result[0][3], result[0][19], result[0][35], result[0][51]]).toEqual(['0', '1', '3', '0']);
  expect(result.slice(1).every(line => /^-+$/.test(line))).toBe(true);
  // Standard tuning MIDI notes low E to high E: E2 A2 D3 G3 B3 E4.
  const open = [40, 45, 50, 55, 59, 64];
  const e4Positions = [[1, 0], [2, 5], [3, 9], [4, 14], [5, 19]];
  expect(e4Positions.map(([string, fret]) => open[6 - string] + fret)).toEqual([64, 64, 64, 64, 64]);
});
