const keys = require('./keys');

it('normalizes uppercase G', () => {
    expect(keys.normalize('G')).toBe('G');
});

it('normalizes lowercase G', () => {
    expect(keys.normalize('g')).toBe('G');
});

it('normalizes uppercase C sharp', () => {
    expect(keys.normalize('C#')).toBe('C#');
});

it('normalizes lowercase C sharp', () => {
    expect(keys.normalize('C#')).toBe('C#');
});

it('normalizes uppercase G flat', () => {
    expect(keys.normalize('Gb')).toBe('Gb');
});

it('normalizes lowercase G flat', () => {
    expect(keys.normalize('gb')).toBe('Gb');
});

it('normalizing empty string does not fail', () => {
    expect(keys.normalize('')).toBe('');
});

it('normalizing undefined does not fail', () => {
    expect(keys.normalize(undefined)).toBe('');
});

it('normalizing null does not fail', () => {
    expect(keys.normalize(null)).toBe('');
});
