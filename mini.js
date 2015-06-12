var canvas;
var canvas_cxt;
var idealcanvwidth = 600;
var idealcanvheight = 600;
var game = 0;
var gamepause = 0;
var gameloop;
var mode = 1; //1,2,3: playing, drawing or editing
var drawobj = 1; //defaults to wall
var currobj = []; //stores the existing attributes of an object being created
var editobj = -1; //the currently being edited object
var $editbox;

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
            var destwidth = idealcanvwidth;
            var destheight = idealcanvheight;
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
            //walls = [];
            obstacles = [];

            lenny.objects.setupBall();
            lenny.objects.setupObstacles();
        },
        resizeCanvas: function(){
            lenny.general.pauseGame();
            //clearTimeout(gameloop);
            ball.storePositions();
            lenny.general.initCanvasSize();
            lenny.general.clearCanvas();
            ball.resizeObj();
            for(var i = 0; i < obstacles.length; i++){
                obstacles[i].resizeObj();
            }
            //lenny.general.initGame();
            //lenny.game.gameLoop();
            lenny.general.resumeGame();
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
            ball = new ballobj();
        },
        //all coordinates are based not on pixels but the ideal size of the canvas, idealcanvwidth and idealcanvheight and then scaled accordingly
        setupObstacles: function(){
            //slopes
            obstacles.push(new slopeobj(200,0,200,200,3,10));
            //obstacles.push(new slopeobj(400,200,200,200,4,5));
            obstacles.push(new slopeobj(200,400,200,200,1,1));
            //obstacles.push(new slopeobj(0,200,200,200,2,5));

            //walls
            //obstacles.push(new wallobj(100,100,900,800));

            /* temp boundary */
            obstacles.push(new wallobj(10,10,580,10));
            obstacles.push(new wallobj(580,10,580,580));
            obstacles.push(new wallobj(580,580,10,580));
            obstacles.push(new wallobj(10,580,10,10));
        }
    },
    game: {
        gameLoop: function(){ //put code in here that needs to run for the game to work
            if(game){
                lenny.general.clearCanvas(); //clear canvas, seems to be causing massive horrible flickering in firefox?
                ball.move();
                //console.log(ball.angle);
                if(ball.speed){
                    lenny.game.checkCollisions();
                }
                for(var i = 0; i < obstacles.length; i++){
                    obstacles[i].draw();
                }

                //draw bounding box round element, if element being edited
                if(mode == 3 && editobj > -1){
                    canvas_cxt.beginPath();
                    canvas_cxt.rect(obstacles[editobj].xpos - 5, obstacles[editobj].ypos - 5, obstacles[editobj].objwidth + 10, obstacles[editobj].objheight + 10);
                    canvas_cxt.lineWidth = 2;
                    canvas_cxt.strokeStyle = 'rgba(215,70,70,0.5)';
                    canvas_cxt.stroke();
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
            for(var i = 0; i < obstacles.length; i++){
                var obst = obstacles[i];
                if(obst.objtype == "wall"){
                    //if(lenny.game.checkCollision(walls[i],ball)){
                    if(lenny.game.checkLinesIntersect(obst.x1pos,obst.y1pos,obst.x2pos,obst.y2pos,ball.xpos,ball.ypos,ball.lastx,ball.lasty)){
                        //work out which side of the wall the ball's last position was
                        //check if ball's current position is the other side of the wall
                        var d = ((ball.xpos - obst.x1pos) * (obst.y2pos - obst.y1pos)) - ((ball.ypos - obst.y1pos) * (obst.x2pos - obst.x1pos));
                        var lastd = ((ball.lastx - obst.x1pos) * (obst.y2pos - obst.y1pos)) - ((ball.lasty - obst.y1pos) * (obst.x2pos - obst.x1pos));
    
                        //if so, calculate angle ball should bounce off wall
                        //set ball angle, and it should bounce?
                        if(d > 0 && lastd < 0 || d < 0 && lastd > 0){
                            //console.log('ball:',ball.angle,'wall:',walls[i].angle);
                            //var angle = 180 - Math.abs(Math.abs(ball.angle - walls[i].angle) - 180);
                            var angle = lenny.maths.preserveAngleDiff(ball.angle,obst.angle);
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
                else if(obst.objtype == "slope"){
                    //if ball angle is 90, a slope running down in the opposite direction would have an angle of 270. A slope running in the same direction would have an angle of 90
                    if(lenny.game.checkCollision(obst,ball)){
                        //compare ball angle with slope angle
                        var angleDiff = lenny.maths.preserveAngleDiff(ball.angle,obst.angle);
                        console.log(angleDiff);
                        var angleMax = lenny.maths.alterAngle(angleDiff,360,180);
                        var turnby = obst.steepness / 2;
                        //console.log(turnby);
                        if(angleDiff < 0){
                            turnby = -turnby;
                        }

                        if(Math.abs(angleDiff) > 90){ //decrease speed if going up a slope
                            ball.speed = Math.max(0,ball.speed -= ((ball.decelerate * obst.steepness) / 4)); //fixme should relate to slope steepness
                            //ball.angle = lenny.maths.alterAngle(ball.angle,360,turnby); //fixme need to have a min value here so ball doesn't slightly curve back on itself
                        }
                        else { //increase if going down
                            ball.speed = Math.min(ball.maxspeed,ball.speed += 0.2); //fixme this shouldn't be a hardcoded value but it currently breaks if it isn't
                            //ball.angle = lenny.maths.alterAngle(ball.angle,360,turnby);
                        }
    
                        //fixme there's definitely a bug where a ball going up a slope pauses at the apex of its curve
                        if(ball.speed <= 0){ //fixme bug here - if wall on slope, ball bounces into it infinitely
                            //console.log('wat');
                            ball.speed += ball.accelerate;
                            var angle = lenny.maths.preserveAngleDiff(ball.angle,obst.angle);
                            if(angle < 0){
                                ball.angle = lenny.maths.alterAngle(ball.angle,360,180 - (-angle * 2));
                            }
                            else {
                                ball.angle = lenny.maths.alterAngle(ball.angle,360,-180 + (angle * 2));
                            }
                        }
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
    },
    editor: {
        //change between test, draw and edit modes
        switchModes: function(chosen){
            //console.log(chosen);
            mode = chosen;
            lenny.editor.clearEditControls();
        },
        drawObj: function(xpos,ypos){
            //console.log(drawobj);
            if(drawobj == 1){ //draw a wall
                //console.log(xpos,ypos);
                obstacles.push(new wallobj(xpos,ypos,xpos + 50,ypos + 50));
                //fixme would be good to click twice, once to set each end of the wall, but this works for now
                //if(!currobj.len){
                    //currobj.push(
                //}
            }
            else if(drawobj == 2){ //draw a slope
                //console.log('a slope!');
                obstacles.push(new slopeobj(xpos,ypos, 100, 100, 1));
            }
        },
        //fixme need to adjust output in all boxes to use the new responsive 'percentage' values, not actual pixel values
        //fixme need to round the numbers otherwise browser doesn't like floats in a number input
        editObj: function(xpos,ypos){
            var matched = 0;
            var cursor = new ballobj(xpos,ypos);
            for(var i = 0; i < obstacles.length; i++){
                if(lenny.game.checkCollision(obstacles[i],cursor)){
                    matched = 1;
                    console.log(i);
                    break;
                }
            }
            if(matched){
                editobj = i;
                var obst = obstacles[editobj];
                //get editable attributes
                //put editable attributes into edit box
                //put remove button into edit box
                var attrs = [];
                //attr list: label, value, attribute name, max (optional)
                if(obst.objtype == "slope"){
                    attrs.push(['Width',obst.objwidth,'objwidth']);
                    attrs.push(['Height',obst.objheight,'objheight']);
                    attrs.push(['Steepness',obst.steepness,'steepness']);
                    attrs.push(['Slope direction (1 - 4)',obst.slopedir,'slopedir',4]);
                }
                else if(obst.objtype == "wall"){
                    attrs.push(['x1',obst.x1pos,'x1pos']);
                    attrs.push(['y1',obst.y1pos,'y1pos']);
                    attrs.push(['x2',obst.x2pos,'x2pos']);
                    attrs.push(['y2',obst.y2pos,'y2pos']);
                }
                $editbox.html('');
                //create elements to allow editing
                for(var i = 0; i < attrs.length; i++){
                    $('<label/>').html(attrs[i][0]).appendTo($editbox);
                    $('<input/>').attr('type','number').val(attrs[i][1]).attr('data-attr',attrs[i][2]).attr('min',0).attr('max',attrs[i][3]).appendTo($editbox);
                }
                $('<button/>').html('Remove').addClass('js-removeobj').appendTo($editbox);
            }
            else {
                lenny.editor.clearEditControls();
            }
        },
        //fixme actually only moves
        moveOrResize: function(x,y){
            var cursor = new ballobj(x,y);
            if(lenny.game.checkCollision(obstacles[editobj],cursor)){ //check to see if the cursor is inside the object
                obstacles[editobj].updateObj(x,y);
            }
        },
        //deselect all objects
        clearEditControls: function(){
            editobj = -1;
            $editbox.html('');
            obstacles.sort(lenny.editor.reSortObstacles);
        },
        //this is a bit of a temporary cludge, sorts all the obstacles so that walls get rendered on top of slopes
        reSortObstacles: function(a,b){
            if (a.objtype < b.objtype)
                return -1;
            if (a.objtype > b.objtype)
                return 1;
            return 0;
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
    var mousedown = 0;
    $editbox = $('#editable');
    var resize;

	$(window).on('resize',function(){
        clearTimeout(resize); //don't resize immediately
        resize = setTimeout(lenny.general.resizeCanvas,500);
	});

    //update attributes of an object in the editbox
    $editbox.on('change','input[type="number"]',function(){
        if(editobj != -1){
            var thisattr = $(this).data('attr');
            var thisval = parseInt($(this).val());
            obstacles[editobj][thisattr] = thisval;
            obstacles[editobj].doSetup();
        }
    });

    //remove selected obstacle
    $editbox.on('click','.js-removeobj',function(e){
        e.preventDefault();
        if(editobj != -1){
            obstacles.splice(editobj, 1);
            lenny.editor.clearEditControls();
        }
    });

    //used when dragging and dropping an obstacle in edit mode
    $canvas.mousemove(function(e){
        if(mousedown && editobj != -1){ //if an object has been selected and clicked on
            var offs = $(this).offset();
            var newxpos = e.pageX - offs.left;
            var newypos = e.pageY - offs.top;
            lenny.editor.moveOrResize(newxpos,newypos);
        }
    });

    $canvas.on('mousedown',function(e){
        mousedown = 1;
        if(mode == 1){
            if(ball.speed == 0){
                speed = 0;
                speedtimer = setInterval(increaseSpeed,80);
            }
        }
    });
    $canvas.on('mouseup',function(e){
        mousedown = 0;
        var offs = $(this).offset();
        if(mode == 1){
            if(ball.speed == 0){
                clearInterval(speedtimer);
                speed = ball.maxspeed; //temporary for testing
                ball.moveBall(e.pageX - offs.left,e.pageY - offs.top,speed);
            }
        }
        else {
            if(mode == 2){ //draw
                lenny.editor.drawObj(e.pageX - offs.left,e.pageY - offs.top);
            }
            else if(mode == 3){ //edit
                lenny.editor.editObj(e.pageX - offs.left,e.pageY - offs.top);
            }
        }
    });

    function increaseSpeed(){
        speed = Math.min(speed += ball.accelerate, ball.maxspeed);
    }

    $('.js-mode').on('click',function(){
        lenny.editor.switchModes($(this).val());
    });
    $('.js-draw').on('click',function(){
        drawobj = $(this).val();
    });

};


