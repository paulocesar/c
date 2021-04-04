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

    beforeEach(async () => {
        file = new File(path.resolve(__dirname, './data/sample.txt'));
        await file.load();
        view = new View({ file, width, height, offset });
    });

    it('render view', () => {
        assert.equal(view.render(), [
            '0 this i',
            '1       ',
            '2 the cu'
        ].join('\n'));
    });
});
