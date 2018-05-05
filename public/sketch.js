var socket;
var x, y, angle = 0, distToOrbit = 55, radSmall = 10, radMid = 50, radBig = 60;
var bullets = [];
var scoreElem;
var maxHealth = 10, rectWidth = 150, rectHeight = 5, distToHealth = 70;
var maxBullets = 100, bulletsWidth = 50, bulletsHeight = 10, distToBullets = 90;
var winWidth, winHeight;
var mapHeight = 2000, mapWidth = 2000;
var smallMapWidth = 200, smallMapHeight = 200;
var curState;
var alive, hasShots;
var radObject = 20
var myPos = {
  x: winWidth / 2,
  y: winHeight / 2
}
var maxSystemRoomsNumber = 10;
function setup() {
  // before user joins a room
  beforeGame();

  // load the images
  goodImg = loadImage("good.png"); 
  badImg = loadImage("bad.png");
  specialImg = loadImage("special.png");
  bulletsImg = loadImage("bullets.png");
  bulletImg = loadImage("bullet.png");
  healthImg = loadImage("heart.png");
  backgroundImg = loadImage("background.jpg");
  preMouseData = createVector(0, 0);

  // load the tracks
  shoutGun = loadSound('gun-gunshot-01.mp3');
  emptyGun = loadSound('emptyGun.mp3');

}
function beforeGame() {
  alive = 0;

  $('.message a').click(function () {
    $('.login-register').animate({ height: "toggle", opacity: "toggle" }, "slow");
  });

  $('#login-button').click(function () {
    $.ajax({
      url: 'http://localhost:3000/login',
      // dataType: "jsonp",
      data: {
        username: $('#login-uname').val(),
        password: $('#login-pwd').val()
      }
      , type: 'POST',
      success: function (data) {
        if (data.errorMsg != null) {
          alert(data.errorMsg);
        } else {
          // alert('Welcome : ' + data.username);
          // redirect to rooms
          viewRooms();
        }
      },
      error: function (error) {
        var ret = jQuery.parseJSON(error);
        console.log(ret);
      },
    });
  });

  $('#create-button').click(function () {
    $.ajax({
      url: 'http://localhost:3000/register',
      // dataType: "jsonp",
      data: {
        username: $('#uname').val(),
        password: $('#pwd').val()
      }
      , type: 'POST',
      success: function (data) {
        if (data.errorMsg != null) {
          alert(data.errorMsg);
        } else {
          // alert('Welcome : ' + data.username  + ' , msg : ' + data.msg);
          window.location.replace("http://localhost:3000");
        }
      },
      error: function (error) {
        var ret = jQuery.parseJSON(error);
        console.log(ret);
      },
    });
  });
  $("#guest-button").click(function () {
    viewRooms();
  });
}
function viewRooms() {
  $(".login-page").remove();
  // request to get the rooms
  $.getJSON('/rooms', function (data) {
    $('body').append('<div class="world"></div>');
    $("#defaultCanvas0").remove();
    $(".world").append('<div class="grid"></div>');
    $(".world").append('<div class="profile"></div>');
    $(".grid").append('<div class="work"><p id="availablerooms">Available Rooms</p></div>');
    if (data.type == 0) {
      $(".profile").append('<div class="work2"<p id="profile_label_div">Profile</p><div>');
      $(".profile").append('<span id="username_label">UserName: </span> <span id="username_text">' + data.username + '</span> <br><span id="coins_label">Coins: </span><span id="coins_text">' + data.coins + '</span><br><span id="points_label">Points: </span><span id="points_text">' + data.points + '</span><br>');
      $(".profile").append('<div id="wrapper_create_new_room"> <input id="minimumcost_input" type="text" class="form-control" placeholder="Minimum cost for entering the room" aria-describedby="basic-addon2" required> <button type="button" id="createnewroom" class="btn btn-info" onclick="requestToCreateRoom(this)">Create New Room</button></div>');
      $(".profile").append('<button type="button" id="logout_button" class="btn btn-info" onclick="logoutHandler(this)">Logout</button>')
    }
    for (var i in data['rooms']) {
      var room = data['rooms'][i];
      //type 0 login
      if (data.type == 0) {
        if (room.feature == 0) {
          $(".grid").append('<div class="item"><h3 class="room_name">' + room.name + '</h3> <div class="grid-container3"> <span id="sad_span">Sad</span><div class="progress"> <div class="progress-bar progress-bar-success progress-bar-striped" role="progressbar" aria-valuenow="40" aria-valuemin="0" aria-valuemax="100" style="width:'+ room.badPercent+'%">       <h6 class="room_bad">' + room.bad + '</h6>         </div>      </div></div>  <div class="grid-container4"> <span id="happy_span">Happy</span><div class="progress"> <div class="progress-bar progress-bar-success progress-bar-striped" role="progressbar" aria-valuenow="40" aria-valuemin="0" aria-valuemax="100" style="width:'+ room.goodPercent+'%">     <h6 class="room_good">' + room.good + '</h6> </div></div> </div><div class="grid-container2"><button type="button" id="good_button" class="btn btn-default" onclick="goodPlayer(this)">Happy</button><button type="button" id="bad_button" class="btn btn-default" onclick="badPlayer(this)">Sad</button></div><div class="grid-container1"><button type="button" id="ghost_button" class="btn btn-primary" onclick="becomeGhost(this)">Emoji <span class="tooltiptext" >-100 Coins</span></button><button type="button" id="extrashots_button" class="btn btn-success" onclick="extraShoots(this)">Extra Shots <span class="tooltiptext2">-50 Coins</span> </button></div></div>');

        }
        else if (room.feature == 1) {
          $(".grid").append('<div class="item"><h3 class="room_name">' + room.name + '</h3> <div class="grid-container3"> <span id="sad_span">Sad</span><div class="progress"> <div class="progress-bar progress-bar-success progress-bar-striped" role="progressbar" aria-valuenow="40" aria-valuemin="0" aria-valuemax="100" style="width:'+ room.badPercent+'%">      <h6 class="room_bad">' + room.bad + '</h6>         </div>      </div></div>  <div class="grid-container4"> <span id="happy_span">Happy</span><div class="progress"> <div class="progress-bar progress-bar-success progress-bar-striped" role="progressbar" aria-valuenow="40" aria-valuemin="0" aria-valuemax="100" style="width:'+ room.goodPercent+'%">      <h6 class="room_good">' + room.good + '</h6> </div></div> </div><div class="grid-container2"><button type="button" id="good_button" class="btn btn-default" onclick="goodPlayer(this)">Happy</button><button type="button" id="bad_button" class="btn btn-default" onclick="badPlayer(this)">Sad</button></div><div class="grid-container1"><button type="button" id="ghost_button" class="btn btn-primary" onclick="becomeGhost(this)" disabled="true">Emoji <span class="tooltiptext"  style="display:none" >-100 Coins</span></button><button type="button" id="extrashots_button" class="btn btn-success" onclick="extraShoots(this)">Extra Shots <span class="tooltiptext2">-50 Coins</span> </button></div></div>');
        } else if (room.feature == 2) {
          $(".grid").append('<div class="item"><h3 class="room_name">' + room.name + '</h3> <div class="grid-container3"> <span id="sad_span">Sad</span><div class="progress"> <div class="progress-bar progress-bar-success progress-bar-striped" role="progressbar" aria-valuenow="40" aria-valuemin="0" aria-valuemax="100" style="width:'+ room.badPercent+'%">      <h6 class="room_bad">' + room.bad + '</h6>         </div>      </div></div>  <div class="grid-container4"> <span id="happy_span">Happy</span><div class="progress"> <div class="progress-bar progress-bar-success progress-bar-striped" role="progressbar" aria-valuenow="40" aria-valuemin="0" aria-valuemax="100" style="width:'+ room.goodPercent+'%">      <h6 class="room_good">' + room.good + '</h6> </div></div> </div><div class="grid-container2"><button type="button" id="good_button" class="btn btn-default" onclick="goodPlayer(this)">Happy</button><button type="button" id="bad_button" class="btn btn-default" onclick="badPlayer(this)">Sad</button></div><div class="grid-container1"><button type="button" id="ghost_button" class="btn btn-primary" onclick="becomeGhost(this)">Emoji <span class="tooltiptext" >-100 Coins</span></button><button type="button" id="extrashots_button" class="btn btn-success" onclick="extraShoots(this)" disabled="true">Extra Shots <span class="tooltiptext2"  style="display:none">-50 Coins</span> </button></div></div>');
        }
        else if (room.feature == 3) {
          $(".grid").append('<div class="item"><h3 class="room_name">' + room.name + '</h3> <div class="grid-container3"> <span id="sad_span">Sad</span><div class="progress"> <div class="progress-bar progress-bar-success progress-bar-striped" role="progressbar" aria-valuenow="40" aria-valuemin="0" aria-valuemax="100" style="width:'+ room.badPercent+'%">      <h6 class="room_bad">' + room.bad + '</h6>         </div>      </div></div>  <div class="grid-container4"> <span id="happy_span">Happy</span><div class="progress"> <div class="progress-bar progress-bar-success progress-bar-striped" role="progressbar" aria-valuenow="40" aria-valuemin="0" aria-valuemax="100" style="width:'+ room.goodPercent+'%">      <h6 class="room_good">' + room.good + '</h6> </div></div> </div><div class="grid-container2"><button type="button" id="good_button" class="btn btn-default" onclick="goodPlayer(this)">Happy</button><button type="button" id="bad_button" class="btn btn-default" onclick="badPlayer(this)">Sad</button></div><div class="grid-container1"><button type="button" id="ghost_button" class="btn btn-primary" onclick="becomeGhost(this)" disabled="true">Emoji <span class="tooltiptext"  style="display:none">-100 Coins</span></button><button type="button" id="extrashots_button" class="btn btn-success" onclick="extraShoots(this)" disabled="true">Extra Shots <span class="tooltiptext2"  style="display:none">-50 Coins</span> </button></div></div>');
        }
      }
      else if (data.type == 1 && room.name <= maxSystemRoomsNumber) {
        $(".grid").append('<div class="item"><h3 class="room_name">' + room.name + '</h3> <div class="grid-container3"> <span id="sad_span">Sad</span><div class="progress"> <div class="progress-bar progress-bar-success progress-bar-striped" role="progressbar" aria-valuenow="40" aria-valuemin="0" aria-valuemax="100" style="width:'+ room.badPercent+'%">      <h6 class="room_bad">' + room.bad + '</h6>         </div>      </div></div>  <div class="grid-container4"> <span id="happy_span">Happy</span><div class="progress"> <div class="progress-bar progress-bar-success progress-bar-striped" role="progressbar" aria-valuenow="40" aria-valuemin="0" aria-valuemax="100" style="width:'+ room.goodPercent+'%">     <h6 class="room_good">' + room.good + '</h6> </div></div> </div><div class="grid-container2"><button type="button" id="good_button" class="btn btn-default" onclick="goodPlayer(this)">Happy</button><button type="button" id="bad_button" class="btn btn-default" onclick="badPlayer(this)">Sad</button></div><div class="grid-container1"><button type="button" id="ghost_button" disabled="true" class="btn btn-primary" onclick="becomeGhost(this)">Emoji <span class="tooltiptext"  style="display:none">-100 Coins</span> </button><button type="button" id="extrashots_button" disabled="true" class="btn btn-success" onclick="extraShoots(this)">Extra Shots <span class="tooltiptext2"  style="display:none">-50 Coins</span> </button></div></div>');
      }
      /*if(data.type==1){
        $("#ghost_button").attr("disabled", true); $("#extrashots_button").attr("disabled", true);
        $("#ghost_button").toggleClass("btn btn-default");
        $("#extrashots_button").toggleClass("btn btn-default");
       }
       */
    }
  });
}
function prepare(data) {
  createCanvas(windowWidth, windowHeight);
  winWidth = windowWidth, winHeight = windowHeight;
  background(0);

  // create connection with the server through client socket
  socket = io();
  socket.on("connect", function () {
    $.ajax({
      url: 'http://localhost:3000/create_socket',
      // dataType: "jsonp",
      data:
        {
          socket: socket.id
        }
      , type: 'POST',
      success: function (data) {
        socket.emit('room');
      },
      error: function (error) {
        var ret = jQuery.parseJSON(error);
      }
    });
    // set the function to handle the server comming data
    socket.on('newData', play);
    socket.on('endGame', endGame);
  });
  $(".world").remove();
  fill(0, 102, 153);
  textAlign(CENTER, CENTER);
  textSize(32);
  text('Waiting the room to complete', winWidth / 2, winHeight / 2);
}
function endGame() {
  alive = 0;
  hasShots = 0;
  socket.disconnect(true);
  viewRooms();
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
  else alive = 1;
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
    if(player.special == 1) image(specialImg, curX - radMid, curY - radMid, 2 * radMid, 2 * radMid);
    else if (player.type == 0) image(goodImg, curX - radMid, curY - radMid, 2 * radMid, 2 * radMid);
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
function draw() {
  if (alive == 0) return;
  // the data that will be send to the server
  var x = mouseX - myPos.x;
  var y = mouseY - myPos.y;
  if (x * x + y * y <= radBig * radBig)   // send the message to stop player
  {
    x = 0, y = 0;
  }
  var v = createVector(x, y);
  if (v.x != 0 || v.y != 0) v.normalize();
  if (Math.abs(preMouseData.x - x) <= 1e-6 && Math.abs(preMouseData.y - y) <= 1e-6) return;
  preMouseData = v;
  var data = {
    x: x,
    y: y
  }
  socket.emit('moving', data);

}




