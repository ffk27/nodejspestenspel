var socket;

function allowDrop(ev) {
    ev.preventDefault();
}

function drag(ev) {
    ev.dataTransfer.setData("card", ev.target.id);
}

function pull(ev) {
    //kaart trekken
    ev.dataTransfer.setData("card", 'newcard');
}

function put(ev) {
    ev.preventDefault();
    var data = ev.dataTransfer.getData("card");
    if (data==='newcard') {
        socket.emit('pull');
    }
}

function drop(ev) {
    ev.preventDefault();
    var data = ev.dataTransfer.getData("card");
    socket.emit('legop', data);
    socket.on('magopleggen', function(data) {
        $('#'+data).hide();
    });
}

$(document).ready(function () {
    socket = io.connect('http://localhost:8000');
    socket.on('connect', function () {
        var uid = sessionStorage.getItem("uid");

        if (uid !== null) {
            socket.emit('tryReconnect', uid);
        }
        else {
            window.location.href = '/';
        }

        socket.on('entername', function () {
            window.location.href = '/';
        });

        socket.on('gameStart', function () {
            //delete start button
            $('#controls').hide();
        });

        socket.on('update', function (game) {
            displayCards(game);
            if (game.choosesuit===true) {
                $('#suits').show();
            }
            else {
                $('#suits').hide();
            }
            showPlayerNames(game.playersinfo);
        });

        socket.on('playerConnect', function (playerinfo) {
            showPlayerNames(playerinfo);
        });
    });
});

function startGame() {
    socket.emit('tryStart');
}

function chooseSuit(suit) {
    socket.emit('chooseSuit',suit);
}

function displayCards(game) {
    var playercards = game.playercards;

    var s='';
    console.log(game);
    switch(game.suit) {
        case 'H':
            s='♥';
            break;
        case 'D':
            s='♦';
            break;
        case 'S':
            s='♠';
            break;
        case 'C':
            s='♣';
            break;
    }
    $('#suit').html(s);

    $('#trekstapel').html('<img draggable="true" ondragstart="pull(event)" src="/img/cards-svg/back.svg" class="card"/>');

    $('#aflegstapel').html(
        '<img class="card" id="'+game.topstash.card+game.topstash.type+'" draggable="true" ondragstart="drag(event)" ' +
        'src="img/cards-svg/'+game.topstash.card+game.topstash.type+'.svg" />'
    );

    var cardshtml = '';

    for(var i = 0; i < playercards.length; i++){
        var pxdown = 0;
        var pxright = i * 16;//*16 on 10% //*14 on 8%
        cardshtml += '<img class="card" id="'+playercards[i].card+playercards[i].type+'" draggable="true" ondragstart="drag(event)" ' +
            'src="img/cards-svg/'+playercards[i].card+playercards[i].type+'.svg" ' +
            'style="margin-top:' + pxdown + 'px;margin-left:' + pxright + 'px;"/>'
    }

    $("#playercards").html(cardshtml);
}

function showPlayerNames(players){
    var playersinfo = '';

    for (var i=0; i<players.length; i++) {
        var player = players[i];
        playersinfo+='<div class="';
        if (player.you===true) {
            playersinfo+='you';
        }
        if (player.turn===true) {
            playersinfo+=' turn';
        }
        playersinfo+='">';
        playersinfo+=player.name;
        if (player.you===true) {
            playersinfo+=' (Jij)';
        }
        playersinfo+=' kaarten: ' + player.cardcount;
        if (player.turn===true) {
            if (player.clockwise === true) {
                playersinfo += ' ⇓';
            }
            else {
                playersinfo += ' ⇑';
            }
        }
        playersinfo+='</div>';
    }
    $('#allplayers').html(playersinfo);
}