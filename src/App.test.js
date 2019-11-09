import React from 'react';
import { shallow } from 'enzyme';
import App from './App';

jest.mock("react-ga");

test('Account delete view renders', () => {
  const wrapper = shallow(<App />);
  expect(wrapper).toMatchSnapshot();
});
