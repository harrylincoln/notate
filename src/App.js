import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import React, {useEffect, useState} from 'react';
import ReactGA from 'react-ga';
import { ToastContainer } from 'react-toastify';
import {
  writeToUserData,
  retrieveUserData
} from './utils/user-data';
import { normalize } from './utils/keys';

import Intro from './components/intro';
import BarView from './components/bar-view';


function App() { 

  const [userData, setUserData] = useState({});

  useEffect(() => {
    setUserData(retrieveUserData());
    ReactGA.initialize('UA-146065324-1');
    ReactGA.pageview('/home');
  }, []);

  const updateUserEnteredKey = (e) => {
    setUserData({...userData, userKey: normalize(e.target.value)})
  };

  const updateUserNavigation = direction => {
    setUserData({
      ...userData, 
      appStep: direction === '+' ? userData.appStep += 1 : userData.appStep += -1
    })
  };

  const updateUserData = data => {
    const updatedUserData = Object.assign(userData, data);
    setUserData(updatedUserData);
    writeToUserData(updatedUserData);
  };

    return (
      <>
        <div className="container">
          <ToastContainer />
          <div className="header clearfix">
            <ul className="nav justify-content-center">
              <li className="nav-item p-1">
  Active key: 
                {' '}
                <span id="active-key">{userData.userKey}</span>

              </li>
              {userData.activeBarNumber && (
                <li className="nav-item p-1">
    || Bar #:
                  {' '}
                  <span id="active-bar">{userData.activeBarNumber}</span>
                </li>
                  )}
            </ul>
          </div>
          {userData.appStep === 0 && (
          <Intro 
            updateUserEnteredKey={updateUserEnteredKey} 
            userData={userData} 
            updateUserNavigation={updateUserNavigation}
          />
          )}
          {userData.appStep === 1 && (
          <BarView 
            userKey={userData.userKey} 
            updateUserData={updateUserData} 
            userData={userData}
          />
            )}
        </div>
        <footer className="footer navbar-fixed-bottom py-4 bg-secondary text-white">
          <div className="container text-center">
            
Made by Harry Lincoln and still very much a WIP.
            {' '}
            <a href="https://github.com/harrylincoln/notate/">Submit a PR and contribute!</a>
            
          </div>
        </footer>
      </>
    );
};



export default App;