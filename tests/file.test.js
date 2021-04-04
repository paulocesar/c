const path = require('path');
const assert = require('assert');

const File = require('../src/file');

describe('file', () => {
    let file = null;
    let originalText = '';

    beforeEach(async () => {
        file = new File(path.resolve(__dirname, './data/sample.txt'));
        await file.load();
        originalText = file.lines.join('\n');
    });

    afterEach(() => delete file);

    it('load file', async() => {
        assert.equal(file.lines[0], 'this is a simple test!');
        assert.equal(file.lines[3], '\\o\/');
    });

    it('add chars', async() => {
        file.input('hi! ');

        assert.equal(file.lines[0], 'hi! this is a simple test!');

        file.goto({ x: 0, y: 26 });
        file.input(' ok?');

        assert.equal(file.lines[0], 'hi! this is a simple test! ok?');
    });

    it('add line break', async() => {
        file.goto({ x: 0, y: 5 });
        file.input('EDITED\n');

        assert.equal(file.lines[0], 'this EDITED');
        assert.equal(file.lines[1], 'is a simple test!');
    });

    it('remove chars', async() => {
        file.goto({ x: 0, y: file.lines[0].length });
        file.input('\b\b');

        file.goto({ x: 2, y: 0 });
        file.input('\b\b ');

        assert.equal(file.lines[0], 'this is a simple tes the current file ' +
            'will be used for specs');
    });

    it('undo/redo changes', async() => {
        file.goto({ x: 0, y: file.lines[0].length });
        file.input('\b\b');

        file.goto({ x: 2, y: 0 });
        file.input('\b\bt!\nhi my friend. ');

        const finalText = [
            'this is a simple test!',
            'hi my friend. the current file will be used for specs',
            '\\o/'
        ].join('\n');

        assert.equal(file.lines.join('\n'), finalText);

        for (let i = 0; i < file.timeMachine.length; i++) {
            file.undo();
        }

        assert.equal(file.lines.join('\n'), originalText);

        for (let i = 0; i < file.timeMachine.length; i++) {
            file.redo();
        }

        assert.equal(file.lines.join('\n'), finalText);
    });

    it('selection', async() => {
        file.goto({ x: 0, y: 1 });
        file.setMode(File.fileMode.SELECT);
        file.goto({ x: 2, y: 6 });

        const selection = [
            'his is a simple test!',
            '',
            'the cur'
        ].join('\n');

        assert.equal(file.selection(), selection);
    });

    it('inverted selection', async() => {
        file.goto({ x: 0, y: 6 });
        file.setMode(File.fileMode.SELECT);
        file.goto({ x: 0, y: 1 });

        assert.equal(file.selection(), 'his is');
    });

    it('get near words', async() => {
        const line0 = file.getNearWords({ x: 0, y: 0 });
        const line1 = file.getNearWords({ x: 1, y: 0 });
        const line2 = file.getNearWords({ x: 2, y: 11 });
        const line3 = file.getNearWords({ x: 3, y: 11 });

        const results = { line0, line1, line2, line3 };
        assert.deepEqual(results, {
            line0: {
                prev: null,
                curr: { x: 0, begin: 0, end: 3, text: 'this' },
                next: { x: 0, begin: 5, end: 6, text: 'is' }
            },
            line1: {
                prev: { x: 0, begin: 21, end: 21, text: '!' },
                curr: null,
                next: { x: 2, begin: 0, end: 2, text: 'the' }
            },
            line2: {
                prev: { x: 2, begin: 0, end: 2, text: 'the' },
                curr: { x: 2, begin: 4, end: 10, text: 'current' },
                next: { x: 2, begin: 12, end: 15, text: 'file' }
            },
            line3: {
                prev: { x: 3, begin: 1, end: 1, text: 'o' },
                curr: { x: 3, begin: 2, end: 2, text: '/' },
                next: null
            }
        });
    });

    it('find', () => {
        assert.deepEqual(file.find('is'), [
            { x: 0, begin: 2, end: 3, text: 'is' },
            { x: 0, begin: 5, end: 6, text: 'is' }
        ]);
        assert.deepEqual(file.find('u[\\w]e'), [
            { x: 2, begin: 25, end: 27, text: 'use' }
        ]);
    });

    it('replace', () => {
        file.replace(file.find('is'), 'OK');
        file.replace(file.find('u[\\w]e'), 'DONE');

        const expected = [
            'thOK OK a simple test!',
            '',
            'the current file will be DONEd for specs',
            '\\o/'
        ].join('\n');

        assert.equal(file.lines.join('\n'), expected);
    });
});
