import { drawNotes, drawStaves, linepointNearestMouse } from './canvas';
import { staves } from './notation-rules';
import type { SavedNote } from '../types';
const ctx = () => document.createElement('canvas').getContext('2d')!;
const middleC: SavedNote = {
  closestBeatX: 40, lineY: 340, baseNoteSize: 18, activeNoteLength: 16,
  closestStave: staves.map.find(stave => stave.y0 === 340)!, accidentalOverride: false,
};

it('draws five staff lines and snaps to the same staff y coordinate', () => {
  const context = ctx();
  drawStaves(context);
  expect(context.lineTo).toHaveBeenCalledTimes(5);
  expect(linepointNearestMouse(middleC.closestStave, 40, 337)).toEqual({ y: 340 });
});
it('draws the existing quarter-note stem, filled head and middle-C ledger', () => {
  const context = ctx();
  drawNotes([middleC], context, 64);
  expect(context.fill).toHaveBeenCalledTimes(1);
  expect(context.moveTo).toHaveBeenCalledWith(64, 340);
  expect(context.lineTo).toHaveBeenCalledWith(64, 232);
  expect(context.moveTo).toHaveBeenCalledWith(4, 340);
  expect(context.lineTo).toHaveBeenCalledWith(76, 340);
});
it('draws an unfilled whole note and flags for eighth notes', () => {
  const context = ctx();
  drawNotes([{ ...middleC, activeNoteLength: 64 }], context, 64);
  expect(context.fill).not.toHaveBeenCalled();
  drawNotes([{ ...middleC, activeNoteLength: 8 }], context, 64);
  expect(context.bezierCurveTo).toHaveBeenCalledTimes(3);
});
it('draws sharp, flat and natural overrides', () => {
  const context = ctx();
  drawNotes([{ ...middleC, accidentalOverride: 'sharp' }], context, 64);
  expect(context.lineTo).toHaveBeenCalledTimes(6);
  vi.clearAllMocks();
  drawNotes([{ ...middleC, accidentalOverride: 'flat' }], context, 64);
  expect(context.ellipse).toHaveBeenCalledTimes(2);
  vi.clearAllMocks();
  drawNotes([{ ...middleC, accidentalOverride: 'natural' }], context, 64);
  expect(context.lineTo).toHaveBeenCalledTimes(6);
});
