var socket;
var x, y, angle = 0, distToOrbit = 55, radSmall = 10, radMid = 50, radBig = 60;
var bullets = [];
var scoreElem;
var maxHealth = 50, rectWidth = 150, rectHeight = 5, distToHealth = 70;
var maxBullets = 100, bulletsWidth = 50, bulletsHeight = 10, distToBullets = 90;
var winWidth, winHeight;
var mapHeight = 3000, mapWidth = 3000;
var smallMapWidth = 200, smallMapHeight = 200;
var curState;
var alive, hasShots;
var radObject = 20
var myPos = {
  x: winWidth / 2,
  y: winHeight / 2
}
function setup() {
  // before user joins a room
  beforeGame();

  // load the images
  goodImg = loadImage("good.png"); //todo : make it dependant on player
  badImg = loadImage("bad.png");
  bulletsImg = loadImage("bullets.png");
  bulletImg = loadImage("bullet.png");
  healthImg = loadImage("heart.png");

  // load the tracks
  shoutGun = loadSound('gun-gunshot-01.mp3');
  emptyGun = loadSound('emptyGun.mp3');

}
function beforeGame() {
  var content = [];
  alive = 0;
  $("#guest").click(function () {
    $(".container").remove();
    // request to get the rooms
    $.getJSON('/rooms', function (data) {

      $('body').append('<div id="grid"></div>');

      for (var i in data['rooms']) {
        var room = data['rooms'][i];
        content.push('<div class="element room"><h3 class="room_name">' + room.name + '</h3> <h6 class="room_bad">' + room.bad + '</h6><h6 class="room_good">' + room.good + '</h6><button type="button" id="good_button" onclick="goodPlayer(this)">Good</button><button type="button" id="bad_button" onclick="badPlayer(this)">Bad</button></div>');
      }

      $(function () {
        $('#grid').jresponsive({
          min_size: 50,
          max_size: 200,
          hspace: 50,
          vspace: 10,
          height: 200,
          class_name: 'element',
          content_array: content,
          transfromation: 'animate'
        });

      });




    });
  });
}
function prepare(data) {
  createCanvas(windowWidth, windowHeight);
  winWidth = windowWidth, winHeight = windowHeight;
  background(0);

  // create connection with the server through client socket
  socket = io.connect();

  // set the function to handle the server comming data
  socket.on('newData', play);
  socket.emit('room', data);
  $("#grid").remove();

  alive = 1;
  hasShots = 1;
}

function mouseMoved() {
  if (alive == 0) return;
  // the data that will be send to the server
  var data = {
    x: mouseX - myPos.x,
    y: mouseY - myPos.y
  }
  // send the message on the socket to the server
  socket.emit('moving', data);
}

function mouseClicked() {
  if (alive == 0) return;
  if (hasShots == 0) {
    emptyGun.play();
    return;
  }
  // when mouse cliked fire a bullet in the direction of the spinning ball
  var dx = x - myPos.x;
  var dy = y - myPos.y;
  //var d = Math.sqrt(x * x + y * y);
  //dx /= d, dy /= y;
  var bullet = { Xnorm: dx, Ynorm: dy, bulletAngle: angle };
  shoutGun.play();
  // send the message on the socket to the server
  socket.emit('shooting', bullet);
}

function play(data) {
  var players = data.playersData;
  var objects = data.objectsData;
  var idx;
  var siz = players.length;
  for (var i in players) {
    if (players[i].socketId.localeCompare(socket.id) == 0) { idx = i; break; }
  }
  noStroke();
  background(0);
  myPos = getPos(players[idx].playerCurX, players[idx].playerCurY);
  var mapPos = {
    x: players[idx].playerCurX,
    y: players[idx].playerCurY
  };

  if (players[idx].health <= 0) // game over for me
  {
    fill(0, 102, 153);
    textAlign(CENTER, CENTER);
    textSize(32);
    text('Game over for you', winWidth / 2, winHeight / 2);
    alive = 0;
  }
  if (players[idx].shots == 0) hasShots = 0;
  else hasShots = 1;
  // draw players
  for (var i in players) {
    if (idx == i) drawPlayer(players[i], 1, mapPos);
    else drawPlayer(players[i], 0, mapPos);
  }
  // draw objects
  siz = objects.length;
  for (var i in objects) {
    drawObject(objects[i], mapPos);
  }
  drawMap(players, objects, idx);
}

function drawPlayer(player, me, mPos) {
  if (player.health <= 0) return;
  var curX = player.playerCurX;
  var curY = player.playerCurY;
  var dx = curX - mPos.x;
  var dy = curY - mPos.y;
  var drawX = myPos.x + dx;
  var drawY = myPos.y + dy;
  if (drawX + radBig >= 0 && drawX - radBig < winWidth && drawY + radBig >= 0 && drawY - radBig < winHeight) {
    // draw the player
    fill(100, 0, 0);
    curX = drawX, curY = drawY;
    ellipse(curX, curY, 2 * radBig, 2 * radBig);
    if (player.type == 0) image(goodImg, curX - radMid, curY - radMid, 2 * radMid, 2 * radMid);
    else image(badImg, curX - radMid, curY - radMid, 2 * radMid, 2 * radMid);
    if (me == 1) {
      // move the fire circle around the player
      // this is shown for the owner
      x = curX + Math.cos(angle * Math.PI / 180) * distToOrbit;
      y = curY + Math.sin(angle * Math.PI / 180) * distToOrbit;
      angle += 0.4;
      if (angle == 360) angle = 0;
      fill(100, 100, 0);
      ellipse(x, y, radSmall, radSmall);
    }
    // draw health bar

    // Change color
    if (player.health < maxHealth / 4) {
      fill(255, 0, 0);
      curState = 0;
    }
    else if (player.health < maxHealth / 2) {
      fill(255, 200, 0);

      curState = 1;
    }
    else {
      fill(0, 255, 0);
      curState = 2;
    }
    // Get fraction 0->1 and multiply it by width of bar
    var drawWidth = (player.health / maxHealth) * rectWidth;
    rect(curX - rectWidth / 2, curY - distToHealth - rectHeight, drawWidth, rectHeight);

    // draw the bullets of this player

    //draw the bullets bar
    image(bulletsImg, curX - rectWidth / 2, curY - distToBullets, bulletsWidth, bulletsHeight);
    fill(0, 102, 153);
    textAlign(RIGHT, TOP);
    textSize(10);
    text(player.shots + "/" + maxBullets, curX + rectWidth / 2, curY - distToBullets);
  }
  bullets = player.bullets;
  var num = bullets.length;
  for (var j in bullets) {
    var bullet = bullets[j];
    var curX = bullet.Xcur;
    var curY = bullet.Ycur;
    var dx = curX - mPos.x;
    var dy = curY - mPos.y;
    var drawX = myPos.x + dx;
    var drawY = myPos.y + dy;
    //if (drawX < 0 || drawX >= winWidth || drawY < 0 || drawY >= winHeight) continue;
    fill(140, 0, 0);
    ellipse(drawX, drawY, radSmall, radSmall);
  }
}
function drawObject(ob, mPos) {
  var curX = ob.curX;
  var curY = ob.curY;
  var dx = curX - mPos.x;
  var dy = curY - mPos.y;
  var drawX = myPos.x + dx;
  var drawY = myPos.y + dy;
  if (drawX < 0 || drawX >= winWidth || drawY < 0 || drawY >= winHeight) return;
  if (ob.type == 0) // health
  {
    fill(0, 192, 255);
    image(healthImg, drawX - radSmall, drawY - radSmall, radSmall * 2, radSmall * 2);
  }
  else {  //bullets
    fill(120, 0, 0);
    ellipse(drawX, drawY, radObject, radObject);
    image(bulletImg, drawX - radSmall, drawY - radSmall, radSmall * 2, radSmall * 2);
  }
}

function getPos(x, y) {
  var myPos = {
    x: winWidth / 2,
    y: winHeight / 2
  };

  if (x + winWidth / 2 > mapWidth)
    myPos.x = winWidth - mapWidth + x;
  if (x - winWidth / 2 < 0)
    myPos.x = x;

  if (y + winHeight / 2 > mapHeight)
    myPos.y = winHeight - mapHeight + y;
  if (y - winHeight / 2 < 0)
    myPos.y = y;

  return myPos;
}
function drawMap(players, objects, me) {
  fill(150, 100);
  rect(0, winHeight - smallMapHeight, smallMapWidth, smallMapHeight);
  var siz = players.length;
  for (var i in players) {
    if (players[i].health <= 0) continue;
    if (players[i].type == 0) {
      fill(128, 0, 0, 100);
    }
    else {
      fill(0, 139, 139, 100);
    }
    ellipse(players[i].playerCurX * smallMapWidth / mapWidth, (players[i].playerCurY * smallMapHeight / mapHeight) + (winHeight - smallMapHeight), 10, 10);
  }
  var siz = objects.length;
  for (var i = 0; i < siz; i++) {
    if (objects[i].type == 0) fill(255, 215, 0, 100);
    else fill(46, 139, 87, 100);
    ellipse(objects[i].curX * smallMapWidth / mapWidth, (objects[i].curY * smallMapHeight / mapHeight) + (winHeight - smallMapHeight), 5, 5);
  }
}
function draw(players) {

}




