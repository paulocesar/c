const fs = require('fs');
const readline = require('readline');

const ADD = 0;
const REMOVE = 1;

class File {
    constructor(filepath) {
        this.filepath = filepath;

        this.x = 0;
        this.y = 0;

        this.lines = [ '' ];

        this.timeMachine = [ ];
        this.timeMachineIdx = 0;
    }

    async load() {
        this.lines = [ ];
        this.timeMachine = [ ];
        this.timeMachineIdx = 0;

        const rl = readline.createInterface({
            input: fs.createReadStream(this.filepath),
            crlfDelay: Infinity
        });

        for await (const line of rl) {
            this.lines.push(line);
        }
    }

    debug() {
        console.log({ x: this.x, y: this.y });
        console.log(this.lines);
        console.log({
            timeMachineIdx: this.timeMachineIdx,
            timeMachine: this.timeMachine
        });
    }

    goto(pos) {
        if (pos.x < 0 || pos.x > this.lines.length - 1) {
            return false;
        }

        if (pos.y < 0 || pos.y > this.lines[pos.x].length) {
            return false;
        }

        this.x = pos.x;
        this.y = pos.y;
        return true;
    }

    input(chars) {
        for (const c of chars) {
            const pos = { x: this.x, y: this.y };
            if (c === '\b') {
                const removed = this._removeChar();
                if (removed === null) { continue; }
                this._addTimeMachine(REMOVE, pos, removed);
                continue;
            }

            this._addChar(c);
            this._addTimeMachine(ADD, pos, c);
        }
    }

    undo() {
        if (this.timeMachineIdx === 0) { return; }
        const params = this.timeMachine[this.timeMachineIdx - 1];
        const { status, afterPos, char } = params;

        this.timeMachineIdx--;
        this.x = afterPos.x;
        this.y = afterPos.y;

        if (status === ADD) { this._removeChar(); }
        if (status === REMOVE) { this._addChar(char); }
    }

    redo() {
        if (this.timeMachineIdx === this.timeMachine.length) { return; }

        const params = this.timeMachine[this.timeMachineIdx];
        const { status, prevPos, char } = params;

        this.timeMachineIdx++;
        this.x = prevPos.x;
        this.y = prevPos.y;

        if (status === ADD) { this._addChar(char); }
        if (status === REMOVE) { this._removeChar(); }
    }

    _addTimeMachine(status, prevPos, char) {
        const afterPos = { x: this.x, y: this.y };
        this.timeMachine.splice(this.timeMachineIdx);
        this.timeMachine.push({ status, prevPos, afterPos, char });
        this.timeMachineIdx = this.timeMachine.length;
    }

    _removeChar() {
        const l = this.lines[this.x];

        if (this.y === 0) {
            if (this.x === 0) { return null; }

            const pl = this.lines[this.x - 1];
            this.y = pl.length;
            this.lines.splice(this.x, 1);
            this.x--;
            this.lines[this.x] = pl + l;
            return '\n';
        }

        const removed = l[this.y - 1];
        this.lines[this.x] = l.slice(0, this.y - 1) + l.slice(this.y);
        this.y--;
        return removed;
    }

    _addChar(c) {
        if (c === '\n') {
            const l = this.lines[this.x];
            const l1 = l.substring(0, this.y);
            const l2 = l.substring(this.y);
            this.lines[this.x] = l1;
            this.x++;
            this.y = 0;
            this.lines.splice(this.x, 0, l2);
            return;
        }

        const l = this.lines[this.x];
        this.lines[this.x] = l.slice(0, this.y) + c +
            l.slice(this.y);
        this.y++;
    }
}

module.exports = File;
