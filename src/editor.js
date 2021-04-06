const File = require('./file');
const View = require('./view');

class Editor {
    constructor(params = { }) {
        const { file, x, y, width, height, offset } = params;
        this.file = file;
        this.view = new View({ file, x, y, width, height, offset });
    }

    goto(pos) {
        this.file.goto(pos);
        this.view.goto(pos);
    }
}

module.exports = Editor;
