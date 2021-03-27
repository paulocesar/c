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
        ].join('\n')

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
});
