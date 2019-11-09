import React from 'react';
import ReactGA from 'react-ga';
import { mount } from 'enzyme';
import BarView from './bar-view';

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

const setStateSpy = jest.spyOn(BarView.prototype, 'setState');

const updateUserSpyFunc = jest.fn();

const userData = {
    userKey: 'C',
    appStep: 1
};

afterEach(() => {    
  jest.clearAllMocks();
});

test('when component mounts sets new reactGa state', () => {
    const reactGaPgViewSpy = jest.spyOn(ReactGA, 'pageview');
    const reactGaEventSpy = jest.spyOn(ReactGA, 'event');

    mount(
      <BarView 
        userKey={userData.userKey}
        updateUserData={updateUserSpyFunc}
        userData={userData}
      />
    );

    expect(reactGaPgViewSpy).toBeCalledWith('/bar-view');
    expect(reactGaEventSpy).toBeCalledWith({
        category: 'Usage',
        action: 'Bar view - started'
    });
});

test('when component mounts should default to define a standard quarter note grid', () => {
    const reCalcFuncSpy = jest.spyOn(BarView.prototype, 'reCalcBeatLineCords');

    const wrapper = mount(
      <BarView 
        userKey={userData.userKey}
        updateUserData={updateUserSpyFunc}
        userData={userData}
      />
    );

    expect(reCalcFuncSpy).toBeCalled();
    expect(wrapper.instance().beatLineCords).toEqual([ 40, 200, 360, 520 ]);

});

test('when component mounts for the first time it should update bar numbers', () => {
    mount(
      <BarView 
        userKey={userData.userKey}
        updateUserData={updateUserSpyFunc}
        userData={userData}
      />
    );
    expect(setStateSpy).toBeCalledWith({shadowUserData: {
        activeBarNumber: 1
      }});
    expect(updateUserSpyFunc).toBeCalledWith({activeBarNumber: 1});
});

test('when component mounts should draw the staves', () => {
    const getContextSpy = jest.spyOn(window.HTMLCanvasElement.prototype, 'getContext');
    const drawStavesSpy = jest.spyOn(BarView.prototype, 'drawStaves');
    mount(
      <BarView 
        userKey={userData.userKey}
        updateUserData={updateUserSpyFunc}
        userData={userData}
      />
    );
    
    expect(getContextSpy).toBeCalledWith('2d');
    expect(drawStavesSpy).toBeCalledWith();
});