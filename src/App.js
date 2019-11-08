import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';
import React from 'react';
import ReactGA from 'react-ga';
import { ToastContainer } from 'react-toastify';
import {
  retrieveUserData,
  writeToUserData
} from './utils/user-data';

import BarView from './components/bar-view';


class App extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      userData: null,
    };
    this.updateUserEnteredKey = this.updateUserEnteredKey.bind(this);
    this.updateUserNavigation = this.updateUserNavigation.bind(this);
    this.updateUserData = this.updateUserData.bind(this);

  }

  async UNSAFE_componentWillMount() { // eslint-disable-line
    await this.initialiseUserData();
  }

  componentDidMount() {
    ReactGA.initialize('UA-146065324-1');
    ReactGA.pageview('/home');
  }

  initialiseUserData() {
    return new Promise(resolve => this.setState({
      userData: retrieveUserData()
    }, resolve()));
  }

  updateUserEnteredKey(e) {
    const {userData} = this.state;
    userData.userKey = e.target.value;
    this.setState({userData});
  }

  updateUserNavigation(direction) {
    const {userData} = this.state;
    if(direction === '+') {
      userData.appStep += 1;
    } else { 
      userData.appStep += -1;
    }
    this.setState({userData});
  }

  updateUserData(data) {
    const { userData } = this.state;
    const updatedUserData = Object.assign(userData, data);
    this.setState({userData: updatedUserData}, () => writeToUserData(userData));
  }

  render() {

    const { 
      userData
    } = this.state;
    return (
      <div className="container">
        <ToastContainer />
        <div className="header clearfix">
          <nav>
            <ul className="nav">
              <li>
Active key: 
                {userData.userKey}

              </li>
              {userData.activeBarNumber && (
              <li>
   Bar #:
                {userData.activeBarNumber}
              </li>
                 )}
            </ul>
          </nav>
          {userData.appStep === 0 && (
          <section>
            <div className="jumbotron">
              <div className="row">
                <div className="col-lg-6">
                  <h1 className="display-3">NotesToTab</h1>
                  <p className="lead">This tool is ideal for a quick and dirty idea of what the guitar tab would look if you plotted the notation.</p>
                  <h4>Steps:</h4>
                  <ul>
                    <li>Choose a key, perhaps with help of the circle of fifths (image)</li>
                    <li>Enter below (D, Bb, C# etc.)</li>
                    <li>After hitting Next Step button you&apos;ll be taken through to an interactive music stave where you can plot your notes</li>
                  </ul>
                  <div className="input-group mb-3">
                    <input onChange={this.updateUserEnteredKey} value={userData.userKey} placeholder='C by default' />
                    <div className="input-group-append">
                      <button className="btn btn-outline-primary" type="button" onClick={() => this.updateUserNavigation('+')}>Next Step</button>
                    </div>
                  </div> 
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
 )}
          {userData.appStep === 1 && (
          <BarView 
            userKey={userData.userKey.toUpperCase()} 
            updateUserData={this.updateUserData} 
            userData={userData}
          />
            )}
        </div>
      </div>
    );
  }
};



export default App;