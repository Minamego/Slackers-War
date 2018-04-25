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
// set the port for the server
var server = app.listen(3000);
// run the socket on the server
var io = socket(server);

var players = [];
var objects = [];
// newConnection is a function that handles a new player connected
io.sockets.on('connection', newConnection);

function newConnection(socket) {
    // print the id of this client 
    console.log(socket.id + " joined");
    // assign disconnect call back
    socket.on('disconnect', function () {
        disconnect(socket.id);
    });

    // add this player
    var player = {
        id: socket.id,
        playerCurX: 0,
        playerCurY: 0,
        health: maxHealth,
        shots: maxBullets,
        bullets: [],
        state:-1    // neither good nor bad
    }
    players.push(player);
    /* for (var i = 0; i < 10; i++) {
        var player = {
            id: "-1",
            playerCurX: Math.random() * mapWidth,
            playerCurY: Math.random() * mapHeight,
            health: maxHealth,
            shots: maxBullets,
            bullets: []
        }
        players.push(player);
    } */
    // handle a player move
    socket.on('moving', function (data) {
        move(data, socket.id);
    });

    // handle a player shooting
    socket.on('shooting', function (data) {
        addBullet(data, socket.id);
    });
}

function disconnect(id) {
    // print the id of this client 
    console.log(id + " left");
    var siz = players.length;
    var idx;
    for (var i = 0; i < siz; i++) {
        if (players[i].id.localeCompare(id) == 0) { idx = i; break; }
    }
    //console.log(players[idx]);
    players.splice(idx, 1);
}

// move specific player on his mouse event
function move(data, id) {

    var idx;
    var siz = players.length;
    for (var i = 0; i < siz; i++) {
        if (players[i].id.localeCompare(id) == 0) { idx = i; break; }
    }
    if (players[idx].health > 0) {
        data.x = data.x * playerSpeed + players[idx].playerCurX;
        data.y = data.y * playerSpeed + players[idx].playerCurY;
        if (data.x + radBig >= mapWidth) data.x = mapWidth - radBig;
        if (data.x - radBig < 0) data.x = radBig;
        if (data.y + radBig >= mapHeight) data.y = mapHeight - radBig;
        if (data.y - radBig < 0) data.y = radBig;
        players[idx].playerCurX = data.x;
        players[idx].playerCurY = data.y;
    }
    send();
}

// move a bullet to specific player
function addBullet(data, id) {
    var idx;
    var siz = players.length;
    for (var i = 0; i < siz; i++) {
        if (players[i].id.localeCompare(id) == 0) { idx = i; break; }
    }
    if (players[idx].health > 0) {
        var bull = {
            Xnorm: data.Xnorm,
            Ynorm: data.Ynorm,
            Xcur: players[idx].playerCurX + Math.cos(data.bulletAngle * Math.PI / 180) * distToOrbit,
            Ycur: players[idx].playerCurY + Math.sin(data.bulletAngle * Math.PI / 180) * distToOrbit
        };
        if (players[idx].shots <= 0) return;
        players[idx].bullets.push(bull);
        players[idx].shots--;
        //console.log(players[idx].bullets);
    }
    send();
}

// collesion of bullets and players
function bulletsToPlayersCollesion() {
    var siz = players.length;
    for (var i = 0; i < siz; i++) {
        if (players[i].health <= 0) continue;
        var num = players[i].bullets.length;
        for (var j = 0; j < num; j++) {
            var bullet = players[i].bullets[j];
            var bx = bullet.Xcur;
            var by = bullet.Ycur;
            var f = 0;
            for (var k = 0; k < siz; k++) {
                if (k == i) continue;
                if (players[k].health <= 0) continue;
                var x = players[k].playerCurX, y = players[k].playerCurY;

                if ((x - bx) * (x - bx) + (y - by) * (y - by) <= radBig * radBig) {

                    players[k].health--;
                    f = 1;
                }
            }
            if (f == 1) {
                players[i].bullets.splice(j, 1);
                j--;
                num--;
            }

        }
    }
}

// collesion of objects and players
function objectsToPlayersCollesion() {
    var siz = objects.length;
    for (var i = 0; i < siz; i++) {
        var x = objects[i].curX;
        var y = objects[i].curY;
        var t = objects[i].type;
        var f = 0;
        var sizz = players.length;
        for (var j = 0; j < sizz; j++) {
            if (players[j].health <= 0) continue;
            var dist = (players[j].playerCurX - x) * (players[j].playerCurX - x) + (players[j].playerCurY - y) * (players[j].playerCurY - y);
            if (dist <= radBig * radBig)   // this player takes the object
            {
                f = 1;
                if (t == 0) // health
                {
                    players[j].health = Math.min(maxHealth, players[j].health + healthInc);
                }
                else    // bullets
                {
                    players[j].shots = Math.min(maxBullets, players[j].shots + bulletsInc);
                }
            }
        }
        if (f == 1) {
            objects.splice(i, 1);
            i--;
            siz--;
        }
    }
}

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}
// check if object can be put in (x,y)
function check(x, y) {
    var siz = players.length;
    for (var i = 0; i < siz; i++) {
        if (players[i].health <= 0) continue;
        var dist = (players[i].playerCurX - x) * (players[i].playerCurX - x) + (players[i].playerCurY - y) * (players[i].playerCurY - y);
        if (dist <= (radBig + radObject) * (radBig + radObject)) return 0;
    }
    var siz = objects.length;
    for (var i = 0; i < siz; i++) {
        var dist = (objects[i].CurX - x) * (objects[i].CurX - x) + (objects[i].CurY - y) * (objects[i].CurY - y);
        if (dist <= (radObject + radObject) * (radObject + radObject)) return 0;
    }
    return 1;
}
// generate random object(health or bullets) in random time
function genObject() {
    var siz = objects.length;
    if (siz >= 10) return;
    var rnd = getRandomInt(10000);
    if (rnd >= 10) return;
    var t = getRandomInt(10); // 0 is health else is bullet
    if(t>0) t = 1;
    var x, y;
    var numOfTries = 10;
    for (var i = 0; i < numOfTries; i++) {
        var rndX = Math.random() * mapWidth;
        var rndY = Math.random() * mapHeight;
        if (check(rndX, rndY)) {
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
    objects.push(add);
}
// the game logic
setInterval(play, 20);
function play() {
    var idx;
    var siz = players.length;
    //check collesions
    objectsToPlayersCollesion();
    bulletsToPlayersCollesion();
    //move bullets
    for (var i = 0; i < siz; i++) {
        var num = players[i].bullets.length;
        for (var j = 0; j < num; j++) {
            var bullet = players[i].bullets[j];
            var bx = bullet.Xcur + bullet.Xnorm * distToMove;
            var by = bullet.Ycur + bullet.Ynorm * distToMove;
            if (bx < 0 || bx > mapWidth || by < 0 || by > mapHeight) {
                players[i].bullets.splice(j, 1);
                j--;
                num--;
            }
            else {
                players[i].bullets[j].Xcur = bx, players[i].bullets[j].Ycur = by;
            }
        }
    }
    genObject();
    send();
}

// send the data to clients side to be drawn
function send() {
    var data = {
        playersData: players,
        objectsData: objects
    }
    io.sockets.emit('newData', data);
}

