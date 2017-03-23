var express = require('express');
var app = express();
var path = require("path");
var starter = require('./startGame.js');
var port = 8000;
var server = require('http').Server(app);
var io = require('socket.io')(server);

var cards = [];
var deck = [];
var stash = [];
var playercards = [];

server.listen(port);

//get page from index.html
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});
//make css reachable
app.get('/style.css', function (req, res) {
    res.sendFile(path.join(__dirname+'/style.css'));
});
//make js reachable
app.get('/script.js', function (req, res) {
    res.sendFile(path.join(__dirname+'/script.js'));
});
//make start css reachable
app.get('/startstyle.css', function (req, res) {
    res.sendFile(path.join(__dirname+'/startstyle.css'));
});
//make start.html reachable
app.get('/start.html', function (req, res) {
    res.sendFile(path.join(__dirname+'/start.html'));
});
//make img directory reachable
app.use('/img', express.static('img'));




io.on('connection', function (socket) {

    socket.on('player', function (data) {
        var pattern = /[^\w+]/g;
        if(data.match(pattern) == null && data != "") {
            var randomlyGeneratedUID = Math.random().toString(36).substring(3,16) + +new Date;
            playercards[playercards.length]={'name': data, 'uid': randomlyGeneratedUID, 'socket': socket, 'cards': []};
            socket.emit('canConnect', randomlyGeneratedUID);
            /*
            socket.on('legop', function (data) {
                console.log(data);
                socket.emit('magopleggen', data);
            });
            */
        }
    });

    socket.on('tryReconnect', function(data){
        for(var i = 0; i < playercards.length; i++){
            if(playercards[i].uid == data){
                playercards[i].socket = socket;
                socket.emit('canReconnect',playercards[i].name);
                return;
            }
        }
        socket.emit('entername');
    });

    socket.on('GameStarted', function() {
        //check aantal spelers
        //...

        //nieuw Deck aanmaken
        fillCardArray();

        //Kaarten schudden
        cards = shuffle(cards);

        //kaarten verdelen
        distributeCards();

        socket.emit('stash', stash);
        // socket.emit('ownCards', playercards[0]);
    });
});

function distributeCards () {
    var cardsPos = 0;
    var handSize = 7;

    // kaarten verdelen onder spelers
    for (var i = 0; i < playercards.length; i++) {
        for (var c = cardsPos; c < (i+1)*handSize; c++) {
            playercards[i]['cards'][playercards[i]['cards'].length] = cards[c];
            console.log(cards[c]);
        }
        cardsPos += handSize;
    }

    //overige kaarten naar afpakstapel
    for (var i = cardsPos; i < cards.length-1; i++) {
        deck[deck.length] = cards[i];
    }

    //laatste kaart naar de opgooistapel
    stash[0] = cards[cards.length-1];
}


function fillCardArray() {
    var cs = ['2','3','4','5','6','7','8','9','10','J','Q','K','A']; //boer(J), vrouw(Q), heer(K), aas(A)
    var ts = ['H','D','C','S']; //Kaarttypes harten(H), ruiten(D), schoppen(C), klaver(S)
    for (var i=0; i < cs.length; i++) {
        for (var i2=0; i2<ts.length; i2++) {
            cards[cards.length] = {'card': cs[i], 'type': ts[i2]};
        }
    }
    cards[cards.length] = {'card': 'Joker', 'type': '1'};
    cards[cards.length] = {'card': 'Joker', 'type': '2'};
}

function shuffle(cards) {
    var currentIndex = cards.length, temporaryValue, randomIndex;

    while (0 != currentIndex) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        temporaryValue = cards[currentIndex];
        cards[currentIndex] = cards[randomIndex];
        cards[randomIndex] = temporaryValue;
    }

    return cards;
}
