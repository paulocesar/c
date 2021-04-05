const readline = require('readline');

class Display {
    constructor() {
        this.renderedLines = [ ];
        // TODO: add grid with editor views
        // TODO: add command view
    }
    startup() {
        this.renderedLines = [ ];

        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.write('\x1B[?25l');

        this.resize();
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

    resize() {
        const maxCols = process.stdout.columns;
        const maxRows = process.stdout.rows - 2;

        this.clear();
        this.refresh();
    }

    refresh() {
        // TODO: transform multiple views/grids into an array of lines
        this.render([ 'hello world!' ]);
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
}

module.exports = Display;
