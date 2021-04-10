const View = require('./view');

const mode = { navigate: 0, insert: 1, select: 2 };

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

    move(pos) {
        const c = this.view.position();
        this.goto({ x: c.x + pos.x, y: c.y + pos.y });
    }

    goto(pos) {
        this.file.goto(pos);
        this.view.goto(pos);
    }

    resize(height, width) {
        this.view.resize(height, width);
    }

    render() { return this.view.renderArray(); }
}

Editor.mode = mode;

module.exports = Editor;
