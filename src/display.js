const readline = require('readline');
const Editor = require('./editor');
const CommandEditor = require('./command-editor');
const File = require('./file');
const keyboard = require('./keyboard');

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
        this.commandEditor = new CommandEditor(this.maxRows);
        this.setCommandMessage();
        this.resize();
    }

    async createTest() {
        const f = require('path').resolve(__dirname, 'display.js')
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
        this.commandEditor.resize(this.maxCols);

        this.clear();
        this.refresh();
    }

    refresh() {
        // TODO: transform multiple views/grids into an array of lines
        this.render(this.editor.render().concat(
            this.commandEditor.render()));
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
        this.commandEditor.setMessage.apply(this.commandEditor,
            [ this.editor.getModeName().toUpperCase() ].concat(args));
    }

    processKey(name, char, key) {
        this.setCommandMessage(name, JSON.stringify(char), JSON.stringify(key));
        keyboard.process(this, name, char, key);
        this.setCommandMessage(name, JSON.stringify(char), JSON.stringify(key));
        this.refresh();
    }
}

module.exports = Display;
