const express = require('express');
const session = require('express-session');
const TingoStore = require('./connect-tingodb')(session);

const store = new TingoStore({path: __appdir + '/sessions.db'});
const app = express();

app.use(session({secret: 'B1Gs3cR3TcOd3', store: store}));
app.use('/satic', express.static('static'));
app.get('/', main);

exports.serve = () => app.listen(8080);