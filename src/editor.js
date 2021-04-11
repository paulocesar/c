const View = require('./view');

const mode = { navigate: 0, insert: 1, select: 2 };
const modeById = { };

for (let [ name, id ] of Object.entries(mode)) {
    modeById[id] = name;
}

class Editor {
    constructor(params = { }) {
        const {
            file,
            x, y, width, height, offset,
            hidePreColumn, hideFileInfo
        } = params;
        this.mode = mode.navigate;
        this.file = file;
        this.view = new View({
            file,
            x, y, width, height, offset,
            hidePreColumn, hideFileInfo
        });
        this._lastY = 0;
    }

    setFocus() { this.view.isFocused = true; }

    removeFocus() { this.view.isFocused = false; }

    getModeName() { return modeById[this.mode]; }

    move(pos) {
        const c = this.view.position();
        const newX = c.x + pos.x;
        let newY = pos.y ? c.y + pos.y : this._lastY;
        const canMove = this.goto({ x: newX, y: newY });

        if (canMove) {
            if (pos.y) { this._lastY = newY; }
            return;
        }

        if (pos.y) { return; }

        newY = this.file.lineSize(newX);
        this.goto({ x: newX, y: newY });
    }

    goto(pos) {
        this.file.goto(pos);
        return this.view.goto(pos);
    }

    input(chars) {
        this.file.input(chars);
        this._lastY = this.file.position().y;
        this.view.goto(this.file.position());
    }

    resize(height, width) {
        this.view.resize(height, width);
    }

    render() { return this.view.renderArray(); }
}

Editor.mode = mode;
Editor.modeById = modeById;

module.exports = Editor;
