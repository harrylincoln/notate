import './App.css';
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

  initialiseUserData() {
    return new Promise(resolve => this.setState({
      userData: retrieveUserData()
    }, resolve()));
  }

  async componentWillMount() {
    await this.initialiseUserData();
  }

  componentDidMount() {
    ReactGA.initialize('UA-146065324-1');
    ReactGA.pageview('/home');
  }

  updateUserEnteredKey(e) {
    let userData = {...this.state.userData};
    userData.userKey = e.target.value.toLowerCase();
    this.setState({userData});
  }

  updateUserNavigation(direction) {
    let userData = {...this.state.userData};
    direction === '+' ? userData.appStep += 1 : userData.appStep += -1;
    this.setState({userData});
  }

  updateUserData(data) {
    const userData = Object.assign(this.state.userData, data);
    this.setState({userData}, () => writeToUserData(userData));
  }

  render() {

    const { 
      userData
    } = this.state;
      return (
        <>
        <div className="App">
          <ToastContainer />
          <nav className="App-nav">
            <ul className="App-nav-list">
            <li>Active key: {userData.userKey.toUpperCase()}</li>
              {userData.activeBarNumber && (
                <li>Bar #: {userData.activeBarNumber}</li>
              )}
            </ul>
          </nav>
          {userData.appStep === 0 && (
            <section style={{padding: '2rem'}} className="App-content">
              <div className="cof-container">
                <img src="./circle-of-fifths.jpg" alt="circle of fifths"/>
              </div>
              <h1 style={{marginTop: '0'}}>Notes to tab</h1>
              <h4 style={{marginTop: '0'}}>Choose a key (uppercase only):</h4>
              <input onChange={this.updateUserEnteredKey} value={userData.userKey.toUpperCase()} placeholder='C by default' />
              <button style={{marginTop: '0.5rem'}} onClick={() => this.updateUserNavigation('+')}>Next Step</button>
              <h4>Usage / gotchas:</h4>

              <p style={{marginTop: '0'}}>- Use a laptop, not a phone. I mean, it might work but not tested <span role='img' aria-label='shrug'>🤷</span></p>

              <p>- Accidentals are not implied based on previously declared ones. 
              ie. if you want another flat outside of the key after already adding one 
              at the beginning of the bar, you must implicitly set it again.</p>

              <p>- 4/4 is the only time sig at the moment</p>

              <p>- It has a tough time if you plot tightly voiced triads/chords. This is a known bug and will be fixed.</p>

              <p>- Triplet grouping, beams, dotted values, hooks and tailing of notes aren't configurable at this time. Group them tight if you want a triplet <span role='img' aria-label='kiss'>😚</span></p>

              <p>- Tab has no concept of implicitly setting rests between notes. To address this, your grid will snap the notes to the beat lines.</p>

              <p>- If you'd like to raise a bug/PR please do so via the <a rel="noopener noreferrer" target="_blank" href="https://github.com/harrylincoln/notate/">project's Github repo</a> <span role='img' aria-label='thanks'>🙏</span></p>
            </section>
          )}
          {userData.appStep === 1 && (
            <BarView 
            userKey={userData.userKey} 
            updateUserData={this.updateUserData} 
            userData={userData} />
          )}
        </div>
        </>
      )
  }
}

export default App;
