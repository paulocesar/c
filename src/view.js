const ansi = require('./ansi-escape-codes');

class View {
    constructor(params) {
        this.file = params.file;
        this.width = params.width;
        this.height = params.height;
        this.offset = params.offset || 0;
        this.hidePreColumn = params.hidePreColumn || false;
        this.hideFileInfo = params.hideFileInfo || false;

        this.validate();

        this._x = params.x || 0;
        this._y = params.y || 0;
        this._beginX = 0;
        this._beginY = 0;
        this._endX = this.getTextHeight() - 1;
        this._endY = this.getTextWidth() - 1;

        this.computePosition();
    }

    getTextHeight() {
        return this.height - this.fileInfoLength();
    }

    getTextWidth() {
        return this.width - this.preColumnLength();
    }

    resize(height, width) {
        const ox = this._endX - this._beginX;
        const oy = this._endY - this._beginY;
        this._endX += (this.getTextHeight() - ox);
        this._endY += (this.getTextWidth() - oy);
        this.height = height;
        this.width = width;
        this.computePosition();
    }

    validate() {
        if (!this.file) { throw new Error('missing a file'); }

        if (!this.width || this.width < 1) {
            throw new Error(`Bad width '${this.width}'`);
        }

        if (!this.height || this.height < 1) {
            throw new Error(`Bad height '${this.height}'`);
        }
    }

    goto(pos) {
        if (pos.x < 0 || pos.x > this.file.lines.length - 1) {
            return false;
        }

        if (pos.y < 0 || pos.y > this.file.lines[pos.x].length) {
            return false;
        }

        this._setPosition(pos);
        this.computePosition();
        return true;
    }

    _setPosition(pos) {
        this._x = pos.x;
        this._y = pos.y;
    }

    position() {
        return {
            x: this._x, y: this._y,
            begin: { x: this._beginX, y: this._beginY },
            end: { x: this._endX, y: this._endY }
        };
    }

    debug() {
        const view = this.render();
        console.log({
            file: this.file.filepath,
            width: this.width,
            height: this.height,
            offset: this.offset,
            position: this.position(),
            view
        })

        const w = (this.width - 2) + this.preColumnLength();
        const split = '#'.repeat(w);
        console.log(split);
        console.log(view);
        console.log(split);
    }

    isCursorInView() {
        const preCol = this.preColumnLength();

        return this._x > (this._beginX + this.offset) &&
            this._x < (this._endX - this.offset) &&
            this._y > this._beginY &&
            this._y < this._endY;
    }

    computePosition() {
        if (this.isCursorInView()) { return; }

        if (this._x < 0 || this._y < 0) {
            throw new Error(`Bad pos x: ${this._x}, y: ${this._y}`);
        }

        let endX = this._endX - this.offset;
        const height = this.getTextHeight();
        if (this._x > endX) {
            const ox = (this._x - endX);
            this._beginX += ox;
            this._endX += ox;
            if (this._endX > this.file.lines.length - 1) {
                this._endX = this.file.lines.length - 1;
                this._beginX = this._endX - height;
            }
        }

        let beginX = this._beginX + this.offset;
        if (this._x < beginX) {
            const ox = (this._x - beginX);
            this._beginX += ox;
            this._endX += ox;
        }

        if (this._beginX < 0) {
            this._beginX = 0;
            this._endX = height - 1;
        }

        const line = this.file.lines[this._x];
        const width = this.getTextWidth();
        if (!line) {
            this._beginY = 0;
            this._endY = width - 1;
            return;
        }

        if (this._y > this._endY) {
            const oy = (this._y - this._endY);
            this._beginY += oy;
            this._endY += oy;
            if (this._endY > line.length - 1) {
                this._endY = line.length - 1;
                this._beginY = this._endY - width;
            }
        }

        if (this._y < this._beginY) {
            const oy = (this._y - this._beginY);
            this._beginX += oy;
            this._endY += oy;
        }

        if (this._beginY < 0) {
            this._beginY = 0;
            this._endY = width - 1;
        }
    }

    fileInfoLength() {
        return this.hideFileInfo ? 0 : 1;
    }

    preColumnLength() {
        if (this.hidePreColumn) { return 0; }
        const maxX = this.file.lines.length;
        const preCol = String(maxX).length + 1;
        return preCol < (this.width + 4) ? preCol : 0;
    }

    renderArray() {
        const preCol = this.preColumnLength();
        const lines = [ ];

        for (let x = this._beginX; x <= this._endX; x++) {
            let line = preCol ? `${' '.repeat(preCol)}${x} `
                .slice(-1 * preCol) : '';

            line = `${ansi.settings.lineCount}${line}${ansi.reset}`;

            const fl = this.file.lines[x];
            if (fl === undefined) {
                line += '~';
                lines.push(line);
                continue;
            }

            for (let y = this._beginY; y <= this._endY; y++) {
                line += this.applyModifieds(x, y, fl[y] || ' ');
            }

            lines.push(line);
        }

        if (!this.hideFileInfo) {
            let line = ansi.settings.fileInfo;
            const filename = ` ${this.file.filepath.split('/').pop() || '~'}`;
            for (let y = 0; y < this.width; y++) {
                line += filename[y] || ' ';
            }
            line += ansi.reset;
            lines.push(line);
        }
        return lines;
    }

    applyModifieds(x, y, char) {
        let prefix = '';
        let suffix = '';

        if (y === 80) {
            prefix = ansi.settings.line80;
            suffix = ansi.reset;
        }

        if (this._x === x && this._y === y) {
            prefix = ansi.settings.cursor;
            suffix = ansi.reset;
        }

        return `${prefix}${char}${suffix}`;
    }

    render() {
        return this.renderArray().join('\n');
    }
}

module.exports = View;
