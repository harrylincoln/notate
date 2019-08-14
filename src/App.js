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
    let userData = {...this.state.userData};
    userData.userKey = e.target.value;
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
          <nav className="App-nav">
            <ul className="App-nav-list">
              <li>Active key: {userData.userKey}</li>
              {userData.activeBarNumber && (
                <li>Bar #: {userData.activeBarNumber}</li>
              )}
            </ul>
          </nav>
          {userData.appStep === 0 && (
            <section className="App-content">
              <div className="cof-container">
                <img src="./circle-of-fifths.jpg" alt="circle of fifths"/>
              </div>
              <h1 style={{marginTop: '0'}}>Notes to tab</h1>
              <h4 style={{marginTop: '0'}}>Choose a key (uppercase only)</h4>
              <input onChange={this.updateUserEnteredKey} value={userData.userKey} placeholder='C by default' />
              <button style={{marginTop: '0.5rem'}} onClick={() => this.updateUserNavigation('+')}>Next Step</button>
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
