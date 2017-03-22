var socket;

$(document).ready(function () {
    socket = io.connect('http://localhost:8000');

    var uid = localStorage.getItem("uid");
    if (uid !== null && uid != 'undefined') {
        socket.emit('reconnect', uid);
        socket.on('isReconnected', function (name) {
            console.log(name);
        });
    }
});

function startGame() {
    loadDeck();
    //give cards

    //delete start button
    document.getElementById('controls').innerHTML = "";
}


function loadDeck() {
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