var socket = io.connect('http://localhost:8000');
var uid = localStorage.getItem("uid");
if (uid !== null && uid != 'undefined') {
    socket.emit('reconnect', uid);
    console.log('reconnect',typeof uid);
}

socket.on('isReconnected', function (name) {
    console.log(name);
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
        //socket.emit('my other event', { my: 'data' });
    });
}

function setMessage(message, color){
    $("#message").hide().fadeIn().html(message).css("color", color).delay(2000).fadeOut();
}

function isValid(input){
    var pattern = /[^\w+]/g;
    if(input.match(pattern) == null){
        return true;
    }
    return false;
}

$(document).ready(function(){
    $("#enter").click(function () {
        var name = $("#name").val();
        if(name.length < 3){
            setMessage("Uw naam moet minimaal 2 karakters lang zijn", "#d11010");
        }
        else if(!isValid(name)){
            setMessage("Uw naam mag geen speciale tekens bevatten", "#d11010");
        }
        else{
            socket.emit('player', name);
            socket.on('connect', function(data){
                console.log(data);
                localStorage.setItem("uid" ,data);
                window.location.href = "/";
            });
        }
    });
});