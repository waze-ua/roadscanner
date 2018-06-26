Road Scanner
============

Javascript server for sending road reports from Waze to servicing companies.

Steps to run server:

1) Download and unpack files.
1) `npm install`.
1) `mkdir -p templates && cp examples/*.tpl templates`
1) `cp examples/config.js ./`
1) Modify `config.js` and `templates/*.tpl` as you need.
1) Run server with `./serve`.

NOTE: Hold and modify all your email templates in directory `templates`.

If something is going wrong, run `DEBUG=* ./serve` and check error messages.