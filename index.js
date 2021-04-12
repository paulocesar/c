const readline = require('readline');
const Display = require('./src/display');
const catalog = require('./src/catalog');


async function main() {
    const display = new Display();

    function terminalFinish(status = 0) {
        display.finish();
        process.exit(status);
    }

    readline.emitKeypressEvents(process.stdin);

    process.stdout.on('resize', () => display.resize());

    process.stdin.on('keypress', async function(char, key) {
        const name = catalog.parse(char, key);

        if (name === null) { return; }

        if (name === 'ctrl-z') { terminalFinish(); }

        await display.processKey(name, char, key);
    });

    await display.startup();
}

main();
