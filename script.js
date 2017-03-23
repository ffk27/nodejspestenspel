var socket;

$(document).ready(function () {
    socket = io.connect('http://localhost:8000');

    var uid = sessionStorage.getItem("uid");
    if (uid !== null && uid != 'undefined') {
        socket.emit('reconnect', uid);
        socket.on('isReconnected', function (name) {
            console.log(name);
        });
    }
});

function startGame() {
    loadDeck();//being deleted later on

    socket = io.connect('http://localhost:8000');
    socket.emit('GameStarted');

    //delete start button
    document.getElementById('controls').innerHTML = "";
}


function loadDeck() {
    var socket = io.connect('http://localhost:8000');

    socket.on('cards', function (data) {
        console.log(data);
        for(var i = 0; i < data.length; i++){
            var pxdown = 0;
            var pxright = i * 10;//*10 on 8% width
            $("#playercards").append(
                '<img class="card" id="'+data[i].card+data[i].type+'" draggable="true" ondragstart="drag(event)" ' +
                'src="img/cards-svg/'+data[i].card+data[i].type+'.svg" ' +
                'style="margin-top:' + pxdown + 'px;margin-left:' + pxright + 'px;"/>'
            );
        }
    });
}