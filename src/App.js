import './App.css';
import React from 'react';
import {
  retrieveUserData,
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
    console.log('updateUserData called!--->', data);
    this.setState({userData: data});
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
              <li onClick={() => this.updateUserNavigation('+')}>Next</li>
            </ul>
          </nav>
          {userData.appStep === 0 ? (
            <section className="App-content">
              <h4>Choose a key</h4>
              <h5>(Uppercase major, lowercase minor)</h5>
              <input onChange={this.updateUserEnteredKey} value={userKey} placeholder='C by default' />
              <button onClick={() => this.updateUserNavigation('+')}>Next Step</button>
            </section>
          ) : (
            <BarView userKey={userKey} updateUserData={this.updateUserData} userData={userData}/>
          )}
        </div>
        </>
      )
  }
}

export default App;
