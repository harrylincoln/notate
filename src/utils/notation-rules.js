export let staves = {
    map: [
      {x0:0,y0:0,x1:800,y1:0, ledger: [-5,-3, 1], note: {F: 3}},
      {x0:0,y0:20,x1:800,y1:20, ledger: [-4,-2, 0], note: {E: 3}},
      {x0:0,y0:40,x1:800,y1:40, ledger: [-3,-1], note: {D: 3}},
      {x0:0,y0:60,x1:800,y1:60, ledger: [-2,0], note: {C: 3}},
      {x0:0,y0:80,x1:800,y1:80, ledger: [-1], note: {B: 2}},
      {x0:0,y0:100,x1:800,y1:100, ledger: [0], note: {A: 2}},
      {x0:0,y0:120,x1:800,y1:120, note: {G: 2}},
      {x0:0,y0:140,x1:800,y1:140, draw: true, note: {F: 2}},
      {x0:0,y0:160,x1:800,y1:160, note: {E: 2}},
      {x0:0,y0:180,x1:800,y1:180, draw: true, note: {D: 2}},
      {x0:0,y0:200,x1:800,y1:200, note: {C: 2}},
      {x0:0,y0:220,x1:800,y1:220, draw: true, note: {B: 1}},
      {x0:0,y0:240,x1:800,y1:240, note: {A: 1}},
      {x0:0,y0:260,x1:800,y1:260, draw: true, note: {G: 1}},
      {x0:0,y0:280,x1:800,y1:280, note: {F: 1}},
      {x0:0,y0:300,x1:800,y1:300, draw: true, note: {E: 1}},
      {x0:0,y0:320,x1:800,y1:320, note: {D: 1}},
      {x0:0,y0:340,x1:800,y1:340, ledger: [0], note: {C: 1}},
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
    0 = none,
    1 = #,
    2 = b,
    https://www.musicnotes.com/now/wp-content/uploads/Circle-of-Fifths-Simple-1024x1024.png
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
    'Eb':    [2,2,0,0,2,0,0],
    'Bb':    [0,2,0,0,2,0,0],
    'F':     [0,2,0,0,0,0,0],
  };

  const dicMapping = {A:0,B:1,C:2,D:3,E:4,F:5,G:6}; 

  // [{activeNoteLength: 16, pitch: {A:0}, closestBeatX: 250}]

  export const mutateNotesToActiveKey = (notesArr, activeKey) => {
    const mapper = circleOfFifths[activeKey];
    // const notesTest = ['F', 'F', 'G', 'A', 'B', 'C'];

    return notesArr.reduce((acc, curr) => {
        const idxToSearchMapper = dicMapping[curr];
        switch (mapper[idxToSearchMapper]) {
            case 1:
                acc.push(`${curr}#`)
                break;
            case 2:
                acc.push(`${curr}b`)
                break;
            default:
                acc.push(curr);
                break;
        }
        return acc;
    }, []);
  };