/*
UNIQSTORE

Module for storing unique strings
For performance reasons storage is organized as static tree.

Example:
    const store = require('uniqstore');
    store.load('storage.dat');
    store.put('1f500a4346a138f19762c5225042ebc2');
    store.has('1f500a4346a138f19762c5225042ebc2')
    store.save('storage.dat');

Resulting storage tree:
    { '1f':
        {'50':
            {'0a':
                ['4346a138f19762c5225042ebc2']
            }
        }
    }

This helps find items in cache very effectively.
*/

const fs = require('fs');
const dbg = require('debug')('uniqstore');

exports.create = (cfg) => {
    const ctx = {
        file: 'storage.dat',
        modified: false,
        data: {},
        load: () => {
            if (!fs.existsSync(ctx.file))
                ctx.data = {};
            else
                ctx.data = JSON.parse(fs.readFileSync(ctx.file, {encoding: 'utf-8'}));

            ctx.modified = false;
        },
        save: () => {
            if (!ctx.modified)
                return;

            dbg('writing cache to disk');
            fs.writeFileSync(ctx.file, JSON.stringify(ctx.data));
            ctx.modified = false;
        },
        put: (str) => {
            let d = ctx.data;
            const path = makepath(str);

            // Follow by path and put everything in cache
            path.forEach((el, i) => {
                if (i < path.length - 1) { // not a leaf element
                    if(d[el] === undefined) {
                        d[el] = i < path.length - 2 ? {} : [];
                        ctx.modified = true;
                    }

                    d = d[el];
                } else { // leaf element
                    if (d.indexOf(el) != -1)
                        return; // alredy cached

                    d.push(el);
                    ctx.modified = true;
                }
            });
        },
        miss: (str) => !ctx.has(str),
        has: (str) => {
            let d = ctx.data;
            const path = makepath(str);

            return path.every((el, i) => {
                let res = false;
                if(i < path.length - 1) { // not leaf
                    res = d[el] !== undefined;
                    d = d[el]; // go deep
                } else { // leaf
                    res = d.indexOf(el) != -1;
                }
                return res;
            });
        }
    };

    // merge config with context
    for (let i in cfg)
        ctx[i] = (typeof(cfg[i])) ? cfg[i] : ctx[i];

    return ctx;
};

function makepath(v) {
    return [
        v.substring(0, 2),
        v.substring(2, 4),
        v.substring(4, 6),
        v.substring(6)
    ];
}
