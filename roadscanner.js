// Make top dir accessible across the project
global.__appdir = __dirname;

const scanner = require('./src/scanner');
const http = require('./src/http');

http.serve();