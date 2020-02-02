import React from 'react';
import ReactGA from 'react-ga';
import { mount } from 'enzyme';
import BarView from './bar-view';

import { savedNotesArrayMock, oneBarHTMLMock } from '../../test/sample-music/sample-component-data';

jest.mock('react-ga');

const clearReactMock = jest.fn();
const beginPathMock = jest.fn();
const moveToMock = jest.fn();
const lineToMock = jest.fn();
const strokeMock = jest.fn();
const ellipseMock = jest.fn();
const fillMock = jest.fn();
const closePathMock = jest.fn();
const bezierCurveToMock = jest.fn();

window.HTMLCanvasElement.prototype.getContext = () => {
    return {
        clearRect: clearReactMock,
        beginPath: beginPathMock,
        moveTo: moveToMock,
        lineTo: lineToMock,
        stroke: strokeMock,
        ellipse: ellipseMock,
        fill: fillMock,
        closePath: closePathMock,
        bezierCurveTo: bezierCurveToMock
    };
};

const updateUserDataSpyFunc = jest.fn();

const userData = {
    userKey: 'C',
    appStep: 1
};

let component;

beforeEach(() => {
  component = mount(
    <BarView 
      userKey={userData.userKey}
      updateUserData={updateUserDataSpyFunc}
      userData={userData}
    />
  );
})

afterEach(() => {    
  jest.clearAllMocks();
});

it('should set new reactGa state', () => {
    const reactGaPgViewSpy = jest.spyOn(ReactGA, 'pageview');
    const reactGaEventSpy = jest.spyOn(ReactGA, 'event');

    expect(reactGaPgViewSpy).toBeCalledWith('/bar-view');
    expect(reactGaEventSpy).toBeCalledWith({
        category: 'Usage',
        action: 'Bar view - started'
    });
});

it('should draw staves', () => {
  expect(moveToMock).toHaveBeenCalledTimes(15);
  expect(lineToMock).toHaveBeenCalledTimes(15);
});

it('should reset the app', () => {
  component.find('#reset-app-btn').simulate('click');
});

it('should draw a tab table', () => {
  const wrapper = mount(
    <BarView 
      userKey={userData.userKey}
      updateUserData={updateUserDataSpyFunc}
      userData={{...userData, savedNotesArr: savedNotesArrayMock}}
    />
  );
  expect(wrapper.find('#tab-table').exists()).toBe(false);
  wrapper.find('#build-table-btn').simulate('click');
  expect(wrapper.find('#tab-table').exists()).toBe(true);
  expect(wrapper.find('#tab-table').html()).toEqual(oneBarHTMLMock);
});

describe('initial quarter note grid', () => {
  const standardMoveToAmount = 22;
  const standardLineToAmount = 22;
  const standardEllipAmount = 1;

  describe('when hovering over the canvas on middle C, first beat', () => {
    beforeEach(() => {
      component.find('canvas').simulate('mousemove', { nativeEvent: { offsetX: 33, offsetY: 337 }});
    });
    it('should draw a ledger line through the middle of the note', () => {
      expect(moveToMock).toHaveBeenCalledWith(4, 340);
      expect(lineToMock).toHaveBeenCalledWith(76, 340);
    });

    it('should have a standard features for a quaver', () => {
      expect(moveToMock).toHaveBeenCalledTimes(standardMoveToAmount);
      expect(lineToMock).toHaveBeenCalledTimes(standardLineToAmount);
      expect(ellipseMock).toHaveBeenCalledTimes(standardEllipAmount);
      expect(moveToMock).toHaveBeenCalledWith(64, 340);
      expect(lineToMock).toHaveBeenCalledWith(64, 232);
    });

    it('base should be filled in', () => {
      expect(fillMock).toHaveBeenCalledTimes(1);
    });

    describe('and plotting that first note when clicking', () => {
      beforeEach(() => {
        component.find('canvas').simulate('click', { nativeEvent: { offsetX: 33, offsetY: 337 }});
      });

      describe('and attempting to show another note on hover between current note and the next in the note grid', () => {
        beforeEach(() => {
          component.find('canvas').simulate('mousemove', { nativeEvent: { offsetX: 34, offsetY: 337 }});
        });

        it('should draw only existing note because it is too far the next barline catchment', () => {
          expect(fillMock).toHaveBeenCalledTimes(2);
        });

        describe('and successfully showing another note on hover', () => {
          beforeEach(() => {
            component.find('canvas').simulate('mousemove', { nativeEvent: { offsetX: 200, offsetY: 337 }});
          });
  
          it('should draw two notes as the hover is within catchment of the next barline', () => {
            expect(fillMock).toHaveBeenCalledTimes(4);
          });
        });
      });
    });

  });

  describe('preselecting an accidental sharp for middle C, first beat', () => {
    beforeEach(() => {
      component.find('#add-sharp-btn').simulate('click');
      component.find('canvas').simulate('mousemove', { nativeEvent: { offsetX: 33, offsetY: 337 }});
    });

    it('should draw a sharp symbol to the right of the note', () => {
      expect(moveToMock).toHaveBeenCalledTimes(standardMoveToAmount + 4);
      expect(lineToMock).toHaveBeenCalledTimes(standardMoveToAmount + 4);
    });
  });

  describe('preselecting an accidental flat for middle C, first beat', () => {
    beforeEach(() => {
      component.find('#add-flat-btn').simulate('click');
      component.find('canvas').simulate('mousemove', { nativeEvent: { offsetX: 33, offsetY: 337 }});
    });

    it('should draw a flat symbol to the right of the note', () => {
      expect(ellipseMock).toHaveBeenCalledTimes(standardEllipAmount + 1);
    });
  });

  describe('when changing the beatline selection to eighth notes', () => {
    beforeEach(() => {
      component.find('.time-grid-toggle-btn').at(3).simulate('click');
      component.find('canvas').simulate('click', { nativeEvent: { offsetX: 40, offsetY: 337 }});
      component.find('canvas').simulate('mousemove', { nativeEvent: { offsetX: 41, offsetY: 337 }});
      component.find('canvas').simulate('click', { nativeEvent: { offsetX: 120, offsetY: 337 }});
    });
    it('should snap new notes to the note grid approriately', () => {
      expect(fillMock).toHaveBeenCalledTimes(2);
      expect(moveToMock).toHaveBeenCalledTimes(23);
    });
  });
});
