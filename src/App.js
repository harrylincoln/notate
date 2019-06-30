import './App.css';

import React from 'react';
import { staves, 
  mutateNotesToActiveKey, 
  assignTabValues, 
  groupByPosition, 
  groupByString,
  buildAsciTable,
} from './utils/notation-rules';

const canvasHeight = 440;
const canvasWidth = 640;
const barWidthPadding = canvasWidth / 16;
const tolerance = 5;
const baseNoteSize = 18;

class App extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      activeBeatIdx: 0, // to plot next
      savedNotesArr: [],
      activeNoteLength: 16, // notes allowed per bar (default: quaver/quarter note)
      maxAmountNoteValue: 64, // hemidemisemiquaver
      ifSavedNotes: false,
      saveActive: false,
      isTripletMode: false,
      isNotesToggle: true,
    };
    this.canvasRef = React.createRef();
    this.linepointNearestMouse = this.linepointNearestMouse.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.saveNote = this.saveNote.bind(this);
    this.buildTable = this.buildTable.bind(this);

    this.beatLineCords = null;

  }

  componentDidMount() {
    this.reCalcBeatLineCords();
    this.draw(); // init
  }

  componentDidUpdate(prevProps, prevState) {
    if(prevState.activeNoteLength !== this.state.activeNoteLength) this.reCalcBeatLineCords();
  }

  reCalcBeatLineCords() {
    const denomination = (this.state.maxAmountNoteValue / this.state.activeNoteLength);
    this.beatLineCords = new Array(denomination).fill(null).map( (x,i) => {
      if(i === 0) return barWidthPadding;
      return (canvasWidth / denomination) * i + barWidthPadding;
    });
  }

  setNoteValue(duration) {
    // set state of the note length and recalc staves
    this.setState({activeNoteLength: duration});
  }

  linepointNearestMouse(stave, x, y) {
    const lerp = (a,b,x) => (a+x*(b-a));
    const dx = stave.x1-stave.x0;
    const dy = stave.y1-stave.y0;
    
    const t=((x-stave.x0)*dx+(y-stave.y0)*dy)/(dx*dx+dy*dy);
    // const lineX=lerp(stave.x0, stave.x1, t);
    const lineY=lerp(stave.y0, stave.y1, t);

    return({y:lineY});
  }

  drawStaves() {
    const ctx = this.canvasRef.current.getContext('2d');
    ctx.beginPath();
    staves.map.filter(x => x.draw).forEach(stave => {
      ctx.moveTo(stave.x0,stave.y0);
      ctx.lineTo(stave.x1,stave.y1);
    });
    ctx.stroke();
  }

  drawNotes(notesArr, ctx) {
    notesArr.forEach((note) => {
      const denomination = (this.state.maxAmountNoteValue / note.activeNoteLength);
      
      // base
      ctx.beginPath();
      ctx.ellipse(note.closestBeatX, note.lineY, note.baseNoteSize, ((note.baseNoteSize / 2) * 3), Math.PI / 3, 0, 2 * Math.PI);
      if(denomination <= 2) { // fill or not, based on length
        ctx.stroke();
      } else {
        ctx.fill();
      }
      ctx.closePath();
      
      // stems & flags
      if(denomination > 1) {
        const stemScale = 6; // increase when more flags
        const stemPosX = (note.closestBeatX + stemScale) + note.baseNoteSize;
        const stemPosYStart = note.lineY;
        const stemPosYEnd = stemPosYStart - (note.baseNoteSize * stemScale);

        ctx.beginPath();
        ctx.moveTo(stemPosX, stemPosYStart);
        ctx.lineTo(stemPosX, stemPosYEnd);
        ctx.stroke();
        ctx.closePath();
      
        if(denomination >= 8) {
          // flags
          // Define the points as {x, y}

          const flagPosAndScaleX = val => ((val * stemScale) + (stemPosX - (note.baseNoteSize * 2)));
          const flagPosAndScaleY = val => ((val * stemScale) + stemPosYEnd);

          let start1 = { x: flagPosAndScaleX(6),  y: flagPosAndScaleY(1) };
          let cp1 =    { x: flagPosAndScaleX(7),  y: flagPosAndScaleY(4) };
          let cp2 =    { x: flagPosAndScaleX(8),  y: flagPosAndScaleY(5) };
          let end1 =   { x: flagPosAndScaleX(10), y: flagPosAndScaleY(6) };

          let cp3 =    { x: flagPosAndScaleX(13), y: flagPosAndScaleY(7) };
          let cp4 =    { x: flagPosAndScaleX(14), y: flagPosAndScaleY(16) };
          let end2 =   { x: flagPosAndScaleX(10), y: flagPosAndScaleY(17) };

          let cp5 =   { x: flagPosAndScaleX(16),  y: flagPosAndScaleY(3) };
          let cp6 =   { x: flagPosAndScaleX(6),   y: flagPosAndScaleY(7) };
          let end3 =  { x: flagPosAndScaleX(6),   y: flagPosAndScaleY(7) };

          // Draw stages of flag
          ctx.beginPath();
          ctx.moveTo(start1.x, start1.y);
          ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, end1.x, end1.y);
          // ctx.moveTo(end1.x, end1.y);
          ctx.bezierCurveTo(cp3.x, cp3.y, cp4.x, cp4.y, end2.x, end2.y);
          // ctx.moveTo(end2.x, end2.y);
          ctx.bezierCurveTo(cp5.x, cp5.y, cp6.x, cp6.y, end3.x, end3.y);
          // ctx.moveTo(end3.x, end3.y);
          ctx.lineTo(end3.x, start1.y);
          ctx.fill(); 
        }
      }

      // draw ledger(s)
      if(note.closestStave.ledger) {
        note.closestStave.ledger.forEach(val => {
          if(val === 0) {
            ctx.moveTo((note.closestBeatX - (note.baseNoteSize * 2)), note.closestStave.y0);
            ctx.lineTo((note.closestBeatX + (note.baseNoteSize * 2)), note.closestStave.y0);
          } else{
            ctx.moveTo((note.closestBeatX - (note.baseNoteSize * 2)), (note.closestStave.y0 - (note.baseNoteSize * val)));
            ctx.lineTo((note.closestBeatX + (note.baseNoteSize * 2)), (note.closestStave.y0 - (note.baseNoteSize * val)));
          }
          ctx.stroke();
        });
      }
    });
  }

  async draw(mouseX, mouseY, closestBeatX, lineY, closestStave){
    const { activeNoteLength, ifSavedNotes, savedNotesArr } = this.state;
    const ctx = this.canvasRef.current.getContext('2d');

    // default
    ctx.clearRect(0,0,canvasWidth,canvasHeight);
    await this.drawStaves();
    

    if(mouseX && closestBeatX){

        // draw saved
        if(ifSavedNotes) {
          await this.drawNotes(savedNotesArr, ctx);
        }
        
        // non-saved hover note
        const activeNoteInfo = {
          closestBeatX,
          lineY,
          baseNoteSize,
          activeNoteLength,
          closestStave,
        };

        await this.saveActiveNoteToState(activeNoteInfo);
        await this.drawNotes([activeNoteInfo], ctx);
    }
  }

  handleMouseMove(e) {
    e.preventDefault();
    e.stopPropagation();
    const {offsetX, offsetY} = e.nativeEvent;
    // const { activeBeatIdx } = this.state;
    
    // which is the closest stave to the mouse hover
    const closestStave = staves.map.reduce((prev, curr) => (
      Math.abs(offsetY - (curr.y0 - staves.snapTolerance)) < Math.abs(offsetY - (prev.y0 - staves.snapTolerance)) ? curr : prev
    ));

    // which is the closest beat in the bar to the mouse hover
    const xTolerence = (offsetX - 25); // this will have to be calc'd by total number of notes allowed in bar in future to save on space between notes
    // let localSplicedCords = [...this.beatLineCords];
    // if(activeBeatIdx > 0) localSplicedCords.splice(1, activeBeatIdx);
    const closestBeatX = this.beatLineCords.reduce((prev, curr) => (
      Math.abs(curr - xTolerence) < Math.abs(prev - xTolerence) ? curr : prev
    ));

    const linepoint = this.linepointNearestMouse(closestStave, offsetX, offsetY);

    // const dx=offsetX-linepoint.x;
    // const dy=offsetY-linepoint.y;

    this.draw(offsetX,offsetY,closestBeatX,linepoint.y, closestStave);
  }

  saveNote() {
    this.setState({ifSavedNotes: true, saveActive: true});
  }
  
  saveActiveNoteToState(ctxCords) {
    const {activeBeatIdx, savedNotesArr, saveActive} = this.state;
    if(saveActive) {
      if(!savedNotesArr.length) { // first
          this.setState(prevState => ({
            savedNotesArr: [...prevState.savedNotesArr, ctxCords],
            saveActive: false,
          }))
      } 
      else {
          this.setState(prevState => ({
            savedNotesArr: [...prevState.savedNotesArr, ctxCords],
            activeBeatIdx: activeBeatIdx + 1,
            saveActive: false,
          }));
      }
    }
  }

  setTriplet() {
    console.log('setTriplet!');
    this.setState({isTripletMode: true});
  }

  toggleNotesRests() {
    this.setState(prevState => ({
      isNotesToggle: !prevState.isNotesToggle
    }));
  }
  
  buildTable() {
    const {savedNotesArr} = this.state;
    const schema = savedNotesArr.reduce((acc, curr) => {
      acc.push({
        activeNoteLength: curr.activeNoteLength,
        pitch: curr.closestStave.note,
        closestBeatX: curr.closestBeatX
      });
      return acc;
    }, []);
    const mutatedToKeyOfA = mutateNotesToActiveKey(schema, 'C');

    console.log('1. mutatedToKeyOfA', mutatedToKeyOfA);

    const tabValuesAssigned = assignTabValues(mutatedToKeyOfA);

    console.log('2. tabValuesAssigned', tabValuesAssigned);

    const groupByPosistion = groupByPosition(tabValuesAssigned);

    console.log('3. groupByPosistion', groupByPosistion);

    const groupByStringArr = groupByString(groupByPosistion);

    console.log('4. groupByString', groupByStringArr);

    const buildMarkupTable = buildAsciTable(groupByStringArr);

    console.log('5. buildMarkupTable', buildMarkupTable);

  }

  render() {
    // const returnBtns = () => {
    //   let counter = this.state.maxAmountNoteValue;
    //   let items = [];
    //   while(counter % 2 === 0) {
    //     items.push(
    //       <div style={{
    //         alignSelf: 'center',
    //         border: '1px solid red',
    //         padding: '0.5rem',
    //         cursor: 'pointer',
    //         margin: '0.25rem',
    //       }} onClick={() => this.setNoteValue(64)}>Whole</div>
    //     );
    //     counter = counter / 2;
    //   }
    // }

    const { isNotesToggle } = this.state;

    return (
      <div className="App">
        <header className="App-header">
          <canvas 
          width={canvasWidth} 
          height={canvasHeight} 
          ref={this.canvasRef} 
          style={{backgroundColor:'white'}} 
          onMouseMove={this.handleMouseMove.bind(this)}
          onClick={this.saveNote.bind(this)}
          ></canvas>
          <div style={{
            marginTop: '1rem',
            display: 'flex',
            width: '50%',
            flexDirection: 'row',
            flexWrap: 'wrap',
            backgroundColor: 'grey',
            padding: '1rem',
            color: 'black',
          }}>
              <p style={{
                alignSelf: 'center',
                color: 'white',
                cursor:'pointer',
                }}
                onClick={() => this.toggleNotesRests()}
            
            >{isNotesToggle ? 'Notes: ' : 'Rests: '}</p>
              <div style={{
                alignSelf: 'center',
                border: '1px solid red',
                padding: '0.5rem',
                cursor: 'pointer',
                margin: '0.25rem',
              }} onClick={() => this.setNoteValue(64)}>Whole</div>
              <div style={{
                alignSelf: 'center',
                border: '1px solid red',
                padding: '0.5rem',
                cursor: 'pointer',
                margin: '0.25rem',
              }} onClick={() => this.setNoteValue(32)}>Half</div>
              <div style={{
                alignSelf: 'center',
                border: '1px solid red',
                padding: '0.5rem',
                cursor: 'pointer',
                margin: '0.25rem',
              }} onClick={() => this.setNoteValue(16)}>Quarter</div>
              <div style={{
                alignSelf: 'center',
                border: '1px solid red',
                padding: '0.5rem',
                cursor: 'pointer',
                margin: '0.25rem',
              }} onClick={() => this.setNoteValue(8)}>Eighth</div>
              <div style={{
                alignSelf: 'center',
                border: '1px solid red',
                padding: '0.5rem',
                cursor: 'pointer',
                margin: '0.25rem',
              }} onClick={() => this.setNoteValue(4)}>Sixteenth</div>
              <div style={{
                alignSelf: 'center',
                border: '1px solid red',
                padding: '0.5rem',
                cursor: 'pointer',
                margin: '0.25rem',
              }} onClick={() => this.setNoteValue(2)}>Thirty Second</div>
              <div style={{
                alignSelf: 'center',
                border: '1px solid red',
                padding: '0.5rem',
                cursor: 'pointer',
                margin: '0.25rem',
              }} onClick={() => this.setNoteValue(1)}>Sixty Fourth</div>
              <div style={{
                alignSelf: 'center',
                border: '1px solid red',
                padding: '0.5rem',
                cursor: 'pointer',
                margin: '0.25rem',
              }} onClick={() => this.buildTable()}>Console.log(asci table)</div>
          </div>
          </header>
      </div>
    );
  }
}

export default App;
