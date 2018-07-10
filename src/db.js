const tingodb = require('tingodb')();

const db = new tingodb.Db(__appdir + '/roadscanner.db', {});

exports.config = db.collection('config');
exports.data = db.collection('data');