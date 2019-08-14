import React from 'react';
import { staves, 
  mutateNotesToActiveKey, 
  assignTabValues, 
  groupByPosition, 
  groupByString,
  buildAsciTable,
} from '../utils/notation-rules';

import { drawNotes } from '../utils/canvas';

const canvasHeight = 440;
const canvasWidth = 640;
const barWidthPadding = canvasWidth / 16;
const baseNoteSize = 18;

class BarView extends React.Component {

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
      lowerBoundValue: 0,
      upperBoundValue: 12,
      accidentalOverride: false,
      shadowUserData: {},
    };
    this.canvasRef = React.createRef();
    this.linepointNearestMouse = this.linepointNearestMouse.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.saveNote = this.saveNote.bind(this);
    this.buildTable = this.buildTable.bind(this);
    this.updateLowerBound = this.updateLowerBound.bind(this);
    this.updateUpperBound = this.updateUpperBound.bind(this);
    this.assignAccidental = this.assignAccidental.bind(this);
    this.updateBarNumber = this.updateBarNumber.bind(this);
    this.beatLineCords = null;
  }

  updateBarNumber(op) {
    if(typeof op === 'number') {
      this.setState({
        shadowUserData: {
          ...this.state.shadowUserData,
          activeBarNumber: op
        }
      }, () => {
        this.props.updateUserData(this.state.shadowUserData);
        this.draw();
      });
    } else {
      switch (op) {
        case '+':
          this.setState({
            shadowUserData: {
              ...this.state.shadowUserData,
              activeBarNumber: this.state.shadowUserData.activeBarNumber + 1
            }
          }, () => {
            this.props.updateUserData(this.state.shadowUserData);
            this.draw();
          });
          break;
        case '-':
            this.setState({
              shadowUserData: {
                ...this.state.shadowUserData,
                activeBarNumber: this.state.shadowUserData.activeBarNumber - 1
              }
            }, () => {
              this.props.updateUserData(this.state.shadowUserData);
              this.draw();
            });
            break;
      
        default: // first time
          this.setState({shadowUserData: {
            activeBarNumber: 1
          }});
          this.props.updateUserData({activeBarNumber: 1})
          break;
      }
    }
  }

  componentWillMount() {
      const { userData } = this.props;
      this.props.updateUserData({appStep: 1});

      if(userData.savedNotesArr) {
          this.setState({savedNotesArr: userData.savedNotesArr})
      }

      userData.activeBarNumber ? this.updateBarNumber(userData.activeBarNumber) : this.updateBarNumber();

  }

  componentDidMount() {
    // update
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

  async draw(mouseX, mouseY, closestBeatX, lineY, closestStave){
    const { activeNoteLength, ifSavedNotes, savedNotesArr, accidentalOverride, maxAmountNoteValue, shadowUserData } = this.state;
    const ctx = this.canvasRef.current.getContext('2d');
    // default
    ctx.clearRect(0,0,canvasWidth,canvasHeight);
    await this.drawStaves();

    // draw saved
    if(ifSavedNotes || savedNotesArr) {
      await drawNotes(savedNotesArr[shadowUserData.activeBarNumber] || [], ctx, maxAmountNoteValue);
    }
    if(mouseX && closestBeatX){
        
        // non-saved hover note
        const activeNoteInfo = {
          closestBeatX,
          lineY,
          baseNoteSize,
          activeNoteLength,
          closestStave,
          accidentalOverride
        };

        await this.saveActiveNoteToState(activeNoteInfo);
        await drawNotes([activeNoteInfo], ctx, maxAmountNoteValue);
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
    const {activeBeatIdx, savedNotesArr, saveActive, shadowUserData} = this.state;

    if(saveActive) {
      if(Object.keys(savedNotesArr).length === 0) { // first
          this.setState(prevState => ({
            savedNotesArr: {
             1: [...prevState.savedNotesArr, ctxCords]
            },
            saveActive: false,
          }))
      } 
      else {
          this.setState(prevState => {
            return {
              savedNotesArr: {
                ...prevState.savedNotesArr,
                [shadowUserData.activeBarNumber]: [...prevState.savedNotesArr[shadowUserData.activeBarNumber] || [], ctxCords]
              },
              activeBeatIdx: activeBeatIdx + 1,
              saveActive: false
            }
          });
      }
    }
  }
  
  buildTable() {
    const {savedNotesArr, upperBoundValue, lowerBoundValue, shadowUserData} = this.state;
    
    // TODO: loop here
    const schema = savedNotesArr[shadowUserData.activeBarNumber].reduce((acc, curr) => {
      acc.push({
        accidentalOverride: curr.accidentalOverride,
        activeNoteLength: curr.activeNoteLength,
        pitch: curr.closestStave.note,
        closestBeatX: curr.closestBeatX,
        upperBoundValue,
        lowerBoundValue
      });
      return acc;
    }, []);

    try {
      const mutatedToKey = mutateNotesToActiveKey(schema, this.props.userKey);
      console.log('1. mutatedToKey', mutatedToKey);

      const tabValuesAssigned = assignTabValues(mutatedToKey);
      console.log('2. tabValuesAssigned', tabValuesAssigned);

      const groupByPosistion = groupByPosition(tabValuesAssigned);
      console.log('3. groupByPosistion', groupByPosistion);

      const groupByStringArr = groupByString(groupByPosistion);
      console.log('4. groupByString', groupByStringArr);
      
      const buildMarkupTable = buildAsciTable(groupByStringArr);
      console.log('5. buildMarkupTable', buildMarkupTable);
      } catch(e) {
        console.log('building table error', e);
      }
  }

  updateLowerBound(e) {
    this.setState({lowerBoundValue: e.target.value});
  }

  updateUpperBound(e) {
    this.setState({upperBoundValue: e.target.value});
  }

  assignAccidental(type) {
    const { accidentalOverride } = this.state;
    this.setState({accidentalOverride: accidentalOverride === type ? false : type});
  }

  saveBarAndNavigate(direction) {
    const { savedNotesArr } = this.state;
    this.updateBarNumber(direction);
    this.props.updateUserData({savedNotesArr});
  }

  RenderNoteToggles() {
    const noteDenoms = [64, 32, 16, 4, 2, 1];
    const { maxAmountNoteValue, activeNoteLength } = this.state;
    return noteDenoms.map((item, idx) => (
      <button
      key={idx}
      style={{
        border: `1px solid ${activeNoteLength === item ? 'red' : 'white'}`,
      }}
      onClick={() => this.setNoteValue(maxAmountNoteValue / (maxAmountNoteValue / item))}>{`1/${maxAmountNoteValue / item}`}</button>
    ))
  }

  render() {

    const {  
      lowerBoundValue, 
      upperBoundValue,
      accidentalOverride
    } = this.state;

      return (
          <section className="App-content">
            <canvas 
            width={canvasWidth} 
            height={canvasHeight} 
            ref={this.canvasRef} 
            onMouseMove={this.handleMouseMove.bind(this)}
            onClick={this.saveNote.bind(this)}
            ></canvas>
            <div className="toggle-controls-container">
              <label htmlFor="lower">Lower bound:</label>
              <input id="lower" onChange={this.updateLowerBound} value={lowerBoundValue} placeholder='lower bound' />
              <label htmlFor="upper">Upper bound:</label>
              <input id="upper" onChange={this.updateUpperBound} value={upperBoundValue} placeholder='upper bound' />
            </div>
            <div className="toggle-controls-container">
              <p>Notes:</p>
              {this.RenderNoteToggles()}
            </div>
            <div className="toggle-controls-container">
              <p>Accidentals (avoid plotting doubles - know your key!):</p>
              <button style={{
                border: `1px solid ${accidentalOverride === 'natural'? 'red' : 'white'}`,
              }} onClick={() => this.assignAccidental('natural')}>&#9838;</button>
              <button style={{
                border: `1px solid ${accidentalOverride === 'flat'? 'red' : 'white'}`,
              }} onClick={() => this.assignAccidental('flat')}>&#9837;</button>
              <button style={{
                border: `1px solid ${accidentalOverride === 'sharp' ? 'red' : 'white'}`,
              }} onClick={() => this.assignAccidental('sharp')}>#</button>
              <button onClick={() => this.saveBarAndNavigate('-')}>Previous</button>
              <button onClick={() => this.saveBarAndNavigate('+')}>Next</button>
              <button onClick={() => this.buildTable()}>Print</button>
            </div>
            </section>
      );
    }
  };

export default BarView;
