const fs = require('fs');
const path = require('path');
const readline = require('readline');
const catalog = require('./catalog');
const { timeMachineStatus, fileMode } = require('./constants');
const mode = fileMode;

const fileCatalog = { };

class File {
    constructor(filepath) {
        this.filepath = filepath;

        this._mode = mode.input;

        this._x = 0;
        this._y = 0;

        this._sx = 0;
        this._sy = 0;

        this.lines = [ '' ];

        this.timeMachine = [ ];
        this.timeMachineIdx = 0;

        this.modifiers = catalog.modifiers.file
            .filter((m) => m.canUse(this)).reverse();
    }

    toText() { return this.lines.join('\n'); }

    setMode(m) {
        if (!Object.values(mode).includes(m)) {
            throw new Error(`invalid file mode ${m}`);
        }
        this._mode = m;
    }

    async open(filename) {
        const filepath = path.resolve(filename);

        const existing = fileCatalog[filepath];
        if (existing) { return existing; }

        const f = new File(filepath);
        await f.load();
        return f;
    }

    async load() {
        this.lines = [ ];
        this.timeMachine = [ ];
        this.timeMachineIdx = 0;

        if (!fs.existsSync(this.filepath)) {
            this.lines = [ '' ];
            return;
        }

        const rl = readline.createInterface({
            input: fs.createReadStream(this.filepath),
            crlfDelay: Infinity
        });

        for await (const line of rl) {
            this.lines.push(line);
        }
    }

    debug() {
        console.log(this.position());
        console.log(this.lines);
        console.log({
            timeMachineIdx: this.timeMachineIdx,
            timeMachine: this.timeMachine
        });
    }

    lineSize(x) {
        return (this.lines[x] && this.lines[x].length) || 0;
    }

    goto(pos) {
        if (pos.x < 0 || pos.x > this.lines.length - 1) {
            return false;
        }

        if (pos.y < 0 || pos.y > this.lines[pos.x].length) {
            return false;
        }

        if (this._mode === mode.select) {
            this._setSelectPosition(pos);
            return true;
        }

        this._setPosition(pos);
        return true;
    }

    position() {
        return { x: this._x, y: this._y, sx: this._sx, sy: this._sy };
    }

    _setPosition(pos) {
        this._x = this._sx = pos.x;
        this._y = this._sy = pos.y;
    }

    _setSelectPosition(pos) {
        this._sx = pos.x;
        this._sy = pos.y;
    }

    input(chars) {
        if (this._mode !== mode.input) { return; }

        chars = this.applyModifieds(chars);

        for (const c of chars) {
            const pos = this.position();
            if (c === '\b') {
                const removed = this._removeChar();
                if (removed === null) { continue; }
                this._addTimeMachine(timeMachineStatus.remove, pos, removed);
                continue;
            }

            this._addChar(c);
            this._addTimeMachine(timeMachineStatus.add, pos, c);
        }
    }

    applyModifieds(chars) {
        for (const modifier of this.modifiers) {
            modifier.beforeProcess(this, chars);
        }

        for (const modifier of this.modifiers) {
            chars = modifier.process(this, chars);
        }
        return chars;
    }

    selectionArea() {
        const p = this.position();
        let begin = { x: p.x, y: p.y };
        let end = { x: p.sx, y: p.sy };

        const mustInvert = begin.x > end.x || (begin.x === end.x &&
            begin.y > end.y);

        if (mustInvert) {
            const t = begin;
            begin = end;
            end = t;
        }

        return { begin, end };
    }

    selection() {
        const p = this.position();
        if (p.x === p.sx && p.y === p.sy) { return ''; }

        const { begin, end } = this.selectionArea();

        let buffer = '';

        for (let x = begin.x; x <= end.x; x++) {
            const l = this.lines[x];
            let startY = x === begin.x ? begin.y : 0;
            let endY = x === end.x ? end.y : l.length - 1;
            buffer += l.substring(startY, endY + 1);
            if (x !== end.x) { buffer += '\n'; }
        }

        return buffer;
    }

    undo() {
        if (this.timeMachineIdx === 0) { return; }
        const params = this.timeMachine[this.timeMachineIdx - 1];
        const { status, afterPos, char } = params;

        this.timeMachineIdx--;
        this._setPosition(afterPos);

        if (status === timeMachineStatus.add) { this._removeChar(); }
        if (status === timeMachineStatus.remove) { this._addChar(char); }
    }

    redo() {
        if (this.timeMachineIdx === this.timeMachine.length) { return; }

        const params = this.timeMachine[this.timeMachineIdx];
        const { status, prevPos, char } = params;

        this.timeMachineIdx++;
        this._setPosition(prevPos);

        if (status === timeMachineStatus.add) { this._addChar(char); }
        if (status === timeMachineStatus.remove) { this._removeChar(); }
    }

    _addTimeMachine(status, prevPos, char) {
        const afterPos = this.position();
        this.timeMachine.splice(this.timeMachineIdx);
        this.timeMachine.push({ status, prevPos, afterPos, char });
        this.timeMachineIdx = this.timeMachine.length;
    }

    _removeChar() {
        const p = this.position();
        const l = this.lines[p.x];

        if (p.y === 0) {
            if (p.x === 0) { return null; }

            const pl = this.lines[p.x - 1];

            p.y = pl.length;
            this.lines.splice(p.x, 1);
            p.x--;
            this.lines[p.x] = pl + l;

            this._setPosition(p);

            return '\n';
        }

        const removed = l[p.y - 1];
        this.lines[p.x] = l.slice(0, p.y - 1) + l.slice(p.y);
        p.y--;

        this._setPosition(p);

        return removed;
    }

    _addChar(c) {
        const p = this.position();

        if (c === '\n') {
            const l = this.lines[p.x];
            const l1 = l.substring(0, p.y);
            const l2 = l.substring(p.y);
            this.lines[p.x] = l1;
            p.x++;
            p.y = 0;
            this.lines.splice(p.x, 0, l2);
            this._setPosition(p);
            return;
        }

        const l = this.lines[p.x];
        this.lines[p.x] = l.slice(0, p.y) + c +
            l.slice(p.y);
        p.y++;

        this._setPosition(p);
    }

    getNearWords(pos) {
        const d = this.getNearLines(pos);

        let curr = d.curr && d.curr.words[d.curr.wordId];
        let prev = d.curr && d.curr.words[d.curr.wordId - 1];
        let next = d.curr && d.curr.words[d.curr.wordId + 1];

        if (!prev) {
            prev = d.prev && d.prev.words[d.prev.words.length - 1];
        }

        if (!next) { next = d.next && d.next.words[0]; }

        return { prev, curr, next };
    }

    getNearLines(pos) {
        const indexes = this.getNearLineIndexes(pos.x);

        const prev = this.lineToWords({ x: indexes.prev, y: 0 });
        const curr = this.lineToWords(pos);
        const next = this.lineToWords({ x: indexes.next, y: 0 });

        return { prev, curr, next };
    }

    getNearLineIndexes(x) {
        const indexes = { prev: null, next: null };

        let idxPrev = x - 1;
        let idxNext = x + 1;

        while (1) {
            if (indexes.prev === null && this.lines[idxPrev]) {
                indexes.prev = idxPrev;
            }

            if (indexes.next === null && this.lines[idxNext]) {
                indexes.next = idxNext;
            }

            if (indexes.prev === null) { idxPrev--; }
            if (indexes.next === null) { idxNext++; }

            const isDone = (idxPrev < 0 || indexes.prev !== null) &&
                (idxNext >= this.lines.length || indexes.next !== null);

            if (isDone) { return indexes; }
        }
    }

    lineToWords(pos) {
        const line = this.lines[pos.x];

        if (!line) { return null; }

        const words = [ ];
        const rgxWord = /[\w]/;
        const rgxWhitespace = /[\s]/;
        let word = null;
        let wordId = 0;

        for (const prop in line) {
            const idx = Number(prop);
            const c = line[idx];

            if (word && rgxWord.test(c)) {
                word.end = idx;
                word.text += c;
            } else {
                word = null;

                if (!rgxWhitespace.test(c) && !word) {
                    word = { x: pos.x, begin: idx, end: idx, text: c };
                    words.push(word);
                    if (!rgxWord.test(c)) { word = null; }
                }
            }

            if (idx === pos.y) {
                wordId = Math.max(0, words.length - 1);
            }
        }

        if (pos.y > line.length) {
            wordId = Math.max(words.length - 1, 0);
        }

        return { lineId: pos.x, wordId, words };
    }

    find(term, insensitive = false) {
        const rgx = new RegExp(term, `${insensitive ? 'i' : ''}g`);
        const results = [ ];
        for (const x in this.lines) {
            const l = this.lines[x];
            if (!l) { continue; }

            let res = null;
            while(res = rgx.exec(l)) {
                results.push({
                    begin: { x, y: res.index },
                    end: { x, y: res.index + (res[0].length - 1) },
                    text: res[0]
                });
            }
        }
        return results;
    }

    replace(find, replacement) {
        for(const f of [].concat(find)) {
            const x = f.end.x;
            const y = f.end.y + 1;
            const len = f.text.length;
            this.goto({ x, y });

            const input = `${'\b'.repeat(len)}${replacement}`;
            this.input(input);
        }
    }
}

File.timeMachineStatus = timeMachineStatus;
File.mode = mode;

module.exports = File;
