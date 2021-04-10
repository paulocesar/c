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
    }

    getModeName() { return modeById[this.mode]; }

    move(pos) {
        const c = this.view.position();
        this.goto({ x: c.x + pos.x, y: c.y + pos.y });
    }

    goto(pos) {
        this.file.goto(pos);
        this.view.goto(pos);
    }

    input(chars) {
        this.file.input(chars);
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
