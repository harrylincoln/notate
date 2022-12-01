import React from 'react';
import ReactDOM from 'react-dom';
import ReactGA from 'react-ga4';
import App from './App';
import * as serviceWorker from './serviceWorker';

ReactGA.initialize('G-JT1NTG52R1');

ReactDOM.render(<App />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
