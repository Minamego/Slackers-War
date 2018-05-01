var distToMove = 0.1;
var maxHealth = 50;
var mapHeight = 3000, mapWidth = 3000, distToOrbit = 55;
var radBig = 60, radObject = 20;
var maxBullets = 100;
var healthInc = 10, bulletsInc = 5;
var playerSpeed = 0.01;
// import express to host the server
var express = require('express');
// import the socket to control in and out on serever
var socket = require('socket.io');
// run host
var app = express();
// give the host the files that will be shown to clients
app.use(express.static('public'));
// run the socket on the server


// the player class holds all information about a player
class Player {
    constructor(data) {
        this.socketId = data.socketId;
        if (data.type == 1) {
            this.playerCurX = 0;
            this.playerCurY = 0;
        }
        else {
            this.playerCurX = mapWidth - 1;
            this.playerCurY = mapHeight - 1;
        }
        this.health = maxHealth;
        this.shots = maxBullets;
        this.bullets = [];
        this.type = data.type // 0 is good , 1 is bad
    }
}

// the room class holds all information about the room and the players inside it
class Room {
    constructor(name, num, type) {
        this.autoIncrementId = 0;
        this.roomName = name;
        this.good = num;
        this.bad = num;
        this.players = [];
        this.objects = [];
        this.type = type;     // type of the room means it's a server made room or a client made room
    }
    addPlayer(player) {
        this.players[this.autoIncrementId] = player;
        this.autoIncrementId++;
    }
    // collesion of bullets and players
    bulletsToPlayersCollesion() {
        var siz = this.players.length;
        for (var i in this.players) {
            if (this.players[i].health <= 0) continue;
            var num = this.players[i].bullets.length;
            for (var j = 0; j < num; j++) {
                var bullet = this.players[i].bullets[j];
                var bx = bullet.Xcur;
                var by = bullet.Ycur;
                var f = 0;
                for (var k in this.players) {
                    if (k == i) continue;
                    if (this.players[k].health <= 0) continue;
                    var x = this.players[k].playerCurX, y = this.players[k].playerCurY;

                    if ((x - bx) * (x - bx) + (y - by) * (y - by) <= radBig * radBig) {

                        this.players[k].health--;
                        f = 1;
                    }
                }
                if (f == 1) {
                    this.players[i].bullets.splice(j, 1);
                    j--;
                    num--;
                }

            }
        }
    }

    // collesion of objects and players
    objectsToPlayersCollesion() {
        var siz = this.objects.length;
        for (var i = 0; i < siz; i++) {
            var x = this.objects[i].curX;
            var y = this.objects[i].curY;
            var t = this.objects[i].type;
            var f = 0;
            var sizz = this.players.length;
            for (var j in this.players) {
                if (this.players[j].health <= 0) continue;
                var dist = (this.players[j].playerCurX - x) * (this.players[j].playerCurX - x) + (this.players[j].playerCurY - y) * (this.players[j].playerCurY - y);
                if (dist <= radBig * radBig)   // this player takes the object
                {
                    f = 1;
                    if (t == 0) // health
                    {
                        this.players[j].health = Math.min(maxHealth, this.players[j].health + healthInc);
                    }
                    else    // bullets
                    {
                        this.players[j].shots = Math.min(maxBullets, this.players[j].shots + bulletsInc);
                    }
                }
            }
            if (f == 1) {
                this.objects.splice(i, 1);
                i--;
                siz--;
            }
        }
    }
    // check if object can be put in (x,y)
    check(x, y) {
        var siz = this.players.length;
        for (var i in this.players) {
            if (this.players[i].health <= 0) continue;
            var dist = (this.players[i].playerCurX - x) * (this.players[i].playerCurX - x) + (this.players[i].playerCurY - y) * (this.players[i].playerCurY - y);
            if (dist <= (radBig + radObject) * (radBig + radObject)) return 0;
        }
        var siz = this.objects.length;
        for (var i = 0; i < siz; i++) {
            var dist = (this.objects[i].CurX - x) * (this.objects[i].CurX - x) + (this.objects[i].CurY - y) * (this.objects[i].CurY - y);
            if (dist <= (radObject + radObject) * (radObject + radObject)) return 0;
        }
        return 1;
    }
    // generate random object(health or bullets) in random time
    genObject() {
        var siz = this.objects.length;
        if (siz >= 10) return;
        var rnd = getRandomInt(10000);
        if (rnd >= 10) return;
        var t = getRandomInt(10); // 0 is health else is bullet
        if (t > 0) t = 1;
        var x, y;
        var numOfTries = 10;
        for (var i = 0; i < numOfTries; i++) {
            var rndX = Math.random() * mapWidth;
            var rndY = Math.random() * mapHeight;
            if (this.check(rndX, rndY)) {
                x = rndX;
                y = rndY;
                break;
            }
        }
        var add = {
            curX: x,
            curY: y,
            type: t
        }
        this.objects.push(add);
    }

    //update bullets postion
    updateBullets() {
        var siz = this.players.length;
        for (var i in this.players) {
            var num = this.players[i].bullets.length;
            for (var j = 0; j < num; j++) {
                var bullet = this.players[i].bullets[j];
                var bx = bullet.Xcur + bullet.Xnorm * distToMove;
                var by = bullet.Ycur + bullet.Ynorm * distToMove;
                if (bx < 0 || bx > mapWidth || by < 0 || by > mapHeight) {
                    this.players[i].bullets.splice(j, 1);
                    j--;
                    num--;
                }
                else {
                    this.players[i].bullets[j].Xcur = bx, this.players[i].bullets[j].Ycur = by;
                }
            }
        }
    }
    // send the data to clients side to be drawn
    send()
    {
        var data = {
            playersData:this.players,
            objectsData:this.objects
        }
        io.to(this.roomName).emit('newData' , data);        
    }
}

var rooms = [];
const maxNumOfRomms = 20;
const initialRooms = 10;
const maxNumOfPlayers = 10;
// set the port for the server
var server = app.listen(3000, function () {
    for (let i = 1; i <= initialRooms; i++) {
        rooms[i] = new Room(i, maxNumOfPlayers, 0);
    }
    setIO();
});
var io;
function setIO()
{
    io = socket(server);
    io.sockets.on('connection', newConnection);
}
// newConnection is a function that handles a new player connected
function newConnection(socket) {
    // print the id of this client 
    console.log(socket.id + " joined");
    // assign disconnect call back
    socket.on('disconnect', function () {
        disconnect(socket);
    });
    // assign player to the room
    socket.on('room', function (data) {
        add(socket, data);
    });
    // handle a player move
    socket.on('moving', function (data) {
        move(data, socket);
    });

    // handle a player shooting
    socket.on('shooting', function (data) {
        addBullet(data, socket);
    });
}

function disconnect(socket) {
    // print the id of this client 
    console.log(socket.id + " left");
    delete rooms[socket.roomName].players[socket.idx];
}

// assign a player to a room
function add(socket, data) {
    socket.join(data.room, function () {
        socket.idx = rooms[data.room].autoIncrementId;
        socket.roomName = data.room;
        var playerData = {
            socketId: socket.id,
            type: data.type
        }
        rooms[data.room].addPlayer(new Player(playerData));
        if (data.type == 0) rooms[data.room].good--;
        else rooms[data.room].bad--;
    });
}

// move specific player on his mouse event
function move(data, socket) {
    var player = rooms[socket.roomName].players[socket.idx];
    if (player.health > 0) {
        data.x = data.x * playerSpeed + player.playerCurX;
        data.y = data.y * playerSpeed + player.playerCurY;
        if (data.x + radBig >= mapWidth) data.x = mapWidth - radBig;
        if (data.x - radBig < 0) data.x = radBig;
        if (data.y + radBig >= mapHeight) data.y = mapHeight - radBig;
        if (data.y - radBig < 0) data.y = radBig;
        player.playerCurX = data.x;
        player.playerCurY = data.y;
        rooms[socket.roomName].players[socket.idx] = player;
        rooms[socket.roomName].send();
    }
}

// move a bullet to specific player
function addBullet(data, socket) {
    var player = rooms[socket.roomName].players[socket.idx];
    if (player.health > 0) {
        if (player.shots <= 0) return;
        var bull = {
            Xnorm: data.Xnorm,
            Ynorm: data.Ynorm,
            Xcur: player.playerCurX + Math.cos(data.bulletAngle * Math.PI / 180) * distToOrbit,
            Ycur: player.playerCurY + Math.sin(data.bulletAngle * Math.PI / 180) * distToOrbit
        };
        rooms[socket.roomName].players[socket.idx].bullets.push(bull);
        rooms[socket.roomName].players[socket.idx].shots--;
        rooms[socket.roomName].send();
    }
}
function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

// the game logic
setInterval(play, 20);
function play() {
    var siz = rooms.length;
    for(var i = 1 ; i<siz ; i++)
    {
        rooms[i].updateBullets();
        rooms[i].objectsToPlayersCollesion();
        rooms[i].bulletsToPlayersCollesion();
        rooms[i].genObject();
        rooms[i].send();
    }
}

app.get('/rooms',function(req,response){
    
    response.writeHead(200, {"Content-Type": "application/json"});
    var temp =[];
    for (let key in rooms) {
      let val = rooms[key];
      if(val.good>0 || val.bad>0){
      var data = {
        name : val.roomName,
        good : val.good,
        bad : val.bad
      }
      temp.push(data);
    }
   }
    var json = JSON.stringify({ 
      rooms : temp
    });
    response.end(json);
    
  });
  app.get('/', function(req, res){
  });
  


