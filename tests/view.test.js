const path = require('path');
const assert = require('assert');

const File = require('../src/file');
const View = require('../src/view');

describe('view', () => {
    let file = null;
    let view = null;

    const width = 8;
    const height = 3;
    const offset = 1;
    const hideFileInfo = true;

    beforeEach(async () => {
        file = new File(path.resolve(__dirname, './data/sample.txt'));
        await file.load();
        view = new View({ file, width, height, offset, hideFileInfo });
    });

    it('render view', () => {
        assert.equal(view.render(), [
            '\x1B[33m0 \x1B[0m\x1B[46m\x1B[37m\x1B[1m\x1B[5mt\x1B[0mhis i',
            '\x1B[33m1 \x1B[0m      ',
            '\x1B[33m2 \x1B[0mthe cu'
        ].join('\n'));
    });

    it('render view line 2', () => {
        view.goto({ x: 2, y: 0 });
        assert.equal(view.render(), [
            '\x1B[33m1 \x1B[0m      ',
            '\x1B[33m2 \x1B[0m\x1B[46m\x1B[37m\x1B[1m\x1B[5mt\x1B[0mhe cu',
            '\x1B[33m3 \x1B[0m\\o/   '
        ].join('\n'));
    });

    it('render view line end', () => {
        view.goto({ x: 2, y: 7 });
        assert.equal(view.render(), [
            '\x1B[33m1 \x1B[0m      ',
            '\x1B[33m2 \x1B[0me cur\x1B[46m\x1B[37m\x1B[1m\x1B[5mr\x1B[0m',
            '\x1B[33m3 \x1B[0m/     '
        ].join('\n'));
    });
});
