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
    var cs = ['0','1','2','3','4','5','6','7','8','9','10','J','Q','K','A']; //boer(J), vrouw(Q), heer(K), aas(A)
    var ts = ['H','D','C','S']; //Kaarttypes harten(H), ruiten(D), schoppen(C), klaver(s)
    for (var i=0; i < cs.length; i++) {
        for (var i2=0; i2<ts.length; i2++) {
            cards[cards.length] = {'card': cs[i], 'type': ts[i2]};
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
