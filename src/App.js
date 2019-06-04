import './App.css';

import React from 'react';
import symbols from './utils/symbols';

const canvasHeight = 440;
const canvasWidth = 800;
const barWidthPadding = canvasWidth / 16;
const tolerance = 5;
const baseNoteSize = 18;

let staves = {
  map: [
    {x0:0,y0:0,x1:800,y1:0, ledger: [-5,-3, 1]},
    {x0:0,y0:20,x1:800,y1:20, ledger: [-4,-2, 0]},
    {x0:0,y0:40,x1:800,y1:40, ledger: [-3,-1]},
    {x0:0,y0:60,x1:800,y1:60, ledger: [-2,0]},
    {x0:0,y0:80,x1:800,y1:80, ledger: [-1]},
    {x0:0,y0:100,x1:800,y1:100, ledger: [0]},
    {x0:0,y0:120,x1:800,y1:120},
    {x0:0,y0:140,x1:800,y1:140, draw: true},
    {x0:0,y0:160,x1:800,y1:160},
    {x0:0,y0:180,x1:800,y1:180, draw: true},
    {x0:0,y0:200,x1:800,y1:200},
    {x0:0,y0:220,x1:800,y1:220, draw: true},
    {x0:0,y0:240,x1:800,y1:240},
    {x0:0,y0:260,x1:800,y1:260, draw: true},
    {x0:0,y0:280,x1:800,y1:280},
    {x0:0,y0:300,x1:800,y1:300, draw: true},
    {x0:0,y0:320,x1:800,y1:320},
    {x0:0,y0:340,x1:800,y1:340, ledger: [0]},
    {x0:0,y0:360,x1:800,y1:360, ledger: [1]},
    {x0:0,y0:380,x1:800,y1:380, ledger: [2,0]},
    {x0:0,y0:400,x1:800,y1:400, ledger: [3,1]},
    {x0:0,y0:420,x1:800,y1:420, ledger: [4,2,0]},
    {x0:0,y0:440,x1:800,y1:440, ledger: [5,3,1]},
  ],
  snapTolerance: 10,
};

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
    };
    this.canvasRef = React.createRef();
    this.linepointNearestMouse = this.linepointNearestMouse.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.saveNote = this.saveNote.bind(this);

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

  readyCursorPointer(duration) {
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
      if(denomination <= 2) {
        ctx.stroke();
      } else {
        ctx.closePath();
        ctx.fill();
      }
      ctx.closePath();
      
      // stem
      if(denomination > 1) {
        ctx.beginPath();
        ctx.moveTo((note.closestBeatX + 6) + note.baseNoteSize, note.lineY);
        ctx.lineTo((note.closestBeatX + 6) + note.baseNoteSize, note.lineY - (note.baseNoteSize * 6));
        ctx.stroke();
        ctx.closePath();
      }

      // fill or not to fill ellipse

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

  wipe() {
    const ctx = this.canvasRef.current.getContext('2d');
    ctx.clearRect(0,0,canvasWidth,canvasHeight);
  }

  restore() {
    const {activeNoteLength} = this.state;
    const ctx = this.canvasRef.current.getContext('2d');
    if(activeNoteLength <= 2) {
      ctx.stroke();
    } else {
      ctx.closePath();
      ctx.fill();
    }
  }

  saveNote() {
    // const ctx = this.canvasRef.current.getContext('2d');
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
        // if save active pop this into array +1 activeBeatIdx?
        // if((savedNotesArr[activeBeatIdx].closestBeatX !== ctxCords.closestBeatX) && (savedNotesArr[activeBeatIdx].lineY !== ctxCords.lineY)) {
        //   console.log('1.0 savedNotesArr[activeBeatIdx].lineY', savedNotesArr[activeBeatIdx].lineY);
        //   console.log('1.1 ctxCords.lineY', ctxCords.lineY);
        //   console.log('2.0 savedNotesArr[activeBeatIdx].closestBeatX', savedNotesArr[activeBeatIdx].closestBeatX);
        //   console.log('2.1 ctxCords.closestBeatX', ctxCords.closestBeatX);
          this.setState(prevState => ({
            savedNotesArr: [...prevState.savedNotesArr, ctxCords],
            activeBeatIdx: this.state.activeBeatIdx + 1,
            saveActive: false,
          }));
        //}
      }
    }
  }



  render() {
    // const returnBtns = () => {
    //   let counter = this.state.maxAmountNoteValue;
    //   let items = [];
    //   while(counter % 2 === 0) {
    //     items.push(
    //       <div style={{
    //         alignSelf: 'flex-start',
    //         border: '1px solid red',
    //         padding: '0.5rem',
    //         cursor: 'pointer',
    //         margin: '0.25rem',
    //       }} onClick={() => this.readyCursorPointer(64)}>Whole</div>
    //     );
    //     counter = counter / 2;
    //   }
    // }

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
              <div style={{
                alignSelf: 'flex-start',
                border: '1px solid red',
                padding: '0.5rem',
                cursor: 'pointer',
                margin: '0.25rem',
              }} onClick={() => this.readyCursorPointer(64)}>Whole</div>
              <div style={{
                alignSelf: 'flex-start',
                border: '1px solid red',
                padding: '0.5rem',
                cursor: 'pointer',
                margin: '0.25rem',
              }} onClick={() => this.readyCursorPointer(32)}>Half</div>
              <div style={{
                alignSelf: 'flex-start',
                border: '1px solid red',
                padding: '0.5rem',
                cursor: 'pointer',
                margin: '0.25rem',
              }} onClick={() => this.readyCursorPointer(16)}>Quarter</div>
              <div style={{
                alignSelf: 'flex-start',
                border: '1px solid red',
                padding: '0.5rem',
                cursor: 'pointer',
                margin: '0.25rem',
              }} onClick={() => this.readyCursorPointer(8)}>Eighth</div>
              <div style={{
                alignSelf: 'flex-start',
                border: '1px solid red',
                padding: '0.5rem',
                cursor: 'pointer',
                margin: '0.25rem',
              }} onClick={() => this.readyCursorPointer(4)}>Sixteenth</div>
              <div style={{
                alignSelf: 'flex-start',
                border: '1px solid red',
                padding: '0.5rem',
                cursor: 'pointer',
                margin: '0.25rem',
              }} onClick={() => this.readyCursorPointer(2)}>Thirty Second</div>
              <div style={{
                alignSelf: 'flex-start',
                border: '1px solid red',
                padding: '0.5rem',
                cursor: 'pointer',
                margin: '0.25rem',
              }} onClick={() => this.readyCursorPointer(1)}>Sixty Fourth</div>
              {/* <div style={{
                alignSelf: 'flex-start',
                border: '1px solid red',
                padding: '0.5rem',
                cursor: 'pointer',
                margin: '0.25rem',
              }} onClick={() => this.wipe()}>Wipe</div>
              <div style={{
                alignSelf: 'flex-start',
                border: '1px solid red',
                padding: '0.5rem',
                cursor: 'pointer',
                margin: '0.25rem',
              }} onClick={() => this.restore()}>Restore</div> */}
          </div>
          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
        </header>
      </div>
    );
  }
}

export default App;
