var express = require('express');
var app = express();
var path    = require("path");
var port = 8000;
var server = require('http').Server(app);
var io = require('socket.io')(server);

server.listen(port);

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function (socket) {
    socket.emit('news', { hello: 'world' });
    socket.on('my other event', function (data) {
        console.log(data);
    });
});

app.get('/style.css', function (req, res) {
    res.sendFile(path.join(__dirname+'/style.css'));
});


var cards = [];

function fillCardArray() {
    for (var i = 2; i < 15; i++) {
        var c = '' + i;
        if (i > 10) {
            switch (i) {
                case 11:
                    c = 'J';
                    break;
                case 12:
                    c = 'Q';
                    break;
                case 13:
                    c = 'K';
                    break;
                case 14:
                    c = 'A';
                    break;
            }
        }

        for (var i2 = 0; i2 < 4; i2++) {
            var type = '';
            switch (i2) {
                case 0:
                    type = 'H';
                    break;
                case 1:
                    type = 'D';
                    break;
                case 2:
                    type = 'C';
                    break;
                case 3:
                    type = 'S';
                    break;
            }
            var card = [c + type];
            card["type"] = type;
            card["c"] = c;
            cards[cards.length] = card;
        }
    }

    cards[cards.length] = 'Joker1';
    cards[cards.length] = 'Joker2';

    console.log(cards);
}

function shuffle() {
    var currentIndex = cards.length, temporaryValue, randomIndex;

    while (0 != currentIndex) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        temporaryValue = cards[currentIndex];
        cards[currentIndex] = cards[randomIndex];
        cards[randomIndex] = temporaryValue;
    }
    console.log(cards);
}

fillCardArray();
shuffle();
