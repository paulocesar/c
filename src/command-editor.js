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

    formatMessages(messages) {
        return messages
            .map((m) => typeof m === 'string' ? m : JSON.stringify(m))
            .join(' ');
    }

    setMessage(...messages) {
        this._message = this.formatMessages(messages);
        this.file.lines[0] = this._message;
    }

    setTempMessage(...messages) {
        msg = this.formatMessages(messages);
        this.file.lines[0] = msg;
    }

    revertTempMessage() {
        this.file.lines[0] = this._message;
    }

    getMessage() { return this.file.lines[0]; }
}

module.exports = CommandEditor;
