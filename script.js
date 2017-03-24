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
        showPlayerNames(game)
    });
});

function startGame() {
    socket = io.connect('http://localhost:8000');
    socket.emit('tryStart');
}

function displayCards(game) {
    var playercards = game.playercards;

    $('#trekstapel').html('<img src="/img/cards-svg/back.svg" class="card"/>');

    $('#aflegstapel').html(
        '<img class="card" id="'+game.topstash.card+game.topstash.type+'" draggable="true" ondragstart="drag(event)" ' +
        'src="img/cards-svg/'+game.topstash.card+game.topstash.type+'.svg" />'
    );

    for(var i = 0; i < playercards.length; i++){
        var pxdown = 0;
        var pxright = i * 16;//*16 on 10% //*14 on 8%
        $("#playercards").append(
            '<img class="card" id="'+playercards[i].card+playercards[i].type+'" draggable="true" ondragstart="drag(event)" ' +
            'src="img/cards-svg/'+playercards[i].card+playercards[i].type+'.svg" ' +
            'style="margin-top:' + pxdown + 'px;margin-left:' + pxright + 'px;"/>'
        );
    }
}

function showPlayerNames(game){
    var playersinfo = '';

    for (var i=0; i<game.otherplayerinfo.length; i++) {
        var otherplayer = game.otherplayerinfo[i];
        console.log(otherplayer);

        playersinfo+=otherplayer.name + ' cards: ' + otherplayer.cardcount + '<br/>';
    }
    $('#allplayers').html(playersinfo);
}