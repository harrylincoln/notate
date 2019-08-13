import './App.css';
import React from 'react';
import {
  retrieveUserData,
  writeToUserData
} from './utils/user-data';

import BarView from './components/bar-view';


class App extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      userKey: 'C',
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

  updateUserEnteredKey(e) {
    this.setState({userKey: e.target.value});
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
      userData,
      userKey
    } = this.state;
      return (
        <>
        <div className="App">
          <nav className="App-nav">
            <ul className="App-nav-list">
              <li onClick={() => this.updateUserNavigation('-')}>Back</li>
              <li>Active key: {userKey}</li>
              {userData.activeBarNumber && (
                <li>Bar #: {userData.activeBarNumber}</li>
              )}
              <li onClick={() => this.updateUserNavigation('+')}>Next</li>
            </ul>
          </nav>
          {userData.appStep === 0 ? (
            <section className="App-content">
              <div style={{
                width: '35%',
                margin: '0 auto'
              }}>
                <img src="./circle-of-fifths.jpg" alt="circle of fifths" style={{width:'100%'}}/>
              </div>
              <h4>Choose a key (uppercase only)</h4>
              <input onChange={this.updateUserEnteredKey} value={userKey} placeholder='C by default' />
              <button onClick={() => this.updateUserNavigation('+')}>Next Step</button>
            </section>
          ) : (
            <BarView 
            userKey={userKey} 
            updateUserData={this.updateUserData} 
            userData={userData} />
          )}
        </div>
        </>
      )
  }
}

export default App;
