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
                    var player = {'name': data, 'uid': uid, 'socket': socket, 'cards': []};
                    players.push(player);
                    socket.emit('canConnect', uid);
                }
            }
            else
                socket.emit("roomFull");
        }
    });

    socket.on('tryReconnect', function(uid){
        for(var i = 0; i < players.length; i++){
            if(players[i].uid == uid){
                players[i].socket = socket;
                //Als speler al in een spel was, laat kaarten weer zien.
                update();

                return;
            }
        }
        socket.emit('entername');
    });

    socket.on('tryStart', function() {
        //check aantal spelers en of het spel nog niet gestart is
        //...
        if (players.length>0 && cards.length===0) {
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

    socket.on('legop', function (card) {
       if (!card.includes('Joker')) {
           var c = card[0];
           var t = card[1];
           var topstash = stash[stash.length-1];
           //Kijk of kaart of type overeenkomt. Joker mag overal op.
           if (c===topstash.card || t===topstash.type || topstash.card==='Joker') {
               legop(socket,c,t);
           }
       }
       else {
           legop(socket,'Joker',card[card.length-1]);
       }
    });
});

function legop(socket,c,t) {
    var player = getPlayer(socket.id);

    //Controleer of de speler deze kaart wel degelijk heeft en niet manipuleert.
    for (var i=0; i<player.cards.length; i++) {
        if (player.cards[i].card===c && player.cards[i].type===t) {
            //leg op aflegstapel
            stash[stash.length]=player.cards[i];
            //Verwijder kaart van spelerskaarten
            player.cards.splice(i,1);
            socket.emit('magopleggen',c+t);
            update();
        }
    }
}

function getPlayer(socketid) {
    for (var i = 0; i<players.length; i++) {
        if (players[i].socket.id===socketid) {
            return players[i];
        }
    }
}

function update() {
    //Stuur spelinfo naar alle spelers
    for (var i=0; i<players.length; i++) {
        var player = players[i];

        if (cards.length>0) {
            var playerlist = getPlayerList(player);
            var game = {'playercards':player.cards, 'topstash': stash[stash.length-1], 'playersinfo': playerlist};
            player.socket.emit('update', game);
        }
        else {
            player.socket.emit('playerConnect',getPlayerList(player));
        }
    }
}

function getPlayerList(player) {
    var playerlist = [];
    for (var i2=0; i2<players.length; i2++) {
        var name = players[i2].name;
        if (players[i2]===player) {
            name += ' (Jij)';
        }
        playerlist.push({'name': name, 'cardcount': players[i2].cards.length });
    }
    return playerlist;
}

function distributeCards () {
    var cardsPos = 0;
    var handSize = 7;

    // kaarten verdelen onder spelers
    for (var i = 0; i < players.length; i++) {
        for (var c = cardsPos; c < (i+1)*handSize; c++) {
            players[i]['cards'].push(cards[c]);
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
