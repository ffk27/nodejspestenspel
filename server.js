var express = require('express');
var app = express();
var path    = require("path");
var port = 8000;
var cards = [];

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname+'/index.html'));
});

app.listen(port, function () {
    console.log('Pesten app luistert op port ' + port);
});

function fillCardArray() {
    for (var i = 2; i < 15; i++) {
        var c = '' + i;
        if (i > 10) {
            switch (i) {
                case 11:
                    c = 'J';
                    break;
                case 12:
                    c = 'Q';
                    break;
                case 13:
                    c = 'K';
                    break;
                case 14:
                    c = 'A';
                    break;
            }
        }

        for (var i2 = 0; i2 < 4; i2++) {
            var type = '';
            switch (i2) {
                case 0:
                    type = 'H';
                    break;
                case 1:
                    type = 'D';
                    break;
                case 2:
                    type = 'C';
                    break;
                case 3:
                    type = 'S';
                    break;
            }
            var card = c + type;
            cards[cards.length] = card;
        }
    }

    cards[cards.length] = 'Joker1';
    cards[cards.length] = 'Joker2';

    console.log(cards);
}

function scramble(){

}

fillCardArray();
