const reset = '\x1b[0m';
const bright = '\x1b[1m';
const dim = '\x1b[2m';
const underscore = '\x1b[4m';
const blink = '\x1b[5m';
const reverse = '\x1b[7m';
const hidden = '\x1b[8m';

const foreground = {
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    // 256 colors
    // for i in range(0, 16):
    //   for j in range(0, 16):
    //     code = str(i * 16 + j)
    //     sys.stdout.write(u"\x1b[38;5;" + code + "m " + code.ljust(4))
};

const background = {
    black: '\x1b[40m',
    red: '\x1b[41m',
    green: '\x1b[42m',
    yellow: '\x1b[43m',
    blue: '\x1b[44m',
    magenta: '\x1b[45m',
    cyan: '\x1b[46m',
    white: '\x1b[47m',
    // 256 colors
    // for i in range(0, 16):
    //   for j in range(0, 16):
    //     code = str(i * 16 + j)
    //     sys.stdout.write(u"\x1b[48;5;" + code + "m " + code.ljust(4))
};

function build(...params) { return params.join(''); }

const settings = {
    cursor: build(background.cyan, foreground.white, bright, blink),
    selection: build(background.blue, bright, foreground.white),
    line80: build(bright, foreground.red),
    lineCount: foreground.yellow,
    findResults: build(background.magenta, bright, foreground.white)
};

module.exports = {
    reset, bright, dim, underscore, blink, reverse, hidden,
    background,
    foreground,
    settings,
    build
};
