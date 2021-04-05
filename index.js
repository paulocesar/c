const readline = require('readline');
const Display = require('./src/display');
const keyboard = require('./src/keyboard');


function main() {
    const display = new Display();

    function terminalFinish(status = 0) {
        display.finish();
        process.exit(status);
    }

    readline.emitKeypressEvents(process.stdin);

    process.stdout.on('resize', () => display.resize());

    process.stdin.on('keypress', function (char, key) {
        const name = keyboard.parse(char, key);

        if (name === null) { return; }

        if (name === 'ctrl-z') { terminalFinish(); }

        // TODO keyboard actions

        display.refresh();
    });

    display.startup();
}

main();
