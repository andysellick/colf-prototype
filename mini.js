var canvas;
var canvas_cxt;
var game = 0;
var gamepause = 0;
var gameloop;

var generalimages = ['ball.png'];
generalimages = preloadImages(generalimages);

//preload images
function preloadImages(array){
    var imagedir = 'img/';
    var tempimg;
    for(i in array){
        tempimg = new Image();
        tempimg.src = imagedir + array[i];
        array[i] = tempimg;
    }
    return(array);
}

//object for the ball
var ballobj = function(x,y,w,h,sprite){
    this.xpos = x;
    this.ypos = y;
    this.objwidth = w;
    this.objheight = h;
    this.sprite = sprite;
    this.spritex = 0;
    this.spritey = 0;
    this.spritewidth = 10;
    this.spriteheight = 10;
    this.speed = 0;
    this.decelerate = 0.05;
    this.angle;
    this.lastx; //fixme might need this
    this.lasty;
    this.origx; //stores where the ball started, in case it goes out of bounds
    this.origy;

    this.draw = function(){
        canvas_cxt.drawImage(this.sprite, this.spritex, this.spritey, this.spritewidth, this.spriteheight, this.xpos - (this.spritewidth / 2), this.ypos - (this.spriteheight / 2), this.objwidth, this.objheight);
    };
    this.move = function(mousex,mousey){
        if(this.speed){
            this.lastx = this.xpos;
            this.lasty = this.ypos;
            this.xpos += Math.cos(this.angle*Math.PI/180) * this.speed;
            this.ypos += Math.sin(this.angle*Math.PI/180) * this.speed;
            this.speed = Math.max(this.speed -= this.decelerate,0);
        }
        else {
            this.origx = this.xpos;
            this.origy = this.ypos;
            this.lastx = this.xpos;
            this.lasty = this.ypos;
        }
    };
    this.checkBoundary = function(){
        if(this.xpos > canvas.width || this.xpos < 0 || this.ypos > canvas.height || this.ypos < 0){
            this.xpos = this.origx;
            this.ypos = this.origy;
            this.speed = 0;
        }
    }
}
var ball; //variable for the ball, will need more than one

//generic wall object
var wallobj = function(x1,y1,x2,y2){
    this.x1pos = x1;
    this.y1pos = y1;
    this.x2pos = x2;
    this.y2pos = y2;
    this.angle;
    this.boundleft;
    this.boundright;
    this.boundup;
    this.bounddown;

    this.draw = function(){
        canvas_cxt.beginPath();
        canvas_cxt.moveTo(this.x1pos,this.y1pos);
        canvas_cxt.lineTo(this.x2pos,this.y2pos);
        canvas_cxt.stroke();
    }
    this.calculateAngle = function(){
        var anglex = this.x1pos - this.x2pos;
        var angley = this.y1pos - this.y2pos;
        this.angle = Math.atan2(angley,anglex) * 180 / Math.PI;
        if(this.angle > 360){
            this.angle = this.angle - 360;
        }
        if(this.angle < 0){
            this.angle = 360 + this.angle;
        }

        console.log(this.angle);
        //work out bounds of wall
        //fixme slight hack to give a straight line a boundary
        this.boundleft = Math.min(this.x1pos - 5,this.x2pos -5);
        this.boundright = Math.max(this.x1pos + 5,this.x2pos + 5);
        this.boundup = Math.min(this.y1pos - 5,this.y2pos - 5);
        this.bounddown = Math.max(this.y1pos + 5,this.y2pos + 5);
    }
    this.calculateAngle();
}

var walls = []; //stores all walls

(function( window, undefined ) {
var lenny = {
    general: {
        //set up function, starts it off
        initialise: function(){
            canvas = document.getElementById('canvas');
            this.initCanvasSize();
            canvas_cxt = lenny.general.initCanvas(canvas,canvas_cxt);
            this.initGame();
            lenny.game.gameLoop();
        },
        initCanvasSize: function(){
            //ideal size for canvas
            var destwidth = 600;
            var destheight = 800;
            var aspect = Math.floor(($(window).height() / destheight) * destwidth);

            var cwidth = Math.min(destwidth, $(window).width());
            var cheight = Math.min(destheight, $(window).height());

            //resize the canvas to maintain aspect ratio depending on screen size
            canvas.width = Math.min($(window).width(),aspect);
            canvas.height = (canvas.width / destwidth) * destheight;
        },
        //initialise the canvas and return the canvas context
        initCanvas: function(canvas, cxt){
            if(canvas.getContext){
                cxt = canvas.getContext('2d');
            }
            else {
                $('#' + canvas).html("Your browser does not support canvas. Sorry.");
            }
            return cxt;
        },
        initGame: function(){
            game = 1;
            player = 0;
            enemies = [];
            objects = [];

            lenny.objects.setupBall();
            lenny.objects.setupWalls();
        },
        //pause the game for a few milliseconds
        pauseGame: function(){
            gamepause = 1;
            clearTimeout(gameloop);
            setTimeout(lenny.general.resumeGame,140);
        },
        //resume the game
        resumeGame: function(){
            gamepause = 0;
            gameloop = setTimeout(lenny.game.gameLoop,15);
        },
        endGame: function(){
            canvas_cxt.font = "30px Arial";
            canvas_cxt.fillStyle = "#000000";
            canvas_cxt.textAlign = "center";
            game = 0;
            player.score = player.score * level;
        },
        //completely clear the canvas
        clearCanvas: function(){
            canvas.width = canvas.width; //canvas can be reset simply by setting the width to the width!
            //fixme prob better to just overwrite the whole canvas with a background than bother clearing it
            //canvas_cxt.clearRect(0, 0, canvas.width, canvas.height);//clear the canvas
            //var w = canvas.width;
            //canvas.width = 1;
            //canvas.width = w;
        }
    },
    maths: {
        //find the shortest difference between two angles
        angleDiff: function(x,y){
            return(Math.abs(Math.min(Math.abs(x - y),Math.abs(Math.max(x,y) - 360) + Math.min(x,y))));
        },
        //find the shortest real difference between two angles
        //returns either a positive or negative value
        preserveAngleDiff: function(x,y){ //x must be the number we're calculating from
            var diff = y - x;
            if(diff < -180){
                diff += 360;
            }
            if(diff > 180){
                diff -= 360;
            }
            return(diff);
        },
        //given a number and a maximum value (beyond which we loop back to zero) change that number by a passed value (can be positive or negative)
        alterAngle: function(number,rangemax,changeby){
            number = number + changeby
            if(number > rangemax){
                number = number - rangemax;
            }
            if(number < 0){
                number = number + rangemax;
            }
            return(number);
        }        
    },
    objects: {
        setupBall: function(){
            ball = new ballobj(canvas.width / 2,canvas.height / 2,10,10,generalimages[0]);
        },
        setupWalls: function(){
            walls.push(new wallobj(canvas.width/4,canvas.height/8,canvas.width/4 * 3,canvas.height/8 * 2));
            walls.push(new wallobj(canvas.width/4,canvas.height/8 * 7,canvas.width/4 * 3,canvas.height/8 * 6));

            /* temp boundary */
            walls.push(new wallobj(5,5,canvas.width - 5,5));
            walls.push(new wallobj(canvas.width - 5,5,canvas.width - 5,canvas.height - 5));
            walls.push(new wallobj(canvas.width - 5,canvas.height - 5,5,canvas.height - 5));
            walls.push(new wallobj(5,canvas.height - 5,5,5));
        }
    },
    game: {
        gameLoop: function(){ //put code in here that needs to run for the game to work
            if(game){
                lenny.general.clearCanvas(); //clear canvas, seems to be causing massive horrible flickering in firefox?

                ball.move();
                ball.checkBoundary();
                if(ball.speed){
                    lenny.game.checkCollisions();
                }

                for(var i = 0; i < walls.length; i++){
                    walls[i].draw();
                }
                ball.draw();

                if(!gamepause){
                    gameloop = setTimeout(lenny.game.gameLoop,15); //repeat
                }
                else {
                    clearTimeout(gameloop);
                }
            }
        },
        moveBall: function(mousex,mousey,speed){
            var anglex = ball.xpos - mousex;
            var angley = ball.ypos - mousey;
            var theta = Math.atan2(angley,anglex) * 180 / Math.PI;
            if(theta > 360){
                theta = theta - 360;
            }
            if(theta < 0){
                theta = 360 + theta;
            }
    
            //console.log(mousex,mousey,theta,speed);
            ball.angle = theta;
            ball.speed = speed;
            ball.origx = ball.xpos;
            ball.origy = ball.ypos;
        },
        checkCollisions: function(){
            for(var i = 0; i < walls.length; i++){
                if(lenny.game.checkCollision(walls[i],ball)){
                    //console.log('collision');
                    //work out which side of the wall the ball's last position was
                    //check if ball's current position is the other side of the wall

                    var d = ((ball.xpos - walls[i].x1pos) * (walls[i].y2pos - walls[i].y1pos)) - ((ball.ypos - walls[i].y1pos) * (walls[i].x2pos - walls[i].x1pos));
                    var lastd = ((ball.lastx - walls[i].x1pos) * (walls[i].y2pos - walls[i].y1pos)) - ((ball.lasty - walls[i].y1pos) * (walls[i].x2pos - walls[i].x1pos));

                    //if so, calculate angle ball should bounce off wall
                    //set ball angle, and it should bounce?
                    if(d > 0 && lastd < 0 || d < 0 && lastd > 0){
                        //console.log('ball:',ball.angle,'wall:',walls[i].angle);
                        //var angle = 180 - Math.abs(Math.abs(ball.angle - walls[i].angle) - 180);
                        var angle = lenny.maths.preserveAngleDiff(ball.angle,walls[i].angle);
                        //var angle = angleDiff(ball.angle,walls[i].angle);
                        angle = lenny.maths.alterAngle(ball.angle,360,angle * 2);
                        //now move the ball back to where it was to prevent flipping over the line bug
                        //fixme need to do something better than this?
                        ball.xpos = ball.lastx;
                        ball.ypos = ball.lasty;

                        ball.angle = angle;
                    }
                }
            }
        },
        //large scale simple collision checking function between ball and a wall, defined by boundary area. If the ball is in this space proceed to more complex collision detection
        checkCollision: function(wall,ball){
            //rule out any possible collisions, remembering that all y numbers are inverted on canvas
            //player bottom edge is higher than object top edge
            if(ball.ypos < wall.boundup)
                return(0);
            //player top edge is lower than obj bottom edge
            if(ball.ypos > wall.bounddown)
                return(0);
            //player left edge is to the right of obj right edge
            if(ball.xpos > wall.boundright)
                return(0);
            //player right edge is to the left of obj left edge
            if(ball.xpos < wall.boundleft)
                return(0);
            return(1); //collision
        }

    }
};
window.lenny = lenny;
})(window);

//do stuff
window.onload = function(){
    lenny.general.initialise();
    var $canvas = $('#canvas');
    var speed;
    var speedtimer;

    $(window).on('resize',function(){
        resetAndResize();
    });
/*
    $canvas.mousemove(function(e){
        if(!player.active){
            var parentOffset = $(this).offset();
            var relX = e.pageX - parentOffset.left;
            player.xpos = parseInt(relX);
            //allow mouse to move player vertically as well for collision detection testing
            //var relY = e.pageY - parentOffset.top;
            //player.ypos = parseInt(relY);

        }
    });
*/
    $canvas.on('mousedown',function(e){
        speed = 0;
        speedtimer = setInterval(increaseSpeed,80);
    });
    $canvas.on('mouseup',function(e){
        var offs = $(this).offset();
        clearInterval(speedtimer);
        lenny.game.moveBall(e.pageX - offs.left,e.pageY - offs.top,speed);
    });

    function increaseSpeed(){
        speed = Math.min(speed += 1, 10);
        //console.log(speed);
    }

    function resetAndResize(){
        game = 0;
        //level = 1;
        //victory = 0;
        clearTimeout(gameloop);
        lenny.general.initCanvasSize();
        lenny.general.clearCanvas();
        lenny.general.initGame();
        lenny.game.gameLoop();
    }

};


