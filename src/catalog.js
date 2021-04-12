const Editor = require('./editor');

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

basicNavigation.h = basicNavigation.left
basicNavigation.j = basicNavigation.down
basicNavigation.k = basicNavigation.up
basicNavigation.l = basicNavigation.right

const processMap = {
    navigate: Object.assign({
        default(d) { },
        i(d) { d.editor.mode = Editor.mode.insert; },
        '\n': (d) => { d.editor.mode = Editor.mode.insert; },
        ':': (d) => { d.setFocus(d.command); }
    }, basicNavigation),

    insert: {
        default(d, name) {
            d.editor.input(name);
        },
        'ctrl-h': (d) => {
            d.editor.mode = Editor.mode.navigate;
        }
    },

    select: {
        default(d) { }
    },
};

const commands = {
    async default(d) {
        d.setCommandMessage(`Command not found.`);
        d.setFocus(d.editor);
    },
    async save(d) {
        processMap.command.default(d);
    }
};

function process(display, name, char, key) {
    const mode = display.editor.getModeName();
    const map = processMap[mode];

    if (!map) { throw new Error(`Invalid mode`); }

    const mapFn = map[name] || map.default;

    mapFn(display, name, char, key);
}

const catalog = { parse, process, commands };
module.exports = catalog;