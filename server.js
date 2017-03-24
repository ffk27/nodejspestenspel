var express = require('express');
var app = express();
var path = require("path");
var port = 8000;
var server = require('http').Server(app);
var io = require('socket.io')(server);

var cards = [];
var deck = [];
var stash = [];
var players = [];

server.listen(port);

//Link HTML pages
app.get('/', function(req,res){res.sendFile(__dirname + '/start.html');});
app.get('/game', function(req,res){res.sendFile(path.join(__dirname+'/index.html'));});
//Link CSS files
app.get('/style.css', function(req,res){res.sendFile(path.join(__dirname+'/style.css'));});
app.get('/game.css', function(req,res){res.sendFile(path.join(__dirname+'/game.css'));});
app.get('/startscreen.css', function(req,res){res.sendFile(path.join(__dirname+'/startscreen.css'));});
//Link JS files
app.get('/script.js', function(req,res){res.sendFile(path.join(__dirname+'/script.js'));});
//Link Images
app.use('/img', express.static('img'));

io.on('connection', function (socket) {
    socket.on('player', function (data) {
        var pattern = /[^\w+]/g;
        if(data.match(pattern) == null && data != "") {
            if(players.length < 4) {
                if(deck.length > 0)
                    socket.emit("gameStarted");
                else {
                    var uid = Math.random().toString(22);
                    players.push({'name': data, 'uid': uid, 'socket': socket, 'cards': []});
                    socket.emit('canConnect', uid);
                }
            }
            else
                socket.emit("roomFull");
        }
    });

    socket.on('tryReconnect', function(data){
        for(var i = 0; i < players.length; i++){
            if(players[i].uid == data){
                players[i].socket = socket;
                socket.emit('canReconnect',players[i].name);
                //Als speler al in een spel was, laat kaarten weer zien.
                if (cards.length>0) {
                    update();
                }
                return;
            }
        }
        socket.emit('entername');
    });

    socket.on('tryStart', function() {
        //check aantal spelers en of het spel nog niet gestart is
        //...
        if (players.length>1 && cards.length==0) {
            //nieuw Deck aanmaken
            fillCardArray();

            //Kaarten schudden
            cards = shuffle(cards);

            //kaarten verdelen
            distributeCards();

            for (var i=0; i<players.length; i++) {
                var player = players[i];
                player.socket.emit('gameStart');
                update();
            }
        }
    });
});

function update() {
    //Stuur spelinfo naar alles spelers
    for (var i=0; i<players.length; i++) {
        var player = players[i];
        var otherplayerinfo = [];
        for (var i2=0; i2<players.length; i2++) {
            if (players[i2].uid !== player.uid) {
                console.log( players[i2]);
                otherplayerinfo.push({'name': players[i2].name, 'cardcount': players[i2].cards.length });
            }
        }
        var game = {'playercards':player.cards, 'topstash': stash[stash.length-1], 'otherplayerinfo': otherplayerinfo};
        player.socket.emit('update', game);
    }
}

function distributeCards () {
    var cardsPos = 0;
    var handSize = 7;

    // kaarten verdelen onder spelers
    for (var i = 0; i < players.length; i++) {
        for (var c = cardsPos; c < (i+1)*handSize; c++) {
            players[i]['cards'].push(cards[c]);
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
            cards.push({'card': cs[i], 'type': ts[i2]});
        }
    }
    cards.push({'card': 'Joker', 'type': '1'});
    cards.push({'card': 'Joker', 'type': '2'});
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
