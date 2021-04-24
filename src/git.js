const os = require('os');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const webUrl = 'https://github.com';
const apiUrl = 'https://api.github.com';
const tokenFile = path.resolve(os.homedir(), '.github.token');
const token = fs.readFileSync(tokenFile, 'utf8').replace(/\s+/g, '');

const apiConfig = {
    baseURL: apiUrl,
    headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json'
    }
};

const git = axios.create(apiConfig);

Object.assign(git, { webUrl, apiUrl });

module.exports = git;

