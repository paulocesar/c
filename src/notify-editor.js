const fs = require('fs');
const path = require('path');
const File = require('./file');
const Editor = require('./editor');
const git = require('./git');

const file = path.resolve(__dirname, '..', 'tmp', 'notifications.txt');
let localNotifications = [ ];

function readLocalNotifications() {
    localNotifications = JSON.parse(fs.readFileSync(file, 'utf8'));
}

function saveLocalNotifications() {
    fs.writeFileSync(file, JSON.stringify(localNotifications), 'utf8');
}

function mergeNotifications(newNotifications) {
    if (!newNotifications.length) { return; }

    const missingNotifications = [ ];
    for (const n of localNotifications) {
        if (!newNotifications.find((l) => l.id === n.id)) {
            missingNotifications.push(n);
        }
    }

    localNotifications = missingNotifications.concat(newNotifications);
}

async function getNotifications(query = '') {
    const { data } = await git.get(`notifications?${query}`);
    const notifications = [ ];

    for (const d of data) {
        const n = Object.assign({ }, d.subject);
        n.id = d.id;
        n.repository = d.repository.name;
        n.lastComment = '';
        n.url = n.url.replace(`${git.apiUrl}/repos`, git.webUrl);

        if (n.latest_comment_url) {
            const c = await git.get(n.latest_comment_url);
            n.lastComment = `[${c.data.user.login}] - ${c.data.body}`;
        }

        delete n.latest_comment_url;

        notifications.push(n);
    }

    notifications.reverse();

    return notifications;
}

class NotifyEditor extends Editor {
    constructor(params) {
        params.file = new File('');
        super(params);

        readLocalNotifications();
        this.renderNotifications();
    }

    async loadNotifications() {
        readLocalNotifications();
        mergeNotifications(await getNotifications());
        saveLocalNotifications();
        this.renderNotifications();
    }

    async renderNotifications() {
        let lines = [ ];
        for (const n of localNotifications) {
            const data = [ n.title ].concat(
                n.lastComment ? n.lastComment.split('\r\n') :
                '(no comment)');
            lines = lines.concat(data, '', '');
        }
        this.file.lines = lines;
    }

    async process() { }
}

module.exports = NotifyEditor;
