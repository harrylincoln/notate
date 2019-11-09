import React from 'react';
import ReactGA from 'react-ga';
import { shallow, mount } from 'enzyme';
import App from './App';

jest.mock("react-ga");
HTMLCanvasElement.prototype.getContext = () => jest.func();

const setStateSpy = jest.spyOn(App.prototype, 'setState');

afterEach(() => {    
  jest.clearAllMocks();
});

test('App snapshot rendering', () => {
  const wrapper = shallow(<App />);
  expect(wrapper).toMatchSnapshot();
});

test('should initialise userData if no userData', () => {
  const getItemSpy = jest.spyOn(Storage.prototype, 'getItem');
  
  shallow(<App />);

  expect(getItemSpy).toHaveBeenCalled();
  expect(setStateSpy).toHaveBeenCalledWith({userData: {
    appStep: 0,
    userKey: 'C'
  }});
});

test('should initialise analytics', () => {
  const reactGaInitSpy = jest.spyOn(ReactGA, 'initialize');
  const reactGaPgViewSpy = jest.spyOn(ReactGA, 'pageview');

  shallow(<App />);
  expect(reactGaInitSpy).toHaveBeenCalledWith('UA-146065324-1');
  expect(reactGaPgViewSpy).toHaveBeenCalledWith('/home');

});

test('should update user key when continuing through to bar-view', () => {
  const newKey = 'D';
  const wrapper = mount(<App />);
  wrapper.find('#userKeyInput').simulate('change', { target: { value: newKey } });
  expect(setStateSpy).toHaveBeenCalledWith({userData: {
    appStep: 0,
    userKey: newKey
  }});
  wrapper.find('#continueToBarViewBtn').simulate('click');
  expect(setStateSpy).toHaveBeenCalledWith({userData: {
    activeBarNumber: 1,
    appStep: 1,
    userKey: newKey
  }});
});