const fs = require('fs');
const path = require('path');
const constants = require('./constants');
const ansi = require('./ansi-escape-codes');

function parse(char, key) {
    let prefix = '';

    if (key.sequence === '\u0000' && key.name === '`') {
        return 'ctrl-spacebar';
    }

    if (key.ctrl) { return `ctrl-${key.name}`; }
    if (key.sequence === '\b' && key.name === 'backspace') {
        return 'ctrl-h';
    }
    if (key.sequence === '\n' && key.name === 'enter') {
        return 'ctrl-j';
    }
    if (key.sequence === '\r' && key.name === 'return') {
        return '\n';
    }

    const { sequence, name } = key;

    if (!sequence && !name || name === 'escape') { return null; }
    if (name === 'backspace') { return '\b'; }
    if (name === 'return') { return '\n'; }

    if([ 'up', 'down', 'left', 'right' ].includes(name)) { return name; }
    return sequence || name || null;
}

const basicNavigation = {
    left(d) { d.editor.move({ x: 0, y: -1 }); },
    down(d) { d.editor.move({ x: 1, y: 0 }); },
    up(d) { d.editor.move({ x: -1, y: 0 }); },
    right(d) { d.editor.move({ x: 0, y: 1 }); }
}

basicNavigation.h = basicNavigation.left;
basicNavigation.j = basicNavigation.down;
basicNavigation.k = basicNavigation.up;
basicNavigation.l = basicNavigation.right;

const processMap = {
    navigate: Object.assign({
        default(d) { },
        i(d) {
            d.editor.mode = constants.viewMode.insert;
            d.setCommandMessage('');
            d.refresh();
        },
        '\n': (d) => {
            d.editor.mode = constants.viewMode.insert;
            d.setCommandMessage('');
            d.refresh();
        },
        ':': (d) => { d.setFocus(d.command); }
    }, basicNavigation),

    insert: {
        default(d, name) {
            d.editor.input(name);
        },
        'ctrl-h': (d) => {
            d.editor.mode = constants.viewMode.navigate;
            d.setCommandMessage('');
            d.refresh();
        }
    },

    select: {
        default(d) { }
    }
};

const commands = {
    async default(d) {
        d.setTempCommandMessage('Command not found.');
    },

    async save(d, filename) {
        if (!d.previousFocus) {
            return d.setTempCommandMessage('No focused view.');
        }

        const file = d.previousFocus.file;

        filename = filename || file.filepath;
        if (!filename) {
            return d.setTempCommandMessage('Please set a file name.');
        }

        fs.writeFileSync(path.resolve(filename), file.toText(), 'utf8');

        d.setTempCommandMessage('Saved!');
        d.setFocus(d.previousFocus);
    },

    async open(d, filename) {
        if (!filename) {
            return d.setTempCommandMessage('Please set a file name.');
        }

        await d.previousFocus.open(filename);
        d.setTempCommandMessage('Opened!');
    },
    async find(d, term) { },
    async replace(d, rgx, value) { },
    async replaceall(d, rgx, value) { },
    async split(d, filename) { },
    async vsplit(d, filename) { },
    async quit() { }
};

function process(display, name, char, key) {
    const mode = display.editor.getModeName();
    const map = processMap[mode];

    if (!map) { throw new Error(`Invalid mode`); }

    const mapFn = map[name] || map.default;

    mapFn(display, name, char, key);
}

function isFormat(file, format) {
    if (!file.filepath) { return false; }
    return path.extname(file.filepath) === `.${format}`;
}

const modifiers = {
    view: [{
        canUse(v) { return true; },

        beforeProcess(v) { },

        preColProcess(v, x, preLine) {
            return `${ansi.settings.lineCount}${preLine}${ansi.reset}`;
        },

        charProcess(v, x, y, char) {
            let prefix = '';
            let suffix = '';
            const p = v.position();

            if (y === 80) {
                prefix += ansi.settings.line80;
            }

            if (p.x === x && p.y === y && v.isFocused) {
                prefix += ansi.settings.cursor;
            }

            if (prefix) { suffix = ansi.reset; }

            return `${prefix}${char}${suffix}`;
        },

        fileInfoProcess(v, line) {
            line = ansi.settings.fileInfo;
            const filename = ` ${v.file.filepath.split('/').pop() || '~'}`;
            for (let y = 0; y < v.width; y++) {
                line += filename[y] || ' ';
            }
            line += ansi.reset;
            return line;
        }
    }, {
        canUse(v) { return isFormat(v.file, 'js'); },

        beforeProcess(v) { },

        preColProcess(v, x, preLine) { return preLine; },

        charProcess(v, x, y, char) { return char; },

        fileInfoProcess(v, line) { return line; }
    }],
    file: [{
        canUse(f) { return true; },
        beforeProcess(f, chars) { },
        process(f, chars) { return chars; }
    }, {
        canUse(f) { return isFormat(f, 'js'); },
        beforeProcess(f, chars) { },
        process(f, chars) { return chars; }
    }]
};

const catalog = { parse, process, commands, modifiers };
module.exports = catalog;
