import React from 'react';

export default function Intro (props) {
    const { updateUserEnteredKey, userData, updateUserBarNumber, updateUserNavigation } = props;

    const handleNextStep = () => {
      updateUserNavigation('+');
      updateUserBarNumber('+');
    };

    return (
      <section>
        <div className="jumbotron">
          <div className="row">
            <div className="col-lg-6">
              <h1 className="display-3">NotesToTab</h1>
              <p className="lead">This tool is ideal for a quick and dirty idea of what the guitar tab would look like if you plotted the notation.</p>
              <h4>How to use:</h4>
              <ul>
                <li>Choose a key, perhaps with help of the circle of fifths (image)</li>
                <li>Enter below (D, Bb, C# etc.)</li>
                <li>
After hitting
                  {' '}
                  <strong>Next Step</strong>
                  {' '}
button you&apos;ll be taken through to an interactive music stave where you can plot your notes
                </li>
              </ul>
              <div className="input-group mb-3">
                <input id="userKeyInput" onChange={updateUserEnteredKey} value={userData.userKey} placeholder='C by default' />
                <div className="input-group-append">
                  <button id="continueToBarViewBtn" className="btn btn-outline-primary" type="button" onClick={handleNextStep}>Next Step</button>
                </div>
              </div>
              <h4 className="mt-2">How NOT to use:</h4>
              <ul>
                <li>On a device - you need a trackpad/mouse to plot the notes</li>
              </ul>
            </div>
            <div className="col-lg-6">
              <img className="img-fluid p-2" src="./circle-of-fifths.jpg" alt="circle of fifths" />
            </div>
          </div>
        </div>
        <h2>Common gotchas</h2>
        <div className="row marketing">
          <div className="col-lg-6">
            <p>
  - Use a laptop, not a phone. I mean, it might work but not tested
              <span role='img' aria-label='shrug'>🤷</span>

            </p>
            <p>
  - Accidentals are not implied based on previously declared ones. 
                  ie. if you want another flat outside of the key after already adding one 
                  at the beginning of the bar, you must implicitly set it again.

            </p>
            <p>- 4/4 is the only time sig at the moment</p>
          </div>

          <div className="col-lg-6">
            <p>- It has a tough time if you plot tightly voiced triads/chords.</p>

            <p>
  - Triplet grouping, beams, dotted values, 
    hooks and tailing of notes aren&apos;t configurable at this time. 
    Group them tight if you want a triplet
              <span role='img' aria-label='kiss'>😚</span>

            </p>

            <p>
  - Tab has no concept of implicitly setting rests between notes. 
                  To address this, your grid will snap the notes to the beat lines.

            </p>
          </div>
        </div>
      </section>
    )
}