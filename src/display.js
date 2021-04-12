const readline = require('readline');
const Editor = require('./editor');
const CommandEditor = require('./command-editor');
const File = require('./file');
const catalog = require('./catalog');

class Display {
    constructor(filepath) {
        this.renderedLines = [ ];
        // TODO: add grid with editor views
        // TODO: add command view
    }

    async startup() {
        this.renderedLines = [ ];

        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.write('\x1B[?25l');

        this.updateSize();
        this.editor = await this.createTest();
        this.command = new CommandEditor(this.maxRows);
        this.setFocus(this.editor);
        this.setCommandMessage();
        this.resize();
    }

    async createTest() {
        const f = require('path').resolve(__dirname, 'display.js');
        const file = new File(f);
        await file.load();
        return this.createEditor(file);
    }

    createEditor(file) {
        const e = new Editor({
            file,
            x: 0, y:0,
            height: this.maxRows - 2,
            width: this.maxCols,
            offset: 1
        });

        return e;
    }

    finish() {
        this.clear();
        process.stdin.write('\x1B[?25h');
    }

    clear() {
        this.renderedLines = [ ];
        readline.cursorTo(process.stdout, 0, 0);
        readline.clearScreenDown(process.stdout);
    }

    updateSize() {
        this.maxCols = process.stdout.columns;
        this.maxRows = process.stdout.rows;
    }

    resize() {
        this.updateSize();

        this.editor.resize(this.maxRows - 2, this.maxCols);
        this.command.resize(this.maxCols);

        this.clear();
        this.refresh();
    }

    setFocus(display) {
        if (this.focus) { this.focus.removeFocus(); }
        this.previousFocus = this.focus;
        this.focus = display;
        this.focus.setFocus();
    }

    refresh() {
        // TODO: transform multiple views/grids into an array of lines
        this.render(this.editor.render().concat(
            this.command.render()));
    }

    render(lines) {
        for (let y = 0; y < process.stdout.rows; y++) {
            if (lines[y] == null) { continue; }
            if (lines[y] === this.renderedLines[y]) { continue; }
            readline.cursorTo(process.stdout, 0, y);
            process.stdout.write(lines[y]);
        }

        this.renderedLines = lines;
    }

    setCommandMessage(...args) {
        this.command.setMessage.apply(this.command,
            [ this.editor.getModeName().toUpperCase() ].concat(args));
    }

    async processKey(name, char, key) {
        const { focus } = this;
        if (focus.isCommand) {
            await focus.process(this, catalog.commands, name, char, key);
        } else {
            catalog.process(this, name, char, key);
        }
        this.refresh();
    }
}

module.exports = Display;
