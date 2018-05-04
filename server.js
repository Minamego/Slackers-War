var distToMove = 0.1;
var maxHealth = 50;
var mapHeight = 2000, mapWidth = 2000, distToOrbit = 55;
var radBig = 60, radObject = 20;
var maxBullets = 100;
var healthInc = 10, bulletsInc = 5;
var playerSpeed = 0.01;
var ghostPrice = 0, shotsPrice = 0;
var minimumPointsToOpenRoom = 1000;
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
class user {
    constructor(username, points, coins, features) {
        this.username = username;
        this.points = points;
        this.coins = coins;
        this.features = features;
    }
}
var users = [];
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
        this.dir = {
            dx: 0,
            dy: 0
        }
    }
    // move specific player on his mouse event
    move() {
        if (this.health > 0) {
            this.playerCurX = this.dir.dx * playerSpeed + this.playerCurX;
            this.playerCurY = this.dir.dy * playerSpeed + this.playerCurY;
            if (this.playerCurX + radBig >= mapWidth) this.playerCurX = mapWidth - radBig;
            if (this.playerCurX - radBig < 0) this.playerCurX = radBig;
            if (this.playerCurY + radBig >= mapHeight) this.playerCurY = mapHeight - radBig;
            if (this.playerCurY - radBig < 0) this.playerCurY = radBig;
        }
    }
}

// the room class holds all information about the room and the players inside it
class Room {
    constructor(name, num, state) {
        this.autoIncrementId = 0;
        this.roomName = name;
        this.good = num;
        this.bad = num;
        this.initialNum = num;
        this.players = [];
        this.objects = [];
        this.state = state; // 0 means not in game , 1 means in  game
    }
    addPlayer(player) {
        this.players[this.autoIncrementId] = player;
        this.autoIncrementId++;
    }
    getPos(socketId) {
        for (var i in this.players) {
            if (this.players[i].socketId.localeCompare(socketId) == 0) return i;
        }
    }
    // collesion of bullets and players
    bulletsToPlayersCollesion() {
        var siz = this.players.length;
        for (var i in this.players) {
            if (this.players[i].health <= 0) continue;
            var num = this.players[i].bullets.length;
            for (var j in this.players[i].bullets) {
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
        for (var i in this.objects) {
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
        for (var i in this.objects) {
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
        var x = Math.random() * mapWidth;
        var y = Math.random() * mapHeight;
        /* var numOfTries = 10;
         for (var i = 0; i < numOfTries; i++) {
             var rndX = Math.random() * mapWidth;
             var rndY = Math.random() * mapHeight;
             if (this.check(rndX, rndY)) {
                 x = rndX;
                 y = rndY;
                 break;
             }
         }*/
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
            for (var j in this.players[i].bullets) {
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
    movePlayers() {
        for (var i in this.players) {
            this.players[i].move();
        }
    }
    // send the data to clients side to be drawn
    send() {
        var data = {
            playersData: this.players,
            objectsData: this.objects
        }
        io.to(this.roomName).emit('newData', data);
    }
    startGame() {
        this.state = 1;
        this.good = this.initialNum;
        this.bad = this.initialNum;
        io.to(this.roomName).emit('gameStarted', data);
    }
}

var rooms = [];
const maxNumOfRomms = 20;
const initialRooms = 10;
const maxNumOfPlayers = 10;
// set the port for the server
var server = app.listen(3000, function () {
    for (let i = 1; i <= maxNumOfPlayers; i++) {
        if (i <= initialRooms) rooms[i] = new Room(i, maxNumOfPlayers, 0);
        else rooms[i] = new Room(i, maxNumOfPlayers, -1);
    }
    setIO();
});
var io;
function setIO() {
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
        changeDir(data, socket);
    });
    // handle a player shooting
    socket.on('shooting', function (data) {
        addBullet(data, socket);
    });
}
function changeDir(data, socket) {
    var idx = rooms[socket.roomName].getPos(socket.id);
    var player = rooms[socket.roomName].players[idx];
    if (player.health > 0) {
        player.dir.dx = data.x;
        player.dir.dy = data.y;
        rooms[socket.roomName].players[idx] = player;
        rooms[socket.roomName].players[idx].move();
        rooms[socket.roomName].send();
    }

}
function disconnect(socket) {
    // print the id of this client 
    console.log(socket.id + " left");
    var idx = rooms[socket.roomName].getPos(socket.id);
    if (rooms[socket.roomName].state == 0) {
        if (rooms[socket.roomName].players[idx].type == 0) rooms[socket.roomName].good++;
        else rooms[socket.roomName].bad++;
    }
    rooms[socket.roomName].players.splice(idx, 1);
    rooms[socket.roomName].autoIncrementId--;
}

// assign a player to a room
function add(socket, data) {
    socket.join(data.room, function () {
        socket.roomName = data.room;
        var playerData = {
            socketId: socket.id,
            type: data.type
        }
        rooms[data.room].addPlayer(new Player(playerData));
        if (data.type == 0) rooms[data.room].good--;
        else rooms[data.room].bad--;
        if (rooms[data.room].bad == 0 && rooms[data.room].good == 0) {
            rooms[data.room].startGame();
        }
    });
}
// move a bullet to specific player
function addBullet(data, socket) {
    var idx = rooms[socket.roomName].getPos(socket.id);
    var player = rooms[socket.roomName].players[idx];
    if (player.health > 0) {
        if (player.shots <= 0) return;
        var bull = {
            Xnorm: data.Xnorm,
            Ynorm: data.Ynorm,
            Xcur: player.playerCurX + Math.cos(data.bulletAngle * Math.PI / 180) * distToOrbit,
            Ycur: player.playerCurY + Math.sin(data.bulletAngle * Math.PI / 180) * distToOrbit
        };
        rooms[socket.roomName].players[idx].bullets.push(bull);
        rooms[socket.roomName].players[idx].shots--;
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
    for (var i in rooms) {
        rooms[i].movePlayers();
        rooms[i].updateBullets();
        rooms[i].objectsToPlayersCollesion();
        rooms[i].bulletsToPlayersCollesion();
        rooms[i].genObject();
        rooms[i].send();
    }
}

var session = require('express-session');
var bodyParser = require('body-parser');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const userSchema = new Schema({
    username: String,
    password: String,
    points: Number,
    coins: Number,
    features: Array
});

const User = mongoose.model('user', userSchema);


var urlencodedParser = bodyParser.urlencoded({ extended: false });
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
    secret: 'work hard',
    resave: true,
    saveUninitialized: true
}));

mongoose.connect('mongodb://localhost/slackers');
mongoose.connection.once('open', function () {
    console.log('Connection has been made, now make fireworks...');

}).on('error', function (error) {
    console.log('Connection error:', error);
});

var zerosArr = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
app.get('/rooms', function (req, response) {
    var SID = req.sessionID;
    if (users[SID] == null) {
        users[SID] = new user("", 0, 0, zerosArr);
    }
    var features = users[SID].features;
    response.writeHead(200, { "Content-Type": "application/json" });
    var temp = [];
    for (let key in rooms) {
        let val = rooms[key];
        if (val.state == 0) {
            var curFeature = 3;
            if (users[SID].username) curFeature = features[key];
            var data = {
                name: val.roomName,
                good: val.good,
                bad: val.bad,
                feature: curFeature
            }
            temp.push(data);
        }
    }
    var userType = 1;
    if (users[SID].username) {
        userType = 0;
    }
    var json = JSON.stringify({
        rooms: temp,
        type: userType,
        username: users[SID].username,
        points: users[SID].points,
        coins: users[SID].coins
    });
    response.end(json);

});

app.get('/', function (req, res) {

    console.log("hello");

});

app.post('/login', function (req, res) {

    if (req.sessionID) {
        var SID = req.sessionID;
        //console.log("get function login");
        User.findOne({ username: req.body.username }).then(function (result) {
            if (result.username == req.body.username && result.password == req.body.password) {
                users[SID] = new user(result.username, result.points, result.coins, zerosArr);
                res.send({
                    username: req.body.username,
                    coins: users[req.sessionID].coins,
                    points: users[req.sessionID].points
                });
            } else {
                res.send({ errorMsg: 'invalid username or password' });
            }
        });
    } else {
        console.log("req.session is false");
    }
});

app.post('/register', function (req, res) {
    if (req.sessionID) {
        const user = new User({
            username: req.body.username,
            password: req.body.password,
            points: 0,
            coins: 0,
            features: zerosArr
        });


        User.findOne({ username: req.body.username }).then(function (result) {
            if (result != null && result.username == req.body.username) {
                res.send({ errorMsg: 'username is already taken' });
            } else {
                user.save().then(function () {
                    res.send({
                        username: req.body.username,
                        password: req.body.password,
                        msg: 'registeration success'
                    });
                });
            }
        });

    } else {
        console.log("req.session is false");
    }
});

app.post('/buy_ghost', function (req, res) {
    if (req.sessionID && users[req.sessionID] && users[req.sessionID].coins >= ghostPrice) {

        var SID = req.sessionID;
        var roomName = req.body.room;

        users[SID].coins -= ghostPrice;
        users[SID].features[roomName] |= 1;
        console.log(users[SID].features);
        console.log(users[SID].username);
        User.updateOne({ username: users[SID].username }, {
            $set: {
                coins: users[SID].coins,
                features: users[SID].features
            }
        } , function(err , res){
            if(err) throw err;
        });

        res.send({
            sucess: 1,
            coins: users[SID].coins,
            points: users[SID].points
        });

    } else {
        if (users[SID] == null) {
            users[SID] = new user("", 0, 0, zerosArr);
        }
        res.send({
            sucess: 0,
            coins: users[SID].coins,
            points: users[SID].points
        });
    }
});
app.post('/buy_shots', function (req, res) {
    if (req.sessionID && users[req.sessionID] && users[req.sessionID].coins > ghostPrice) {
        var SID = req.sessionID;
        var roomName = req.body.room;

        users[SID].coins -= ghostPrice;
        users[SID].features[roomName] |= 1;
        console.log(users[SID].features);
        User.updateOne({ username: users[SID].username }, {
            $set: {
                coins: users[SID].coins,
                features: users[SID].features
            }
        });

        res.send({
            sucess: 1,
            coins: users[SID].coins,
            points: users[SID].points
        });

    } else {
        if (users[SID] == null) {
            users[SID] = new user("", 0, 0, zerosArr);
        }
        res.send({
            sucess: 0,
            coins: users[SID].coins,
            points: users[SID].points
        });
    }
});

app.post('/create_room', function (req, response) {
    User.findOne({ username: req.body.username }).then(function (result) {
        // validate that this user can create a room
        if (result && result.points >= minimumPointsToOpenRoom) {
            // check that the numbers of created rooms below the limit
            var idx = -1;
            for (var i in rooms) {
                if (rooms[i].state == -1) { idx = i; break; }
            }
            if (idx != -1) {
                rooms[idx].state = 0;
            }
        }
        var features = users[SID].features;
        response.writeHead(200, { "Content-Type": "application/json" });
        var temp = [];
        for (let key in rooms) {
            let val = rooms[key];
            if (val.state == 0) {
                var curFeature = features[key];
                var data = {
                    name: val.roomName,
                    good: val.good,
                    bad: val.bad,
                    feature: curFeature
                }
                temp.push(data);
            }
        }
        var json = JSON.stringify({
            rooms: temp,
            type: 0
        });;
        response.end(json);
    });

});
