import React from 'react';
import ReactGA from 'react-ga';
import { shallow, mount } from 'enzyme';
import App from './App';

jest.mock('react-ga');
window.HTMLCanvasElement.prototype.getContext = () => {
  return {
      clearRect: jest.fn(),
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      stroke: jest.fn()
  };
};

afterEach(() => {    
  jest.clearAllMocks();
});

test('App snapshot rendering', () => {
  const wrapper = shallow(<App />);
  expect(wrapper).toMatchSnapshot();
});

test('should initialise userData if no userData', () => {
  const getItemSpy = jest.spyOn(Storage.prototype, 'getItem');
  
  mount(<App />);

  expect(getItemSpy).toHaveBeenCalled();
});

test('should initialise analytics', () => {
  const reactGaInitSpy = jest.spyOn(ReactGA, 'initialize');
  const reactGaPgViewSpy = jest.spyOn(ReactGA, 'pageview');

  mount(<App />);
  expect(reactGaInitSpy).toHaveBeenCalledWith('UA-146065324-1');
  expect(reactGaPgViewSpy).toHaveBeenCalledWith('/home');

});
