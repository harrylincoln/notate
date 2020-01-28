import React, {useEffect, useState, useRef} from 'react';
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

import { drawNotes, drawStaves, linepointNearestMouse } from '../utils/canvas';

const canvasHeight = 440;
const canvasWidth = 640;
const barWidthPadding = canvasWidth / 16;
const baseNoteSize = 18;

function BarView(props) {

  const [savedNotesArr, setSavedNotesArr] = useState([]);
  const [activeNoteLength, setActiveNoteLength] = useState(16);
  const [shadowUserData, updateShadowUserData] = useState({});
  const [accidentalOverride, updateAccidentalOverride] = useState(false);
  const [ifSavedNotes, updateIfSavedNotes] = useState(false);
  const [saveActive, updateSaveActive] = useState(false);
  const [lowerBoundValue, updateLowerBoundValue] = useState(0);
  const [upperBoundValue, updateUpperBoundValue] = useState(12);
  const [mergedBars, updateMergedBars] = useState(null);
  const [beatLineCords, updateBeatLineCords] = useState(null);
  const canvasRef = useRef();
  const maxAmountNoteValue = 64;

  const reCalcBeatLineCords = () => {
    const denomination = (maxAmountNoteValue / activeNoteLength);
    const runBeatLineCalc = new Array(denomination).fill(null).map((x,i) => {
      if(i === 0) return barWidthPadding;
      return (canvasWidth / denomination) * i + barWidthPadding;
    });
    updateBeatLineCords(runBeatLineCalc);
  };

  useEffect(() => {
    reCalcBeatLineCords();
  }, [activeNoteLength]);

  const saveActiveNoteToState = (ctxCords) => {
    if(saveActive) {
      if(Object.keys(savedNotesArr).length === 0) { // first
          setSavedNotesArr({
            1: [...savedNotesArr, ctxCords]
          });
      } else {
          setSavedNotesArr({
            ...savedNotesArr,
            [shadowUserData.activeBarNumber]: [...savedNotesArr[shadowUserData.activeBarNumber] || [], ctxCords]
          })
      }
      updateSaveActive(false);
    }
  };

  const draw = async (mouseX, mouseY, closestBeatX, lineY, closestStave) => {
    const ctx = canvasRef.current.getContext('2d');
    // default
    ctx.clearRect(0,0,canvasWidth,canvasHeight);
    await drawStaves(ctx);

    // draw saved
    if(ifSavedNotes || savedNotesArr) {
      await drawNotes(savedNotesArr[shadowUserData.activeBarNumber] || [], ctx, maxAmountNoteValue);
    }
    if(mouseX && closestBeatX) {
        
        // non-saved hover note
        const activeNoteInfo = {
          closestBeatX,
          lineY,
          baseNoteSize,
          activeNoteLength,
          closestStave,
          accidentalOverride
        };

        await saveActiveNoteToState(activeNoteInfo);
        await drawNotes([activeNoteInfo], ctx, maxAmountNoteValue);
    }
  };
  
  useEffect(() => {
    draw();
  }, [shadowUserData]);

  const updateBarNumber = op => {
    const {updateUserData} = props;
      switch (op) {
        case '+':
          updateShadowUserData({...shadowUserData, activeBarNumber: shadowUserData.activeBarNumber + 1});
          updateUserData({...shadowUserData});
          
          break;
        case '-':
          updateShadowUserData({...shadowUserData, activeBarNumber: shadowUserData.activeBarNumber - 1});
          updateUserData(shadowUserData);

          break;
        default: // first time

          updateShadowUserData({...shadowUserData, activeBarNumber: 1});
          updateUserData({activeBarNumber: 1});

          break;
      }
  };

  useEffect(() => {

    const { userData, updateUserData } = props;
    updateUserData({appStep: 1});

    if(userData.savedNotesArr) {
      setSavedNotesArr(userData.savedNotesArr);
    }

    userData.activeBarNumber ? 
    updateBarNumber(userData.activeBarNumber) 
    : updateBarNumber();


    ReactGA.initialize('UA-146065324-1');
    ReactGA.pageview('/bar-view');
    ReactGA.event({
      category: 'Usage',
      action: 'Bar view - started'
    });

    
    reCalcBeatLineCords();
    draw(); // init
  }, []);

  const handleMouseMove = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const {offsetX, offsetY} = e.nativeEvent;
    
    // which is the closest stave to the mouse hover
    const closestStave = staves.map.reduce((prev, curr) => (
      Math.abs(offsetY - (curr.y0 - staves.snapTolerance)) < Math.abs(offsetY - (prev.y0 - staves.snapTolerance)) ? curr : prev
    ));

    // which is the closest beat in the bar to the mouse hover
    const xTolerence = (offsetX - 25); // this will have to be calc'd by total number of notes allowed in bar in future to save on space between notes
    // let localSplicedCords = [...this.beatLineCords];
    // if(activeBeatIdx > 0) localSplicedCords.splice(1, activeBeatIdx);
    const closestBeatX = beatLineCords.reduce((prev, curr) => (
      Math.abs(curr - xTolerence) < Math.abs(prev - xTolerence) ? curr : prev
    ));

    const linepoint = linepointNearestMouse(closestStave, offsetX, offsetY);

    draw(offsetX,offsetY,closestBeatX,linepoint.y, closestStave);
  };

  const saveNote = () => {
    updateIfSavedNotes(true);
    updateSaveActive(true);    
  }

  const buildTable = () =>  {
    ReactGA.event({
      category: 'Usage',
      action: 'Bar view - finished'
    });
    const {updateUserData, userKey} = props;

    updateUserData(savedNotesArr);

    const mergeBars = Object.keys(savedNotesArr).reduce((mergedAcc, barNum) => {

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
      updateMergedBars(mergeBars);
  };

  const updateLowerBound = (e) => {
    updateLowerBoundValue(e.target.value);
  };

  const updateUpperBound = (e) => {
    updateUpperBoundValue(e.target.value);
  };

  const assignAccidental = (type) => {
    updateAccidentalOverride(accidentalOverride === type ? false : type)
  };

  const saveBarAndNavigate = (direction) => {
    const { updateUserData } = props;
    updateBarNumber(direction);
    updateUserData({savedNotesArr});
  };

  const RenderNoteToggles = () => {
    const noteDenoms = [64, 32, 16, 8, 4, 2, 1];
    return noteDenoms.map((item) => (
      <button
        className="btn btn-secondary"
        type="button"
        key={item}
        style={{
        border: `1px solid ${activeNoteLength === item ? 'red' : 'white'}`,
      }}
        onClick={() => setActiveNoteLength(maxAmountNoteValue / (maxAmountNoteValue / item))}
      >
        {`1/${maxAmountNoteValue / item}`}
      </button>
    ))
  };

  const clearBar = () =>  {
    const { updateUserData } = props;
    setSavedNotesArr({
      ...savedNotesArr,
      [shadowUserData.activeBarNumber]: []
    });
    updateUserData({savedNotesArr});
    draw();
  };

  const reset = () => {
    setSavedNotesArr([]);
    updateShadowUserData({
      activeBarNumber: 1
    });
    writeToUserData({appStep: 0, userKey: 'C'});
    window.location.reload();
  };

      return (
        <>
          <section className="App-content">
            <div className="canvas-container">
              <button
                id="decrement-bar"
                className="btn btn-secondary"
                type="button"
                disabled={shadowUserData.activeBarNumber < 2}
                onClick={() => saveBarAndNavigate('-')}
              >
Previous
              </button>
              <canvas 
                width={canvasWidth} 
                height={canvasHeight} 
                ref={canvasRef} 
                onMouseMove={handleMouseMove}
                onMouseLeave={draw}
                onClick={saveNote}
              />
              <button id="increment-bar" className="btn btn-primary" type="button" onClick={() => saveBarAndNavigate('+')}>Next</button>
            </div>
            <div className="toggle-controls-container input-group w-auto">
              <div className="input-group-prepend">
                <span className="input-group-text">Fret # min:</span>
              </div>
              <input onChange={updateLowerBound} value={lowerBoundValue} placeholder='lower bound' />
              <div className="input-group-prepend">
                <span className="input-group-text">Fret # max:</span>
              </div>
              <input onChange={updateUpperBound} value={upperBoundValue} placeholder='upper bound' />
            </div>
            <div id="denom-buttons" className="toggle-controls-container">
              <p>Notes:</p>
              {RenderNoteToggles()}
              <button
                className="btn btn-secondary"
                type="button"
                style={{
                border: `1px solid ${accidentalOverride === 'natural'? 'red' : 'white'}`,
              }}
                onClick={() => assignAccidental('natural')}
              >
&#9838;
              </button>
              <button
                className="btn btn-secondary"
                type="button"
                style={{
                border: `1px solid ${accidentalOverride === 'flat'? 'red' : 'white'}`,
              }}
                onClick={() => assignAccidental('flat')}
              >
&#9837;
              </button>
              <button
                className="btn btn-secondary"
                type="button"
                style={{
                border: `1px solid ${accidentalOverride === 'sharp' ? 'red' : 'white'}`,
              }}
                onClick={() => assignAccidental('sharp')}
              >
#
              </button>
            </div>
            <div className="toggle-controls-container">
              <button className="btn btn-warning" type="button" onClick={() => clearBar()}>Clear bar</button>
              <button className="btn btn-danger" type="button" onClick={() => reset()}>Reset</button>
              <button id="build-table-btn" className="btn btn-success" type="button" onClick={() => buildTable()}>Generate tab below</button>
            </div>
          </section>
          {mergedBars && (
            <section id="tab-table" className="App-content code">
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

export default BarView;

  BarView.propTypes = {
    userData: PropTypes.shape({
      savedNotesArr: [],
      activeBarNumber: PropTypes.number.isRequired
    }).isRequired,
    updateUserData: PropTypes.func.isRequired,
    userKey: PropTypes.string.isRequired
  }