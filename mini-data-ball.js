
//object for the ball
var ballobj = function(xpos,ypos){
    this.xpos = xpos;
    this.ypos = ypos;
    this.objwidth;
    this.speed = 0;
    this.maxspeed;
    this.accelerate;
    this.decelerate;
    this.angle;
    this.lastx; //stores each moment the ball moves, used when bouncing off things
    this.lasty;
    this.origx; //stores where the ball started, in case it goes out of bounds
    this.origy;

    this.perc_xpos;
    this.perc_ypos;
    this.perc_objwidth;
    this.perc_speed;
    this.perc_maxspeed;
    this.perc_accelerate;
    this.perc_decelerate;
    this.perc_lastx;
    this.perc_lasty;
    this.perc_origx;
    this.perc_origy;
    this.onslope = 0;
    //fixme ball also needs a boundleft, right etc.
    
    //need to configure some initial values based on the size of the canvas. These will later be recalculated if the canvas is resized
    this.doSetup = function(xpos,ypos){
        this.maxspeed = (canvas.height / 100); //should be about 10px for a 1000px canvas
        this.accelerate = (canvas.height / 10000);
        this.decelerate = (canvas.height / 10000) * 0.5;
        //we need to do this as we're creating temporary ball objects for easy collision detection based on where the mouse click was
        if(!xpos){
            this.xpos = canvas.width / 2;
        }
        if(!ypos){
            this.ypos = canvas.height / 2;
        }
        this.objwidth = (canvas.height / 100) * 1.2; //12px on a 1000px canvas
    }
    this.doSetup(xpos,ypos);

    //called just before canvas resize, stores all relevant attributes as a percentage of the canvas size, to recalculate them shortly when canvas resizes
    this.storePositions = function(){
        this.perc_xpos = (this.xpos / canvas.width) * 100;
        this.perc_ypos = (this.ypos / canvas.height) * 100;
        this.perc_objwidth = (this.objwidth / canvas.height) * 100;
        this.perc_speed = (this.speed / canvas.height) * 100;
        this.perc_maxspeed = (this.maxspeed / canvas.height) * 100;
        this.perc_accelerate = (this.accelerate / canvas.height) * 100;
        this.perc_decelerate = (this.decelerate / canvas.height) * 100;
        this.perc_lastx = (this.lastx / canvas.width) * 100;
        this.perc_lasty = (this.lasty / canvas.height) * 100;
        this.perc_origx = (this.origx / canvas.width) * 100;
        this.perc_origy = (this.origy / canvas.height) * 100;
    }
    //using the percentage values for them, reposition all relevant attributes according to the new canvas size
    //note we use height to calculate some as height was used originally
    this.resizeObj = function(){
        this.xpos = (canvas.width / 100) * this.perc_xpos;
        this.ypos = (canvas.height / 100) * this.perc_ypos;
        this.objwidth = (canvas.height / 100) * this.perc_objwidth;
        this.speed = (canvas.height / 100) * this.perc_speed;
        this.maxspeed = (canvas.height / 100) * this.perc_maxspeed;
        this.accelerate = (canvas.height / 100) * this.perc_accelerate;
        this.decelerate = (canvas.height / 100) * this.perc_decelerate;
        this.lastx = (canvas.width / 100) * this.perc_lastx;
        this.lasty = (canvas.height / 100) * this.perc_lasty;
        this.origx = (canvas.width / 100) * this.perc_origx;
        this.origy = (canvas.height / 100) * this.perc_origy;
    }
    this.draw = function(){
        //canvas_cxt.drawImage(this.sprite, this.spritex, this.spritey, this.spritewidth, this.spriteheight, this.xpos - (this.spritewidth / 2), this.ypos - (this.spriteheight / 2), this.objwidth, this.objheight);
        var centerX = canvas.width / 2;
        var centerY = canvas.height / 2;
        var radius = 70;
        
        canvas_cxt.beginPath();
        canvas_cxt.arc(this.xpos, this.ypos, this.objwidth / 2, 0, 2 * Math.PI, false);
        canvas_cxt.fillStyle = 'green';
        canvas_cxt.fill();
    };

    this.moveBall = function(mousex,mousey,speed){
        var anglex = this.xpos - mousex;
        var angley = this.ypos - mousey;
        var theta = Math.atan2(angley,anglex) * 180 / Math.PI;
        if(theta > 360){
            theta = theta - 360;
        }
        if(theta < 0){
            theta = 360 + theta;
        }
        //fixme coordinate system seems to be rotated by 90 degrees for some reason, is screwing up other stuff

        //console.log(mousex,mousey,theta,speed);
        this.angle = theta;
        this.speed = speed;
        this.origx = this.xpos;
        this.origy = this.ypos;
    }
    this.move = function(){
        //if moving, keep moving, but reduce speed
        if(this.speed){
            this.lastx = this.xpos;
            this.lasty = this.ypos;
            this.xpos += Math.cos(this.angle*Math.PI/180) * this.speed;
            this.ypos += Math.sin(this.angle*Math.PI/180) * this.speed;
            if(!this.onslope){
                //console.log('slowing');
                this.speed = Math.max(this.speed -= this.decelerate,0); //reduce speed naturally unless we're on a slope
            }
        }
        //otherwise reset saved positions to the current, resting position
        else {
            this.origx = this.xpos;
            this.origy = this.ypos;
            this.lastx = this.xpos;
            this.lasty = this.ypos;
        }
        debug += "Ball: " + Math.round(ball.speed * 100) / 100 + ", " + Math.round(ball.angle * 100) / 100 + "<br/>";
    }

    //not yet in use - moving from the main file into here
    this.checkCollisions = function(){
        var collidedwith = -1;
        var obst = 0;
        var finalobst = 0;
        for(var i = 0; i < obstacles.length; i++){ //fixme may need to invert this loop
            //do the wall action calculation immediately
            obst = obstacles[i];
            if(obst.objtype == "wall"){
                if(lenny.game.checkLinesIntersect(obst.x1pos,obst.y1pos,obst.x2pos,obst.y2pos,ball.xpos,ball.ypos,ball.lastx,ball.lasty)){
                    //work out which side of the wall the ball's last position was, check if ball's current position is the other side of the wall
                    var d = ((ball.xpos - obst.x1pos) * (obst.y2pos - obst.y1pos)) - ((ball.ypos - obst.y1pos) * (obst.x2pos - obst.x1pos));
                    var lastd = ((ball.lastx - obst.x1pos) * (obst.y2pos - obst.y1pos)) - ((ball.lasty - obst.y1pos) * (obst.x2pos - obst.x1pos));
                    //if so, calculate angle ball should bounce off wall, set ball angle, and it should bounce
                    if(d > 0 && lastd < 0 || d < 0 && lastd > 0){
                        var angle = lenny.maths.preserveAngleDiff(ball.angle,obst.angle);
                        angle = lenny.maths.alterAngle(ball.angle,360,angle * 2);
                        //now move the ball back to where it was to prevent flipping over the line bug
                        ball.xpos = ball.lastx;
                        ball.ypos = ball.lasty;
                        ball.angle = angle;
                    }
                }
                obst = 0; //fixme need to reset this after one wall, otherwise below gets screwed up. Presumably a better way to do this is possible.
            }
            else {
                //fixme need to either order the obstacles or loop through them so at the end of the loop
                //we have the obstacle with the highest z-index - we don't want a slope beneath another slope
                //altering the ball movement
                if(lenny.game.checkCollision(obst,this)){
                    finalobst = obstacles[i];
                }
            }
        }
        //if the ball is over an obstacle (hopefully the highest one) adjust speed and angle accordingly
        if(finalobst){
            //if it's a slope, adjust ball angle and speed accordingly
            if(finalobst.objtype == "slope"){
                this.onslope = 1;
                debug += "Slope dir: " + finalobst.angle + ", steepness: " + finalobst.steepness + "<br/>";
                //compare ball angle with slope angle
                var angleDiff = lenny.maths.preserveAngleDiff(this.angle,finalobst.angle);
                var absAngleDiff = Math.abs(angleDiff);

                debug += "Anglediff: " + angleDiff + "<br/>";
                //var angleMax = lenny.maths.alterAngle(angleDiff,360,180);

                //this bit calculates a value between 0 and 1 for the relation between the angle of the ball and slope.
                //should tend towards 0 the closer it is to the slope angle (both going up and going down) and towards 1 if it is perpendicular to the slope
                var tmp = absAngleDiff;
                if(absAngleDiff > 90){
                    var tmp = absAngleDiff - 90;
                }
                else {
                    tmp = 90 - tmp;
                }
                var percang = (tmp / 90); //almost but not exactly a percentage (number_one / number_two) * 100
                percang = 1 - percang;
                debug += "percang: " + percang + "<br/>";

                //now work out the ball speed as a percentage of possible ball speed and apply that as well
                var percspeed = 1 - (this.speed / this.maxspeed);
                //debug += "percspeed: " + percspeed + "<br/>";

                var adjustedslope = (finalobst.steepness / 10);
                var turnby = (adjustedslope * (percang + percspeed)) * 4;
                //console.log(adjustedslope,turnby);
                if(angleDiff < 0){
                    turnby = -turnby;
                }

                if(absAngleDiff > 90){ //decrease speed if going up a slope
                    this.speed = Math.max(0,this.speed -= (this.decelerate * (1.2 + adjustedslope)));
                    this.angle = lenny.maths.alterAngle(this.angle,360,turnby); //fixme need to have a min value here so ball doesn't slightly curve back on itself
                }
                else if(absAngleDiff <= 180){ //increase if going down
                    this.speed = Math.min(this.maxspeed,this.speed += (this.accelerate * (1 + adjustedslope)));
                    this.angle = lenny.maths.alterAngle(this.angle,360,turnby);
                }
                //fixme there's definitely a bug where a ball going up a slope pauses at the apex of its curve
                if(this.speed <= 0){ //fixme bug here - if wall on slope, ball bounces into it infinitely
                    console.log('turning');
                    this.speed = this.accelerate;
                    //this.angle = lenny.maths.alterAngle(angleDiff,360,180); //if the ball has completely stopped it should simply roll directly down the slope, not turn
                    this.angle = finalobst.angle;
                    /*
                    if(angleDiff < 0){
                        this.angle = lenny.maths.alterAngle(this.angle,360,180 - (-angleDiff * 2));
                    }
                    else {
                        this.angle = lenny.maths.alterAngle(this.angle,360,-180 + (angleDiff * 2));
                    }
                    */
                }
            }
            //fixme add other property checks here e.g. sand
        }
        else {
            this.onslope = 0;
        }
        debug += "Onslope: " + this.onslope + "<br/>";
    }


    //if the ball goes off the canvas, reset it to where it started from
    this.checkBoundary = function(){
        if(this.xpos > canvas.width || this.xpos < 0 || this.ypos > canvas.height || this.ypos < 0){
            console.log('out of bounds');
            this.xpos = this.origx;
            this.ypos = this.origy;
            this.speed = 0;
        }
    }
}

