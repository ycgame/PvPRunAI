
var Ai = require("./ai");

var bodyParser = require("body-parser");
var express = require("express");
var app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

var server = app.listen(6767, function(){
    console.log("AI server is running on port "+server.address().port);
});

app.post("/request", function(req, res){

    console.log("AI Request");

    if(req.body.token == process.env.AI_TOKEN){
	console.log("Authentication: Success");
	var ai = new Ai(req.body.data);
	ai.run();
    }

    res.end('');
});

app.get("/status", function(req, res){
    res.end('OK');
});
