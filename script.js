var socket;

$(document).ready(function () {
    socket = io.connect('http://localhost:8000');

    var uid = sessionStorage.getItem("uid");

    if (uid != null) {
        socket.emit('tryReconnect', uid);
        socket.on('canReconnect', function (player) {
            console.log(player);
        });
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
    });
});

function startGame() {
    socket = io.connect('http://localhost:8000');
    socket.emit('tryStart');
}

function displayCards(game) {
    var playercards = game.playercards;

    if (game.deckcount>0) {
        $('#trekstapel').html('<img src="/img/cards-svg/Card_back_01.svg"/>');
    }

    $('#aflegstapel').html(
        '<img class="card" id="'+game.topstash.card+game.topstash.type+'" draggable="true" ondragstart="drag(event)" ' +
        'src="img/cards-svg/'+game.topstash.card+game.topstash.type+'.svg" ' +
        'style="margin-top:' + pxdown + 'px;margin-left:' + pxright + 'px;"/>'
    );

    for(var i = 0; i < playercards.length; i++){
        var pxdown = 0;
        var pxright = i * 12;//*10 on 8% width
        $("#playercards").append(
            '<img class="card" id="'+playercards[i].card+playercards[i].type+'" draggable="true" ondragstart="drag(event)" ' +
            'src="img/cards-svg/'+playercards[i].card+playercards[i].type+'.svg" ' +
            'style="margin-top:' + pxdown + 'px;margin-left:' + pxright + 'px;"/>'
        );
    }

    var playersinfo = '';

    for (var i=0; i<game.otherplayerinfo.length; i++) {
        var otherplayer = game.otherplayerinfo[i];
        playersinfo+=otherplayer.name + ' cards: ' + otherplayer.cardcount + '<br/>';
    }
    $('#otherplayers').html(playersinfo);
}