const File = require('./file');
const Editor = require('./editor');

const prompt = '¥ ';

class CommandEditor extends Editor {
    constructor(width) {
        const file = new File();
        file.lines = [ '', prompt ];
        super({ file, x: 1, y: 2, height: 2, width,
            hidePreColumn: true, hideFileInfo: true });
        this.isCommand = true;
        this.goto({ x: 1, y: 2 });
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

    async process(d, commands, name, char, key) {
        if (name === '\n') {
            const params = this.file.lines[1].slice(2).trim().split(/\s+/g);
            const cmd = params.shift();
            const fn = commands[cmd] || commands.default;
            this.file.lines[1] = prompt;
            this.goto({ x: 1, y: 2 });
            await fn.apply(commands, [ d ].concat(params));
        }

        if (!name || name.length > 1 || /[^\w- \b]/.test(name)) { return }

        this.input(name);
    }
}

module.exports = CommandEditor;
