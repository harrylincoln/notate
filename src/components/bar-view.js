import React from 'react';
import PropTypes from 'prop-types';
import ReactGA from 'react-ga';
import { toast } from 'react-toastify';
import { staves, 
  mutateNotesToActiveKey, 
  assignTabValues, 
  groupByPosition, 
  groupByString,
  buildAsciTable,
} from '../utils/notation-rules';

import {
  writeToUserData
} from '../utils/user-data';

import { drawNotes } from '../utils/canvas';

const canvasHeight = 440;
const canvasWidth = 640;
const barWidthPadding = canvasWidth / 16;
const baseNoteSize = 18;

export default class BarView extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      activeBeatIdx: 0, // to plot next
      savedNotesArr: [],
      activeNoteLength: 16, // notes allowed per bar (default: quaver/quarter note)
      maxAmountNoteValue: 64, // hemidemisemiquaver
      ifSavedNotes: false,
      saveActive: false,
      lowerBoundValue: 0,
      upperBoundValue: 12,
      accidentalOverride: false,
      shadowUserData: {},
      mergedBars: null,
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

  UNSAFE_componentWillMount() { // eslint-disable-line
    const { userData, updateUserData } = this.props;
    updateUserData({appStep: 1});

    if(userData.savedNotesArr) {
        this.setState({savedNotesArr: userData.savedNotesArr})
    }

    userData.activeBarNumber ? 
    this.updateBarNumber(userData.activeBarNumber) 
    : this.updateBarNumber();

  }

  componentDidMount() {
    ReactGA.initialize('UA-146065324-1');
    ReactGA.pageview('/bar-view');
    ReactGA.event({
      category: 'Usage',
      action: 'Bar view - started'
    });

    
    this.reCalcBeatLineCords();
    this.draw(); // init
  }

  componentDidUpdate(prevProps, prevState) {
    const {activeNoteLength} = this.state;

    if(prevState.activeNoteLength !== activeNoteLength) this.reCalcBeatLineCords();
  }

  setNoteValue(duration) {
    // set state of the note length and recalc staves
    this.setState({activeNoteLength: duration});
  }

  reCalcBeatLineCords() {
    const {maxAmountNoteValue, activeNoteLength} = this.state;
    const denomination = (maxAmountNoteValue / activeNoteLength);
    this.beatLineCords = new Array(denomination).fill(null).map( (x,i) => {
      if(i === 0) return barWidthPadding;
      return (canvasWidth / denomination) * i + barWidthPadding;
    });
  }

  updateBarNumber(op) {
    const {shadowUserData} = this.state;
    const {updateUserData} = this.props;
    if(typeof op === 'number') {
      this.setState({
        shadowUserData: {
          ...shadowUserData,
          activeBarNumber: op
        }
      }, () => {
        updateUserData(shadowUserData);
        this.draw();
      });
    } else {
      switch (op) {
        case '+':
          this.setState({
            shadowUserData: {
              ...shadowUserData,
              activeBarNumber: shadowUserData.activeBarNumber + 1
            }
          }, () => {
            updateUserData(shadowUserData);
            this.draw();
          });
          break;
        case '-':
            this.setState({
              shadowUserData: {
                ...shadowUserData,
                activeBarNumber: shadowUserData.activeBarNumber - 1
              }
            }, () => {
              updateUserData(shadowUserData);
              this.draw();
            });
            break;
      
        default: // first time
          this.setState({shadowUserData: {
            activeBarNumber: 1
          }});
          updateUserData({activeBarNumber: 1})
          break;
      }
    }
  }

  linepointNearestMouse(stave, x, y) {
    const lerp = (a,b,z) => (a+z*(b-a));
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
          this.setState(prevState => ({
              savedNotesArr: {
                ...prevState.savedNotesArr,
                [shadowUserData.activeBarNumber]: [...prevState.savedNotesArr[shadowUserData.activeBarNumber] || [], ctxCords]
              },
              activeBeatIdx: activeBeatIdx + 1,
              saveActive: false
          }));
      }
    }
  }
  
  buildTable() {
    ReactGA.event({
      category: 'Usage',
      action: 'Bar view - finished'
    });
    const {savedNotesArr, upperBoundValue, lowerBoundValue} = this.state;
    const {updateUserData, userKey} = this.props;

    updateUserData({savedNotesArr});

    const mergedBars = Object.keys(savedNotesArr).reduce((mergedAcc, barNum) => {

      const schema = savedNotesArr[barNum].reduce((acc, curr) => {
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
        const mutatedToKey = mutateNotesToActiveKey(schema, userKey);
        const tabValuesAssigned = assignTabValues(mutatedToKey);
        const groupByPosistion = groupByPosition(tabValuesAssigned);
        const groupByStringArr = groupByString(groupByPosistion);
      
        const buildMarkupTable = buildAsciTable(groupByStringArr);
        mergedAcc.push(buildMarkupTable);

        } catch(e) {
          toast.error(e.message);
          ReactGA.event({
            category: 'Error',
            action: e.message
          });
        }
        return mergedAcc;
      }, []);
      this.setState({mergedBars});
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
    const { updateUserData } = this.props;
    this.updateBarNumber(direction);
    updateUserData({savedNotesArr});
  }

  RenderNoteToggles() {
    const noteDenoms = [64, 32, 16, 8, 4, 2, 1];
    const { maxAmountNoteValue, activeNoteLength } = this.state;
    return noteDenoms.map((item) => (
      <button
        className="btn btn-secondary"
        type="button"
        key={item}
        style={{
        border: `1px solid ${activeNoteLength === item ? 'red' : 'white'}`,
      }}
        onClick={() => this.setNoteValue(maxAmountNoteValue / (maxAmountNoteValue / item))}
      >
        {`1/${maxAmountNoteValue / item}`}
      </button>
    ))
  }

  clearBar() {
    const {shadowUserData} = this.state;
    const { updateUserData } = this.props;
    this.setState(prevState => ({
      savedNotesArr: {
        ...prevState.savedNotesArr,
        [shadowUserData.activeBarNumber]: []
      },
    }), () => {
      const {savedNotesArr} = this.state;
      updateUserData({savedNotesArr});
      this.draw();
    });
  }

  reset() {
    this.setState({
      savedNotesArr: [],
      shadowUserData: {
        activeBarNumber: 1
      }
    }, () => {
      writeToUserData({appStep: 0, userKey: 'C'});
      window.location.reload();

    })
  }

  render() {

    const {  
      lowerBoundValue, 
      upperBoundValue,
      accidentalOverride,
      shadowUserData,
      mergedBars,
    } = this.state;

      return (
        <>
          <section className="App-content">
            <div className="canvas-container">
              <button
                className="btn btn-secondary"
                type="button"
                disabled={shadowUserData.activeBarNumber < 2}
                onClick={() => this.saveBarAndNavigate('-')}
              >
Previous
              </button>
              <canvas 
                width={canvasWidth} 
                height={canvasHeight} 
                ref={this.canvasRef} 
                onMouseMove={this.handleMouseMove.bind(this)}
                onMouseLeave={this.draw.bind(this)}
                onClick={this.saveNote.bind(this)}
              />
              <button className="btn btn-primary" type="button" onClick={() => this.saveBarAndNavigate('+')}>Next</button>
            </div>
            <div className="toggle-controls-container input-group w-auto">
              <div className="input-group-prepend">
                <span className="input-group-text">Fret # min:</span>
              </div>
              <input onChange={this.updateLowerBound} value={lowerBoundValue} placeholder='lower bound' />
              <div className="input-group-prepend">
                <span className="input-group-text">Fret # max:</span>
              </div>
              <input onChange={this.updateUpperBound} value={upperBoundValue} placeholder='upper bound' />
            </div>
            <div className="toggle-controls-container">
              <p>Notes:</p>
              {this.RenderNoteToggles()}
              <button
                className="btn btn-secondary"
                type="button"
                style={{
                border: `1px solid ${accidentalOverride === 'natural'? 'red' : 'white'}`,
              }}
                onClick={() => this.assignAccidental('natural')}
              >
&#9838;
              </button>
              <button
                className="btn btn-secondary"
                type="button"
                style={{
                border: `1px solid ${accidentalOverride === 'flat'? 'red' : 'white'}`,
              }}
                onClick={() => this.assignAccidental('flat')}
              >
&#9837;
              </button>
              <button
                className="btn btn-secondary"
                type="button"
                style={{
                border: `1px solid ${accidentalOverride === 'sharp' ? 'red' : 'white'}`,
              }}
                onClick={() => this.assignAccidental('sharp')}
              >
#
              </button>
            </div>
            <div className="toggle-controls-container">
              <button className="btn btn-warning" type="button" onClick={() => this.clearBar()}>Clear bar</button>
              <button className="btn btn-danger" type="button" onClick={() => this.reset()}>Reset</button>
              <button className="btn btn-success" type="button" onClick={() => this.buildTable()}>Generate tab below</button>
            </div>
          </section>
          {mergedBars && (
            <section className="App-content code">
              {mergedBars.map((bars) => (
                <>
                  {bars.map((bar) => (
                    <>
                      <span key={bar}>
                        {bar}
                      </span>
                    </>
                ))}
                  <br />
                </>
            ))}
            </section>
          )}
        </>
      );
    }
  };

  BarView.propTypes = {
    userData: PropTypes.shape({
      savedNotesArr: [],
      activeBarNumber: PropTypes.number.isRequired
    }).isRequired,
    updateUserData: PropTypes.func.isRequired,
    userKey: PropTypes.string.isRequired
  }