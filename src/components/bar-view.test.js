import React from 'react';
import ReactGA from 'react-ga';
import { mount } from 'enzyme';
import BarView from './bar-view';

import { savedNotesArrayMock, oneBarHTMLMock } from '../../test/sample-music/sample-component-data';

jest.mock('react-ga');
window.HTMLCanvasElement.prototype.getContext = () => {
    return {
        clearRect: jest.fn(),
        beginPath: jest.fn(),
        moveTo: jest.fn(),
        lineTo: jest.fn(),
        stroke: jest.fn(),
        ellipse: jest.fn(),
        fill: jest.fn(),
        closePath: jest.fn()
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

test('when mouseMove in canvas, draw function invoked with note data', () => {
    const handleMouseMoveSpy = jest.spyOn(BarView.prototype, 'handleMouseMove');
    const drawSpy = jest.spyOn(BarView.prototype, 'draw');

    const fakeEventData = {
        nativeEvent: {
            offsetX: 40, offsetY: 50
        }
    };

    const closestLedger = {
        ledger: [-2, 0], 
        note: {C: 2}, 
        x0: 0, 
        x1: 800, 
        y0: 60, 
        y1: 60
    };

    const wrapper = mount(
      <BarView 
        userKey={userData.userKey}
        updateUserData={updateUserSpyFunc}
        userData={userData}
      />
    );

    wrapper.find('canvas').simulate('mousemove', fakeEventData);
    expect(handleMouseMoveSpy).toBeCalled();
    expect(drawSpy).toBeCalledWith(
        fakeEventData.nativeEvent.offsetX,
        fakeEventData.nativeEvent.offsetY, 
        fakeEventData.nativeEvent.offsetX,
        closestLedger.y0,
        closestLedger);
    wrapper.find('canvas').simulate('click', fakeEventData);
    expect(setStateSpy).toHaveBeenCalledTimes(2);
    expect(setStateSpy.mock.calls).toEqual([
        [{
            "shadowUserData": {
                "activeBarNumber": 1,
            }
        }],
        [{
            ifSavedNotes: true,
            saveActive: true
        }]
    ]);
});

test('cycle through bars', () => {
    const updateBarNumberSpy = jest.spyOn(BarView.prototype, 'updateBarNumber');
    const wrapper = mount(
      <BarView 
        userKey={userData.userKey}
        updateUserData={updateUserSpyFunc}
        userData={{...userData, savedNotesArr: savedNotesArrayMock}}
      />
    );
    expect(wrapper.find('#decrement-bar').props().disabled).toBe(true);

    wrapper.find('#increment-bar').simulate('click');
    expect(updateBarNumberSpy).toBeCalledWith('+');
    expect(wrapper.find('#decrement-bar').props().disabled).toBe(false);

    wrapper.find('#decrement-bar').simulate('click');
    expect(updateBarNumberSpy).toBeCalledWith('-');
});

test('tab table is draw on submit', () => {
    const wrapper = mount(
      <BarView 
        userKey={userData.userKey}
        updateUserData={updateUserSpyFunc}
        userData={{...userData, savedNotesArr: savedNotesArrayMock}}
      />
    );
    expect(wrapper.find('#tab-table').exists()).toBe(false);
    wrapper.find('#build-table-btn').simulate('click');
    expect(wrapper.find('#tab-table').exists()).toBe(true);
    expect(wrapper.find('#tab-table').html()).toEqual(oneBarHTMLMock);
});