import React from 'react';
import { shallow, mount } from 'enzyme';
import App from './App';

jest.mock('react-ga4');
window.HTMLCanvasElement.prototype.getContext = () => {
  return {
    clearRect: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    stroke: jest.fn(),
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
