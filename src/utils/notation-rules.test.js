import { 
    mutateNotesToActiveKey,
    assignTabValues,
    groupByPosition,
    groupByString,
    buildAsciTable
 } from './notation-rules';
import {
    mutateNotesToActiveKeySampleInput,
    mutateNotesToActiveKeySampleOutput,
    assignTabValuesOutput,
    groupByPositionOutput,
    groupByStringOutput,
    groupByPosChordsIn,
    groupByPosChordsOut,
    buildAsciTableOutput
} from '../../test/sample-music/samples';

describe('mutateNotesToActiveKey', () => {
    const activeKey = 'A';
    it('should account for accidental overrides in the input array of notes', () => {
        expect(mutateNotesToActiveKey(mutateNotesToActiveKeySampleInput, activeKey)).toEqual(mutateNotesToActiveKeySampleOutput)
    });
});

describe('assignTabValues', () => {
    it('should assignTabValues using pitch values of the notes', () => {
        expect(assignTabValues(mutateNotesToActiveKeySampleOutput)).toEqual(assignTabValuesOutput);
    })
});

describe('groupByPosition', () => {
    it('should group the notes based on position', () => {
        expect(groupByPosition(assignTabValuesOutput)).toEqual(groupByPositionOutput)
    });
    it('should swap out conflicting notes in chords that have overlapping closestBeatX vals', () => {
        expect(groupByPosition(groupByPosChordsIn)).toEqual(groupByPosChordsOut);
    });
});

describe('groupByString', () => {
    it('should group the sorted notes array by string value', () => {
        expect(groupByString(groupByPositionOutput)).toEqual(groupByStringOutput);
    });

    it('should throw and error for the toastNotification comp to catch if no tabPos assigned', () => {
        const failingGroupByStringArr = [
            {
                noTabPosThatsForSure: 'hi there'
            }
        ];

        try {
            groupByString(failingGroupByStringArr);

            // Fail test if above expression doesn't throw anything.
            expect(true).toBe(false);
        } catch (e) {
            expect(e.message).toEqual('Note(s) out of bounds for your fret range(s). Reload to clear bar and try reconfiguring Fret min/max #');
        }
    })
});

describe('buildAsciTable', () => {
    it('should create an ASCI table based off the string data', () => {
        expect(buildAsciTable(groupByStringOutput)).toEqual(buildAsciTableOutput);
    });
});