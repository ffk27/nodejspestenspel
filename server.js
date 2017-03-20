var express = require('express');
var app = express();
var path    = require("path");
var port = 8000;

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname+'/index.html'));
});

app.listen(port, function () {
    console.log('Pesten app luistert op port ' + port);
});