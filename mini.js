var canvas;
var canvas_cxt;
var game = 0;
var gamepause = 0;
var gameloop;

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
            ball = 0;
            walls = [];

            lenny.objects.setupBall();
            lenny.objects.setupWalls();
            lenny.objects.setupSlopes();
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
        },
        setupSlopes: function(){
            slopes.push(new slopeobj(0,canvas.height / 2, canvas.width / 3, canvas.height / 2, 1));
            slopes.push(new slopeobj(canvas.width / 4 * 2,canvas.height / 2, canvas.width / 2, canvas.height / 2, 2));
            slopes.push(new slopeobj(10,canvas.height / 8, canvas.width / 5, canvas.height / 5, 3));
            slopes.push(new slopeobj(canvas.width / 2,canvas.height / 8, canvas.width / 5, canvas.height / 5, 4));
        }
    },
    game: {
        gameLoop: function(){ //put code in here that needs to run for the game to work
            if(game){
                lenny.general.clearCanvas(); //clear canvas, seems to be causing massive horrible flickering in firefox?

                ball.move();
                if(ball.speed){
                    lenny.game.checkCollisions();
                }

                for(var i = 0; i < slopes.length; i++){
                    slopes[i].draw();
                }
                for(var i = 0; i < walls.length; i++){
                    walls[i].draw();
                }
                ball.checkBoundary(); //need to do this last otherwise it causes a bug where balls right at the boundary but stopped by a wall cannot bounce off that wall if launched at full power
                ball.draw();

                if(!gamepause){
                    gameloop = setTimeout(lenny.game.gameLoop,15); //repeat
                }
                else {
                    clearTimeout(gameloop);
                }
            }
        },
        checkCollisions: function(){
            for(var i = 0; i < walls.length; i++){
                //if(lenny.game.checkCollision(walls[i],ball)){
                if(lenny.game.checkLinesIntersect(walls[i].x1pos,walls[i].y1pos,walls[i].x2pos,walls[i].y2pos,ball.xpos,ball.ypos,ball.lastx,ball.lasty)){
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
                        angle = lenny.maths.alterAngle(ball.angle,360,angle * 2);
                        //now move the ball back to where it was to prevent flipping over the line bug
                        //fixme need to do something better than this?
                        ball.xpos = ball.lastx;
                        ball.ypos = ball.lasty;
                        ball.angle = angle;
                        //console.log(ball.angle,ball.xpos,ball.lastx,ball.speed);
                    }
                }
            }
            for(var i = 0; i < slopes.length; i++){
                if(lenny.game.checkCollision(slopes[i],ball)){
                    //console.log('on a slope');
                    //compare ball angle with slope angle

                    //var angleDiff = lenny.maths.angleDiff(ball.angle,slopes[i].angle);
                    var angleDiff = lenny.maths.preserveAngleDiff(ball.angle,slopes[i].angle);
                    //console.log(angleDiff,ball.angle,'slope',slopes[i].angle);
                    /*
                    var turnby = (Math.abs(angleDiff) / 180) * 100; //slopes[i].steepness; //fixme need to adjust - the nearer to 0 the angleDiff is, the smaller this must be
                    turnby = (turnby / slopes[i].steepness) * 100;
                    */
                    var turnby = slopes[i].steepness;
                    console.log(turnby);
                    if(angleDiff < 0){
                        turnby = -turnby;
                    }

                    if(Math.abs(angleDiff) > 90){ //decrease speed if going up a slope
                        ball.speed = Math.max(0,ball.speed -= 0.2); //fixme should relate to slope steepness
                        ball.angle = lenny.maths.alterAngle(ball.angle,360,turnby);
                    }
                    else { //increase if going down
                        ball.speed = Math.min(ball.maxspeed,ball.speed += 0.2);
                        ball.angle = lenny.maths.alterAngle(ball.angle,360,turnby);
                    }

                    if(ball.speed == 0){
                        //console.log('wat');
                        ball.speed += 0.3;
                        ball.angle = slopes[i].angle; //fixme?
                    }
                }
            }
        },
        //check whether two lines intersect, e.g. the line of a wall and the path of the ball
        //https://gist.github.com/Joncom/e8e8d18ebe7fe55c3894
        checkLinesIntersect: function(p0_x, p0_y, p1_x, p1_y, p2_x, p2_y, p3_x, p3_y) {
            var s1_x, s1_y, s2_x, s2_y;
            s1_x = p1_x - p0_x;
            s1_y = p1_y - p0_y;
            s2_x = p3_x - p2_x;
            s2_y = p3_y - p2_y;
             
            var s, t;
            s = (-s1_y * (p0_x - p2_x) + s1_x * (p0_y - p2_y)) / (-s2_x * s1_y + s1_x * s2_y);
            t = ( s2_x * (p0_y - p2_y) - s2_y * (p0_x - p2_x)) / (-s2_x * s1_y + s1_x * s2_y);
             
            if (s >= 0 && s <= 1 && t >= 0 && t <= 1){
                return 1; // Collision detected
            }
            return 0; // No collision
        },
        //large scale simple collision checking function between ball and a simple object
        checkCollision: function(obj,ball){
            //rule out any possible collisions, remembering that all y numbers are inverted on canvas
            if(ball.ypos < obj.boundup) //player bottom edge is higher than object top edge
                return(0);
            if(ball.ypos > obj.bounddown) //player top edge is lower than obj bottom edge
                return(0);
            if(ball.xpos > obj.boundright) //player left edge is to the right of obj right edge
                return(0);
            if(ball.xpos < obj.boundleft) //player right edge is to the left of obj left edge
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

    //I'm not sure we want to do this - it resets the game
    $(window).on('resize',function(){
        //resetAndResize();
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
        if(ball.speed == 0){
            speed = 0;
            speedtimer = setInterval(increaseSpeed,80);
        }
    });
    $canvas.on('mouseup',function(e){
        if(ball.speed == 0){
            var offs = $(this).offset();
            clearInterval(speedtimer);
            ball.moveBall(e.pageX - offs.left,e.pageY - offs.top,speed);
        }
    });

    function increaseSpeed(){
        speed = Math.min(speed += 1, ball.maxspeed);
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


