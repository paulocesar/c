const File = require('./file');
const Editor = require('./editor');

const prompt = '¥ ';

class CommandEditor extends Editor {
    constructor(width) {
        const file = new File();
        file.lines = [ '', prompt ];
        super({ file, x: 1, y: 2, height: 2, width,
            hidePreColumn: true, hideFileInfo: true });
    }

    resize(width) {
        this.view.resize(2, width);
    }

    message(msg) {
        return this.file.lines[0] = typeof msg === 'string' ?
            msg : JSON.stringify(msg);
    }
}

module.exports = CommandEditor;
