/* eslint-disable no-loop-func */
import {positions} from './positions';

export const staves = {
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


/* array entries key:
    [0,0,0,0,0,0,0] = A->G
    0 = none
    1 = #
    2 = b
    eg. C major has no sharps or flats, hence [0,0,0,0,0,0,0]
*/
const circleOfFifths = {
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

const dicMapping = {A:0,B:1,C:2,D:3,E:4,F:5,G:6}


  /*
  E ----------------------------------------------------------------|
  B ----------------------------------------------------------------|
  G ----------------------------------------------------------------|
  D ----------------------------------------------------------------|
  A ----------------------------------------------------------------|
  E ----------------------------------------------------------------|
  */

  /* 1. sort array based on closestBeatX value
     2. Mutate array by transposing note entries to active key
     3. Spread tab values onto given note object entry 
     4. Draw asci-like table
  */

/* Sample input for mutateNotesToActiveKey()
  [
    {activeNoteLength: 16, pitch: {A:0}, closestBeatX: 40},  // quaver
    {activeNoteLength: 16, pitch: {B:2}, closestBeatX: 200}, // quaver
    {activeNoteLength: 16, pitch: {F:0}, closestBeatX: 360}, // quaver
    {activeNoteLength: 8,  pitch: {G:1}, closestBeatX: 520}, // semi-quaver
    {activeNoteLength: 8,  pitch: {D:1}, closestBeatX: 600}, // semi-quaver
  ]
*/

export const mutateNotesToActiveKey = (notesArr, activeKey) => {
  const mapper = circleOfFifths[activeKey];

  return notesArr.reduce((acc, curr) => {
      const { accidentalOverride, pitch } = curr;
      const idxToSearchMapper = dicMapping[Object.keys(pitch)];
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

/* Sample input for assignTabValues()
  [
  {
    "activeNoteLength": 16,
    "pitch": {
      "A": 0
    },
    "closestBeatX": 50
  },
  {
    "activeNoteLength": 16,
    "pitch": {
      "B": 2
    },
    "closestBeatX": 250
  },
  {
    "activeNoteLength": 16,
    "pitch": {
      "F#": 0
    },
    "closestBeatX": 450
  },
  {
    "activeNoteLength": 8,
    "pitch": {
      "G#": 1
    },
    "closestBeatX": 650
  },
  {
    "activeNoteLength": 8,
    "pitch": {
      "D": 1
    },
    "closestBeatX": 750
  }
]
*/


export const assignTabValues = (mutatedNotesArr) => {
  return mutatedNotesArr.reduce((acc, curr) => {
    const tabPosition = positions[Object.keys(curr.pitch)][Object.values(curr.pitch)];
    acc.push({...curr,
      tabPosition,
    });
    return acc;
  }, []);
};


/* Sample input for groupByPositionAndTrim()
  [
    {"activeNoteLength": 16, "pitch": {"A": 0},"closestBeatX": 50, "tabPositions": [
      {
        "string": 1,
        "fret": 5
      },
      {
        "string": 2,
        "fret": 0
      }
    ]
  },
  {"activeNoteLength": 16,"pitch": {"B": 2},"closestBeatX": 250,"tabPositions": [
      {
        "string": 3,
        "fret": 21
      },
      {
        "string": 4,
        "fret": 16
      },
      {
        "string": 5,
        "fret": 12
      },
      {
        "string": 6,
        "fret": 7
      }
    ]
  },
  {"activeNoteLength": 16,"pitch": {"F#": 0},"closestBeatX": 450,"tabPositions": [
      {
        "string": 1,
        "fret": 2
      }
    ]
  },
  {"activeNoteLength": 8,"pitch": {"G#": 1},"closestBeatX": 650,"tabPositions": [
      {
        "string": 1,
        "fret": 16
      },
      {
        "string": 2,
        "fret": 11
      },
      {
        "string": 3,
        "fret": 6
      }
    ]
  },
  {"activeNoteLength": 8,"pitch": {"D": 1},"closestBeatX": 750,"tabPositions": [
      {
        "string": 2,
        "fret": 17
      },
      {
        "string": 3,
        "fret": 12
      },
      {
        "string": 4,
        "fret": 7
      },
      {
        "string": 5,
        "fret": 3
      }
    ]
  }
]
*/

export const groupByPosition = (assignTabValuesArr) => {
  return assignTabValuesArr.reduce((acc, curr) => {
    const tabPositionWithBounds = curr.tabPosition
    .sort((a, b) => a.fret - b.fret)
    .filter(pos => pos.fret > curr.lowerBoundValue && pos.fret < curr.upperBoundValue);
    acc.push({...curr, tabPosition: tabPositionWithBounds[0]});
    return acc;
  }, []);
};

// export const findAveragePosition = (assignTabValuesArr) => {
//   let total = 0;
//   let sets = 0;
//   assignTabValuesArr.forEach(notes => {
//     notes.tabPosition.forEach(pos => {
//       sets += 1;
//       total += pos.fret;
//     })
//   });
//   return {
//     total,
//     sets,
//   }
// };

/* Sample input for groupByString()

[
  {
    "activeNoteLength": 16,
    "pitch": {
      "A": 0
    },
    "closestBeatX": 40,
    "tabPositions": {
      "string": 2,
      "fret": 0
    }
  },
  {
    "activeNoteLength": 16,
    "pitch": {
      "B": 2
    },
    "closestBeatX": 200,
    "tabPositions": {
      "string": 6,
      "fret": 7
    }
  },
  {
    "activeNoteLength": 16,
    "pitch": {
      "F#": 0
    },
    "closestBeatX": 360,
    "tabPositions": {
      "string": 1,
      "fret": 2
    }
  },
  {
    "activeNoteLength": 8,
    "pitch": {
      "G#": 1
    },
    "closestBeatX": 520,
    "tabPositions": {
      "string": 3,
      "fret": 6
    }
  },
  {
    "activeNoteLength": 8,
    "pitch": {
      "D": 1
    },
    "closestBeatX": 600,
    "tabPositions": {
      "string": 5,
      "fret": 3
    }
  }
]
*/

export const groupByString = (groupByStringArr) => {
  const stringData = {
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

/* Sample input for buildAsciTable()
{
  "1": [
    {
      "activeNoteLength": 16,
      "pitch": {
        "F#": 0
      },
      "closestBeatX": 360,
      "tabPositions": {
        "string": 1,
        "fret": 2
      }
    }
  ],
  "2": [
    {
      "activeNoteLength": 16,
      "pitch": {
        "A": 0
      },
      "closestBeatX": 40,
      "tabPositions": {
        "string": 2,
        "fret": 0
      }
    }
  ],
  "3": [
    {
      "activeNoteLength": 8,
      "pitch": {
        "G#": 1
      },
      "closestBeatX": 520,
      "tabPositions": {
        "string": 3,
        "fret": 6
      }
    }
  ],
  "4": [],
  "5": [
    {
      "activeNoteLength": 8,
      "pitch": {
        "D": 1
      },
      "closestBeatX": 600,
      "tabPositions": {
        "string": 5,
        "fret": 3
      }
    }
  ],
  "6": [
    {
      "activeNoteLength": 16,
      "pitch": {
        "B": 2
      },
      "closestBeatX": 200,
      "tabPositions": {
        "string": 6,
        "fret": 7
      }
    }
  ]
}
*/

export const buildAsciTable = (groupedByStringsArr) => {
  return Object.values(groupedByStringsArr).reduce((acc, string) => {
    let stringOutput = '';
    for (let i = 1; i < 65; i+=1) {
      const cord = i*10;
      if(string.length === 0) {
        stringOutput += '-';
      } else {
        const item = string.find(note => note.closestBeatX === cord);
        if (item) {
          stringOutput += item.tabPosition.fret;
        } else {
          stringOutput += '-';
        }
      }
    }
    acc.push(stringOutput);
    return acc;
  }, []).reverse();
};