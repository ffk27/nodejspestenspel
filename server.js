var express = require('express');
var app = express();
var path = require("path");
var port = 8000;
var server = require('http').Server(app);
var io = require('socket.io')(server);

var uids = [];
var suits = ['H','D','S','C']; //Kaartkleuren harten(H), ruiten(D), schoppen(S), klaver(C)
var game = { 'cards': [], 'deck': [], 'stash': [], 'players': [], 'clockwise': true, 'turn': null};
var playercount = 0;

server.listen(port);

//Link HTML pages
app.get('/', function(req,res){res.sendFile(__dirname + '/start.html');});
app.get('/game', function(req,res){res.sendFile(path.join(__dirname+'/index.html'));});
app.get('/regels', function(req,res){res.sendFile(path.join(__dirname+'/rules.html'));});
//Link CSS files
app.get('/style.css', function(req,res){res.sendFile(path.join(__dirname+'/style.css'));});
app.get('/game.css', function(req,res){res.sendFile(path.join(__dirname+'/game.css'));});
app.get('/startscreen.css', function(req,res){res.sendFile(path.join(__dirname+'/startscreen.css'));});
app.get('/rulesStyle.css', function(req,res){res.sendFile(path.join(__dirname+'/rulesStyle.css'));});
//Link JS files
app.get('/script.js', function(req,res){res.sendFile(path.join(__dirname+'/script.js'));});
//Link Images
app.use('/img', express.static('img'));
//Retrieve audio files
app.get('/FichtlsLied.mp3', function(req,res){res.sendFile(path.join(__dirname+'/FichtlsLied.mp3'));});
app.get('/biem.mp3', function(req,res){res.sendFile(path.join(__dirname+'/biem.mp3'));});
app.get('/horse.mp3', function(req,res){res.sendFile(path.join(__dirname+'/horse.mp3'));});

//controleer elke 5 seconden of een speler nog verbonden is.
checkPlayers(game);

io.on('connection', function (socket) {
    socket.on('player', function (data) {
        var pattern = /[^\w+]/g;
        if(data.match(pattern) == null && data != "") {
            if(game.players.length < 4) {
                //Als spel al gestart is, mag de speler niet verbinden
                if(game.cards.length > 0)
                    socket.emit("gameStarted");
                else {
                    var uid = Math.random().toString(22);
                    var player = {'name': data, 'uid': uid, 'socket': socket, 'cards': [], 'disconnecton': null, 'pakken': 0, 'gepakt': 0, 'pulledcard': null, 'timer': null };
                    game.players.push(player);
                    socket.emit('canConnect', uid);
                }
            }
            else
                socket.emit("roomFull");
        }
    });

    socket.on('tryReconnect', function(uid){
        for(var i = 0; i < game.players.length; i++){
            if(game.players[i].uid === uid){
                game.players[i].socket = socket;
                game.players[i].disconnecton=null;
                //Als speler al in een spel was, laat kaarten weer zien.
                update(game);

                return;
            }
        }
        socket.emit('entername');
    });

    socket.on('disconnect', function () {
        var player = getPlayer(socket.id);
        if (player !== null) {
            //unixtijd
            player.disconnecton = Date.now();
        }
    });

    socket.on('tryStart', function() {
        //check aantal spelers en of het spel nog niet gestart is
        //...
        if (game.players.length>0 && game.cards.length===0) {
            //nieuw Deck aanmaken
            fillCardArray();

            //Kaarten schudden
            game.cards = shuffleCards(game.cards);

            //kaarten verdelen
            distributeCards();

            //willekeurige speler mag starten
            game.turn = game.players[Math.floor(Math.random() * game.players.length)];
            game.turn.canpull=true;

            for (var i=0; i<game.players.length; i++) {
                var player = game.players[i];
                player.socket.emit('gameStart');
                startTurn();
                update(game);
            }
        }
        else{
            socket.emit("notEnoughPlayers");
        }
    });

    socket.on('pull', function () {
        //Kaart trekken
        var player = getPlayer(socket.id);
        //Controleer of de speler wel aan de beurt is.
        if (game.turn===player && game.turn.canpull) {
            var pulledcard = pullCard(player);
            if (player.pakken-player.gepakt>0) {
                player.gepakt++;
            }
            else {
                player.canpull=false;
                if (pulledcard !== null && kanOpleggen(player, pulledcard)) {
                    //onthoud deze kaart, want alleen deze mag opgegooid worden.
                    player.pulledcard=pulledcard;
                    game.timer = 5;
                }
                else {
                    changeTurn(1);
                }
            }
            update(game);
        }
    });

    socket.on('legop', function (cardstr) {
        var player = getPlayer(socket.id);
        var cardobj = cardStringtoObj(cardstr);
        var card = playerhascard(player,cardobj);
        //Controleer of de speler de kaart wel degelijk heeft.
        if (card !== null) {
            if (kanOpleggen(player, card)) {
                legop(player, card);
            }
        }
    });

    socket.on('chooseSuit', function (suit) {
        var player = getPlayer(socket.id);
        //Kijk of speler wel aan de beurt is.
        if (game.turn===player) {
            if (player.choosesuit===true) {
                //controle tegen manipulatie.
                if (suits.indexOf(suit)!==-1) {
                    player.choosesuit=false;
                    changeTurn(1);
                    game.suit=suit;
                    update(game);
                }
            }
        }
    });
});

function pullCard(player) {
    //Als de trekstapel op is, schut de aflegstapel behalve de bovenste van de aflegstapel, en leg ze op de trekstapel
    if (game.deck.length===0) {
        var newstash = game.stash.splice(game.stash.length-1,1);
        if (game.stash.length>0) {
            game.deck = shuffleCards(game.stash);
            game.stash = newstash;
        }
        else {
            game.stash = newstash;
            return null;
        }
    }
    var pulledcard = game.deck[game.deck.length-1];
    player.cards.push(pulledcard);
    game.deck.splice(game.deck.length-1,1);
    var topstash = game.stash[game.stash.length-1];
    return pulledcard;
}

function broadcastHorse() {
    //Speel bij iedereen paard af.
    io.emit('playHorse');
}

function cardStringtoObj(card) {
    if (!card.includes('Joker')) {
        var c, t;
        if (card.length === 3) { //10S bijvoorbeeld
            c = card[0] + card[1];
            t = card[2];
        }
        else {
            c = card[0];
            t = card[1];
        }
        return {'card': c, 'type': t};
    }
    else {
        return {'card': 'Joker', 'type': card[card.length-1] };
    }
}

function kanOpleggen(player, card) {
    //Controleer of de speler wel aan de beurt is, of hij niet een kleur moet kiezen en of hij geen strafkaarten moet pakken
    //En als een kaart getrokken is mag alleen deze opgegooid worden.
    if (game.turn === player && player.choosesuit !== true && !(player.pakken-player.gepakt)>0 && ((player.pulledcard!==null && player.pulledcard===card) || player.pulledcard===null)) {
        if (player.pulledcard!==null) {
            player.pulledcard=null;
        }
        if (player.cards.length===1 && (card.card==='Joker' || card.card==='2')) {
            //Laatste kaart mag geen Joker of 2 zijn, pak 1 en ga volgende beurt
            pullCard(player);
            changeTurn(1);
            return false;
        }
        var topstash = game.stash[game.stash.length - 1];

        //Kijk of kaart of type overeenkomt. Joker mag overal op.
        if (card.card === 'Joker') {
            return true;
        }
        else if (topstash.card === 'J' && game.suit === card.type) { //overbodig
            return true;
        }
        else if (card.card === topstash.card || card.type === topstash.type || topstash.card === 'Joker') {
            return true;
        }
    }
    else if (player.pakken>0 && player.gepakt===0) {
        if (player.pulledcard!==null) {
            player.pulledcard=null;
        }
        //Als de vorige speler een joker of 2 opgelegd heeft, mag de speler er meteen een joker of 2 achteraan gooien.
        if (card.card === 'Joker' || card.card === '2') {
            return true;
        }
    }
    else {
        if (game.turn===player) {
            console.log(card);
            console.log(player.pakken);
            console.log(player.gepakt);
            console.log(player.pulledcard);
            console.log(game.stash[game.stash.length - 1]);
            console.log(game.suit);
        }
    }
    return false;
}

//Deze funcie controleert of de speler deze kaart wel degelijk heeft en niet manipuleert.
function playerhascard(player,card) {

    for (var i=0; i<player.cards.length; i++) {

        if (player.cards[i].card === card.card && player.cards[i].type === card.type) {
            return player.cards[i];
        }
    }
    return null;
}

function legop(player,card) {
    //leg op aflegstapel
    game.stash[game.stash.length]=card;
    var pakken = game.turn.pakken;
    //Alles gepakt, strafkaarten gaan niet verder
    if (pakken===game.turn.gepakt) {
        pakken=0;
    }
    //Verwijder kaart van spelerskaarten
    player.cards.splice(player.cards.indexOf(card),1);
    if (player.cards.length===0) {
        //Gewonnen
        stopGame();
    }
    else {
        switch (card.card) {
            case 'A':
                //Als de opgelegde kaart een aas was, draai de beurtvolgorde om.
                game.clockwise = !game.clockwise;
                changeTurn(1);
                break;
            case '2':
                game.turn.pakken = 0;
                //pestkaart, 2 pakken voor de volgende
                changeTurn(1);
                game.turn.pakken = pakken + 2;
                break;
            case '7':
                break;
            case '8':
                changeTurn(2);
                break;
            case 'J':
                player.choosesuit = true;
                break;
            case 'Joker':
                game.turn.pakken = 0;
                //pestkaart, 5 pakken voor de volgende
                changeTurn(1);
                game.turn.pakken = pakken + 5;
                break;
            default:
                changeTurn(1);
        }
        player.socket.emit('magopleggen', card.card + card.type);
        game.suit = card.type;
        update(game);
    }
}

function stopGame() {
    clearInterval(game.interval);
    game.timer=null;
    game.cards=[];
    update(game);
}

function changeTurn(num) {
    //Alles gepakt.
    if ((game.turn.pakken>0 && game.turn.pakken-game.turn.gepakt===0) || (game.turn.pakken===0 && game.turn.gepakt!==0)) {
        game.turn.pakken=0;
        game.turn.gepakt=0;
    }
    if (game.players.length>1) {
        var playerindex = game.players.indexOf(game.turn);
        if (!game.clockwise) {
            num = num * -1;
        }
        playerindex = playerindex+num;

        if (playerindex < 0) {
            game.turn=game.players[(game.players.length)+playerindex];
        }
        else if (playerindex > game.players.length -1) {
            game.turn=game.players[playerindex - game.players.length];
        }
        else {
            game.turn=game.players[playerindex];
        }
    }
    //Speler die aan de beurt is, mag een kaart trekken.
    game.turn.canpull=true;
    startTurn();
}

function startTurn() {
    clearInterval(game.interval);

    var timer = 30;
    //Bij pestkaarten krijgt de volgende speler extra tijd om na te denken, dit kan verder uitgewerkt worden in de toekomst.
    if (game.stash[game.stash.length-1].card==='Joker' || game.stash[game.stash.length-1].card==='2') {
        timer=timer*2;
    }
    game.timer=timer;

    game.interval = setInterval(function () {
        game.timer--;
        if (game.timer<0) {
            if (game.pulledcard!==null) {
                game.pulledcard=null;
            }
            if (game.turn.canpull && !game.turn.choosesuit) {
                //Als de tijd om is en de speler heeft nog geen kaart gepakt, pak hem automatisch
                pullCard(game.turn);
                game.turn.canpull=false;
            }
            else if (game.turn.choosesuit) {
                //kleur blijft hetzelfde als de speler treuzelt
                game.turn.choosesuit=false;
            }
            //Als de speler nog pakken moest, maar daarmee treuzelde, pak ze automatisch
            if (game.turn.pakken-game.turn.gepakt>0) {
                var pakken = game.turn.pakken-game.turn.gepakt;
                for (var i=0; i<pakken; i++) {
                    pullCard(game.turn);
                    game.turn.gepakt++;
                }
            }
            clearInterval(game.interval);
            changeTurn(1);
            update(game);
        }
    },1000);

    broadcastHorse();
}

function getPlayer(socketid) {
    for (var i = 0; i<game.players.length; i++) {
        if (game.players[i].socket.id===socketid) {
            return game.players[i];
        }
    }
    return null;
}

function checkPlayers(g) {
    //functie controleert of spelers nog wel verbonden zijn
    setInterval(function () {
        for (var i=0; i<g.players.length; i++) {
            var player = g.players[i];
            if (player.disconnecton!==null) {
                //Als spel gestart is
                if (game.cards.length > 0) {
                    //Gooi speler uit gameobject na 20 seconden disconnect
                    if (Date.now() - player.disconnecton > 20000) {
                        for (var c=0; c<player.cards.length; c++) {
                            //voeg alle kaarten van speler toe aan trekstapel
                            game.deck.push(player.cards[c]);
                        }
                        removePlayer(player);
                    }
                }
                else {
                    //5sec als spel niet gestart is
                    if (Date.now() - player.disconnecton > 5000) {
                        removePlayer(player);
                    }
                }
            }
        }
    },5000);
}

function removePlayer(player) {
    if (game.turn===player) {
        changeTurn(1);
    }
    game.players.splice(game.players.indexOf(player));
    //Geen spelers is spel stoppen
    if (game.players.length === 0) {
        game.cards = [];
        stopGame();
    }
    update(game);
}

function update(g) {
    //Stuur spelinfo naar alle spelers
    for (var i=0; i<g.players.length; i++) {
        var player = g.players[i];
        var playerlist = getPlayerList(player);
        var info = {'playercards':player.cards, 'topstash': g.stash[g.stash.length-1], 'playersinfo': playerlist, 'suit': g.suit, 'timer': g.timer, 'pakken': player.pakken-player.gepakt };
        if (player.choosesuit===true) {
            info.choosesuit=true;
        }
        player.socket.emit('update', info);
    }
}

function getPlayerList(player) {
    var playerlist = [];
    for (var i2=0; i2<game.players.length; i2++) {
        var name = game.players[i2].name;
        var info = {'name': name, 'cardcount': game.players[i2].cards.length, 'clockwise': game.clockwise };
        if (game.players[i2]===player) { info.you=true; }
        if (game.turn===game.players[i2]) { info.turn=true; }
        playerlist.push(info);
    }
    return playerlist;
}

function distributeCards () {
    var cardsPos = 0;
    var handSize = 2;

    // kaarten verdelen onder spelers
    for (var i = 0; i < game.players.length; i++) {
        game.players[i].cards=[];
        for (var c = cardsPos; c < (i+1)*handSize; c++) {
            game.players[i]['cards'].push(game.cards[c]);
        }
        cardsPos += handSize;
    }

    game.deck=[];
    //overige kaarten naar afpakstapel
    for (var i = cardsPos; i < game.cards.length-1; i++) {
        game.deck[game.deck.length] = game.cards[i];
    }

    game.stash=[];
    //laatste kaart naar de opgooistapel
    game.stash[0] = game.cards[game.cards.length-1];
    game.suit=game.cards[game.cards.length-1].type;
}

function fillCardArray() {
    var cs = ['2','3','4','5','6','7','8','9','10','J','Q','K','A']; //boer(J), vrouw(Q), heer(K), aas(A)
    for (var i=0; i < cs.length; i++) {
        for (var i2=0; i2<suits.length; i2++) {
            game.cards.push({'card': cs[i], 'type': suits[i2]});
        }
    }
    game.cards.push({'card': 'Joker', 'type': '1'});
    game.cards.push({'card': 'Joker', 'type': '2'});
}

function shuffleCards(cards) {
    var currIndex = cards.length, tempVal, ranIndex;

    while (0 != currIndex) {
        ranIndex = Math.floor(Math.random() * currIndex);
        currIndex -= 1;
        tempVal = cards[currIndex];
        cards[currIndex] = cards[ranIndex];
        cards[ranIndex] = tempVal;
    }

    return cards;
}
