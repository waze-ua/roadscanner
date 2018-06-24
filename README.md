Road Scanner
============

NodeJS server for sending road reports alerts from Waze to servicing companies.

Steps to run server:

1) Download and unpack files.
1) Run `npm install`.
1) Create `config.js` and `message.tpl` files from `*.examples.*`.
1) Modify `config.js` and `message.tpl` for your purposes.
1) Execute `./serve`.

If something is going wrong, run `DEBUG=* ./serve` and check error messages.