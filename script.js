var socket;

function allowDrop(ev) {
    ev.preventDefault();
}

function drag(ev) {
    ev.dataTransfer.setData("card", ev.target.id);
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

function displayCards(game) {
    var playercards = game.playercards;

    $('#trekstapel').html('<img src="/img/cards-svg/back.svg" class="card"/>');

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

        playersinfo+=player.name;
        playersinfo+=' kaarten: ' + player.cardcount;
        playersinfo+='<br/>';
    }
    $('#allplayers').html(playersinfo);
}