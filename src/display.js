const readline = require('readline');
const Editor = require('./editor');
const CommandEditor = require('./command-editor');
const NotifyEditor = require('./notify-editor');
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
        await this.loadEditors();
        this.setCommandMessage();
        this.resize();
    }

    getEditorCols() {
        return Math.min((this.maxCols - 1) / 2);
    }

    async loadEditors() {
        const f = require('path').resolve(__dirname, '..', 'tmp', 'TODO.txt');
        const file = new File(f);
        await file.load();

        this.editor = new Editor({
            file, x: 0, y:0, offset: 1,
            height: this.maxRows - 2, width: this.getEditorCols()
        });

        this.setFocus(this.editor);

        this.notifyEditor = new NotifyEditor({
            x: 0, y:0, offset: 1,
            height: this.maxRows - 2, width: this.getEditorCols()
        });

        this.command = new CommandEditor(this.maxRows);

        const loadNotifications = async() => {
            await this.notifyEditor.loadNotifications();
            this.refresh();
            setTimeout(loadNotifications, 5 * 60 * 1000);
        }

        loadNotifications();
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

        const editorCols = this.getEditorCols();

        this.editor.resize(this.maxRows - 2, editorCols);
        this.notifyEditor.resize(this.maxRows - 2, editorCols);
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

        const editors = [ this.editor, this.notifyEditor ]
            .map((e) => e.render());

        const editorLines = [ ];

        for (let l = 0; l < editors[0].length; l++) {
            editorLines.push(editors[0][l] + '|' + editors[1][l]);
        }

        this.render(editorLines.concat(
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

    setTempCommandMessage(...args) {
        this.command.setTempMessage.apply(
            this.command,
            [ this.editor.getModeName().toUpperCase() ]
                .concat(args).concat(() => this.refresh())
        );
    }

    async processKey(name, char, key) {
        const { focus } = this;
        if (focus.isCommand) {
            await focus.process(this, catalog.commands, name, char, key);
        } else {
            catalog.process(this, name, char, key);
        }
        this.setTempCommandMessage({ name, char, key });
        this.refresh();
    }
}

module.exports = Display;
