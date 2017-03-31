var socket;
var timer;

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

function setTimer(sec) {
    timer = setInterval(function () {
        $('#timer').html(sec);
        sec--;
        if(sec < 5) {
            $("#timer").css({"color": "#d11010", "font-size": "150%"});
            new Audio('biem.mp3').play(); // Plays the countdown sound
        }
        else
            $("#timer").css({"color": "white", "font-size": "100%"});
        if (sec<0) { clearInterval(timer) }
    },1000);
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

        // Plays the audio file and keeps it playing in loop
        var audio = new Audio('FichtlsLied.mp3');

        $(audio).bind('ended', function()  {
            audio.currentTime = 0;
            audio.play();
        });

        audio.play();

        var uid = sessionStorage.getItem("uid");

        if (uid !== null) {
            socket.emit('tryReconnect', uid);
        }
        else {
            window.location.href = '/';
        }

        socket.on('playHorse', function () {
            new Audio('horse.mp3').play();
        });

        socket.on('entername', function () {
            window.location.href = '/';
        });

        socket.on('gameStart', function () {
            //delete start button
            $('#controls').hide();
        });

        socket.on('update', function (game) {
            clearInterval(timer);
            if (game.timer!==null) {
                setTimer(game.timer);
            }
            else {
                $('#timer').html('');
            }
            if (game.topstash !== undefined) {
                displayCards(game);
            }
            if (game.choosesuit===true) {
                $('#suits').show();
            }
            else {
                $('#suits').hide();
            }
            showPlayerNames(game);
        });
/*
        socket.on('playerConnect', function (game) {
            showPlayerNames(game);
        });
*/
        socket.on("notEnoughPlayers", function () {
            $("#gamemessage").hide().fadeIn().html("Er moeten minimaal twee spelers aanwezig zijn om een spel te kunnen starten").css("color", "#d11010").delay(2000).fadeOut();
        })
    });
});

function startGame() {
    socket.emit('tryStart');
}

function chooseSuit(suit) {
    socket.emit('chooseSuit',suit);
}

window.mobileAndTabletcheck = function() {
    var check = false;
    (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
    return check;
};

function displayCards(game) {
    var player = null;
    for (var i=0; i<game.playersinfo.length; i++) {
        if (game.playersinfo[i].you===true) {
            player=game.playersinfo[i];
            break;
        }
    }
    var playercards = player.playercards;

    if (game.timer===null) {
        $("#startgamebutton").show();
    }
    else {
        $("#startgamebutton").hide();
    }
    var s='';
    if (game.topstash.card === "Joker"){
        s = '♥|♦|♠|♣';
    }
    else {
        switch (game.suit) {
            case 'H':
                s = '♥';
                break;
            case 'D':
                s = '♦';
                break;
            case 'S':
                s = '♠';
                break;
            case 'C':
                s = '♣';
                break;
        }
    }
    $('#suit').html(s);

    $('#trekstapel').html('<img onclick="DoubleClicked_Stapel(event)" draggable="true" ondragstart="pull(event)" src="/img/cards-svg/back.svg" class="card"/>');

    $('#aflegstapel').html(
        '<img class="card" id="'+game.topstash.card+game.topstash.type+'" draggable="true" ondragstart="drag(event)" ' +
        'src="img/cards-svg/'+game.topstash.card+game.topstash.type+'.svg" />'
    );

    var cardshtml = '';
    if(mobileAndTabletcheck) {
        var marginleft = "30px";
    } else {
        var marginleft = "25px";
    }

    if (player.pakken>0) {
        $('#pakken').html('Pak ' + player.pakken + ' kaarten of gooi een Joker/2 op.');
    }
    else {
        $('#pakken').html('');
    }

    for(var i = 0; i < playercards.length; i++){

        cardshtml += '<div style="float:left;width:1px;margin-left:'+marginleft+';float:left;"><img class="card" id="'+playercards[i].card+playercards[i].type+'" onclick="DoubleClicked_Card(event, '+"'"+playercards[i].card+playercards[i].type+"'"+')" draggable="true" ondragstart="drag(event)" ' +
            'src="img/cards-svg/'+playercards[i].card+playercards[i].type+'.svg" /></div>'
    }

    $("#playercards").html(cardshtml);
}

var touchtime_card = 0;

function DoubleClicked_Card(ev, id) {
    if(touchtime_card == 0) {//eerste klik
        touchtime_card = new Date().getTime();
    } else {
        //kijken of tweede klik snel genoeg na eerste is
        if(((new Date().getTime())-touchtime_card) < 800) {
            //kaart opleggen
            ev.preventDefault();
            var data = id;
            socket.emit('legop', data);
            socket.on('magopleggen', function(data) {
                $('#'+data).hide();
            });

            touchtime_card = 0;
        } else {
            //niet snel genoeg na vorige klik dus is nieuwe eerste klik
            touchtime_card = new Date().getTime();
        }
    }
}
var touchtime_stapel = 0;

function DoubleClicked_Stapel(ev) {
    if(touchtime_stapel == 0) {//eerste klik
        touchtime_stapel = new Date().getTime();
    } else {
        //kijken of tweede klik snel genoeg na eerste is
        if(((new Date().getTime())-touchtime_stapel) < 800) {
            //kaart trekken
            socket.emit('pull');

            touchtime_stapel = 0;
        } else {
            //niet snel genoeg na vorige klik dus is nieuwe eerste klik
            touchtime_stapel = new Date().getTime();
        }
    }
}

function showPlayerNames(game){
    var players = game.playersinfo;
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
        if(player.cardcount === 1){
            playersinfo+=' onecard';
        }
        playersinfo+='">';
        if(player.turn === true){
            playersinfo += '<span id="turnarrow">&#8674;</span>';
        }
        playersinfo+=player.name;
        if (player.you===true) {
            playersinfo+=' (Jij)';
        }

        if (player.cardcount>1) {
            playersinfo+=' kaarten: ' + player.cardcount;
        }
        else if (player.cardcount===1) {
            playersinfo+=' LAATSTE KAART!';
        }
        else if (player.gewonnen===true) {
            playersinfo+=' Gewonnen!';
        }

        if (player.turn===true) {
            if (game.clockwise === true) {
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

