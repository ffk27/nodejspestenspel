var http = require('http');



http.createServer(function (req, res) {



    res.writeHead(200, { 'Content-Type': 'text/html' });

    fs = require('fs');
    var p  = './index.html';
    fs.readFile(p, function(err, html) {
        if(err){
            throw err;
        }
        res.writeHead(200 , { "Content-Type": "text/html"});
        res.write(html);
        res.end();
        console.log("response sent..");
    });

}).listen(process.env.PORT || 8080);