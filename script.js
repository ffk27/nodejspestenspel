function loadDeck() {
    var socket = io.connect('http://localhost:8000');
    socket.on('cards', function (data) {
        console.log(data);
        for (var i = 0; i < data.length; i++) {
            var pxdown = i * 1;
            var pxright = i * 10;//*10 on 8% width
            $("#content").append(
                '<img class="card" src="img/cards-svg/' + data[i].card + data[i].type + '.svg" style="margin-top:' + pxdown + 'px;margin-left:' + pxright + 'px;"/>'
            );
        }
        //socket.emit('my other event', { my: 'data' });
    });
}