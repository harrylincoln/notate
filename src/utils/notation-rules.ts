import type { Stave, ConversionNote, AssignedNote, PositionedNote, StringGroups } from '../types';

import {positions} from './positions';

export const staves: { map: Stave[]; snapTolerance: number } = {
    map: [
      {x0:0,y0:0,x1:800,y1:0, ledger: [-5,-3, 1], note: {F: 3}},
      {x0:0,y0:20,x1:800,y1:20, ledger: [-4,-2, 0], note: {E: 3}},
      {x0:0,y0:40,x1:800,y1:40, ledger: [-3,-1], note: {D: 2}},
      {x0:0,y0:60,x1:800,y1:60, ledger: [-2,0], note: {C: 2}},
      {x0:0,y0:80,x1:800,y1:80, ledger: [-1], note: {B: 2}},
      {x0:0,y0:100,x1:800,y1:100, ledger: [0], note: {A: 2}},
      {x0:0,y0:120,x1:800,y1:120, note: {G: 2}},
      {x0:0,y0:140,x1:800,y1:140, draw: true, note: {F: 2}},
      {x0:0,y0:160,x1:800,y1:160, note: {E: 2}},
      {x0:0,y0:180,x1:800,y1:180, draw: true, note: {D: 1}},
      {x0:0,y0:200,x1:800,y1:200, note: {C: 1}},
      {x0:0,y0:220,x1:800,y1:220, draw: true, note: {B: 1}},
      {x0:0,y0:240,x1:800,y1:240, note: {A: 1}},
      {x0:0,y0:260,x1:800,y1:260, draw: true, note: {G: 1}},
      {x0:0,y0:280,x1:800,y1:280, note: {F: 1}},
      {x0:0,y0:300,x1:800,y1:300, draw: true, note: {E: 1}},
      {x0:0,y0:320,x1:800,y1:320, note: {D: 0}},
      {x0:0,y0:340,x1:800,y1:340, ledger: [0], note: {C: 0}},
      {x0:0,y0:360,x1:800,y1:360, ledger: [1], note: {B: 0}},
      {x0:0,y0:380,x1:800,y1:380, ledger: [2,0], note: {A: 0}},
      {x0:0,y0:400,x1:800,y1:400, ledger: [3,1], note: {G: 0}},
      {x0:0,y0:420,x1:800,y1:420, ledger: [4,2,0], note: {F: 0}},
      {x0:0,y0:440,x1:800,y1:440, ledger: [5,3,1], note: {E: 0}},
    ],
    snapTolerance: 10,
  };

export const circleOfFifths: Record<string, number[]> = {
  'C':     [0,0,0,0,0,0,0],
  'G':     [0,0,0,0,0,1,0],
  'D':     [0,0,1,0,0,1,0],
  'A':     [0,0,1,0,0,1,1],
  'E':     [0,0,1,1,0,1,1],
  'B':     [1,0,1,1,0,1,1],
  'F#':    [1,0,1,1,1,1,1],
  'Gb':    [2,2,2,2,2,0,2],
  'Db':    [2,2,0,2,2,0,2],
  'C#':    [1,1,1,1,1,1,1],
  'Ab':    [2,2,0,2,2,0,0],
  'G#':    [2,2,0,2,2,0,0],
  'D#':    [2,2,0,0,2,0,0],
  'Eb':    [2,2,0,0,2,0,0],
  'A#':    [0,2,0,0,2,0,0],
  'Bb':    [0,2,0,0,2,0,0],
  'F':     [0,2,0,0,0,0,0],
};

const dicMapping: Record<string, number> = {A:0,B:1,C:2,D:3,E:4,F:5,G:6}

export const mutateNotesToActiveKey = (notesArr: ConversionNote[], activeKey: string): ConversionNote[] => {
  const mapper = circleOfFifths[activeKey];
  if (!Array.isArray(mapper)) throw new Error('Choose a supported musical key.');

  return notesArr.reduce<ConversionNote[]>((acc, curr) => {
      const { accidentalOverride, pitch } = curr;
      const idxToSearchMapper = dicMapping[Object.keys(pitch)[0]];
      let noteCase = mapper[idxToSearchMapper];

      if(accidentalOverride) {
        switch (accidentalOverride) {
          case 'natural':
            noteCase = 0;
            break;
          case 'sharp':
            noteCase = 1;
            break;
          case 'flat':
            noteCase = 2;
            break;
          default:
            break;
        }
      }
      switch (noteCase) {
        case 1:
          acc.push({...curr, 
            pitch: {
              [`${Object.keys(pitch)}#`]: Object.values(pitch)[0]
            } 
          })
          break;
        case 2:
          acc.push({...curr, 
            pitch: {
              [`${Object.keys(pitch)}b`]: Object.values(pitch)[0]
            } 
          })
          break;
        default:
          acc.push(curr);
        break;
      }
      return acc;
  }, []);
};

export const assignTabValues = (mutatedNotesArr: ConversionNote[]): AssignedNote[] => {
  return mutatedNotesArr.reduce<AssignedNote[]>((acc, curr) => {
    const tabPosition = positions[Object.keys(curr.pitch)[0]]?.[Object.values(curr.pitch)[0]];
    if (!tabPosition) throw new Error('This pitch is outside the supported guitar range.');
    acc.push({...curr,
      tabPosition,
    });
    return acc;
  }, []);
};

export const groupByPosition = (assignTabValuesArr: AssignedNote[]): PositionedNote[] => {
  return assignTabValuesArr.reduce<PositionedNote[]>((acc, curr, idx) => {
    const previous = acc[idx -1];
    const candidates = [...curr.tabPosition].sort((a, b) => a.fret - b.fret);
    const tabPositionWithBounds = candidates
    .filter(pos => pos.fret >= curr.lowerBoundValue && pos.fret <= curr.upperBoundValue)
    .shift();
    
    let filteredTabPosition = tabPositionWithBounds;

    // if same position & string as last entry
    if(previous?.tabPosition && filteredTabPosition && (previous.closestBeatX === curr.closestBeatX) && (filteredTabPosition.string === previous.tabPosition.string)) {

      // find in curr.tabPosition what idx this is
      const activeIdx = candidates.findIndex(stringFretPair => stringFretPair.string === tabPositionWithBounds?.string);

      // take whichever is free/exists
      filteredTabPosition = candidates[activeIdx -1] || candidates[activeIdx +1];

    }

    acc.push({...curr, tabPosition: filteredTabPosition});
    return acc;
  }, []);
};

export const groupByString = (groupByStringArr: PositionedNote[]): StringGroups => {

  const stringData: StringGroups = {
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
    6: [],
  };
  groupByStringArr.forEach(item => {
    if(item.tabPosition) {
      stringData[item.tabPosition.string].push(item)
    } else {
      throw new Error('Note(s) out of bounds for your fret range(s). Reload to clear bar and try reconfiguring Fret min/max #');
    }
  });
  return stringData;
};

export const buildAsciTable = (groupedByStringsArr: StringGroups): string[] => {
  return Object.values(groupedByStringsArr).reduce<string[]>((acc, string) => {
    let stringOutput = '';
    for (let i = 1; i < 65; i+=1) {
      const cord = i*10;
      if(string.length === 0) {
        stringOutput += '-';
      } else {
        const item = string.find(note => note.closestBeatX === cord);
        if (item) {
          stringOutput += item.tabPosition!.fret;
        } else {
          stringOutput += '-';
        }
      }
    }
    acc.push(stringOutput);
    return acc;
  }, []).reverse();
};