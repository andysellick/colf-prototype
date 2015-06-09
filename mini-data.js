

/* ------------- IMAGES ---------------- */

var generalimages = ['ball.png']; //fixme could we just draw a circle for the ball?
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


/* ------------ OBJECT DATA ------------ */


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
    this.maxspeed = 10;
    this.decelerate = 0.05;
    this.angle;
    this.lastx; //fixme might need this
    this.lasty;
    this.origx; //stores where the ball started, in case it goes out of bounds
    this.origy;

    this.draw = function(){
        canvas_cxt.drawImage(this.sprite, this.spritex, this.spritey, this.spritewidth, this.spriteheight, this.xpos - (this.spritewidth / 2), this.ypos - (this.spriteheight / 2), this.objwidth, this.objheight);
    };
    this.moveBall = function(mousex,mousey,speed){
        var anglex = ball.xpos - mousex;
        var angley = ball.ypos - mousey;
        var theta = Math.atan2(angley,anglex) * 180 / Math.PI;
        if(theta > 360){
            theta = theta - 360;
        }
        if(theta < 0){
            theta = 360 + theta;
        }
        //fixme coordinate system seems to be rotated by 90 degrees for some reason, is screwing up other stuff

        //console.log(mousex,mousey,theta,speed);
        ball.angle = theta;
        ball.speed = speed;
        ball.origx = ball.xpos;
        ball.origy = ball.ypos;
        //console.log(ball.angle);
    },
    this.move = function(mousex,mousey){
        //if moving, keep moving, but reduce speed
        if(this.speed){
            this.lastx = this.xpos;
            this.lasty = this.ypos;
            this.xpos += Math.cos(this.angle*Math.PI/180) * this.speed;
            this.ypos += Math.sin(this.angle*Math.PI/180) * this.speed;
            this.speed = Math.max(this.speed -= this.decelerate,0);
        }
        //otherwise reset saved positions to the current, resting position
        else {
            this.origx = this.xpos;
            this.origy = this.ypos;
            this.lastx = this.xpos;
            this.lasty = this.ypos;
        }
    };
    //if the ball goes off the canvas, reset it
    this.checkBoundary = function(){
        if(this.xpos > canvas.width || this.xpos < 0 || this.ypos > canvas.height || this.ypos < 0){
            console.log('out of bounds');
            this.xpos = this.origx;
            this.ypos = this.origy;
            this.speed = 0;
        }
    }
}

//generic wall object
var wallobj = function(x1,y1,x2,y2){
    this.objtype = "wall";
    this.xpos;
    this.ypos;
    this.x1pos = x1;
    this.y1pos = y1;
    this.x2pos = x2;
    this.y2pos = y2;
    this.angle;
    this.boundleft;
    this.boundright;
    this.boundup;
    this.bounddown;
    this.objwidth;
    this.objheight;

    //draw - it's just a line
    this.draw = function(){
        canvas_cxt.beginPath();
        canvas_cxt.moveTo(this.x1pos,this.y1pos);
        canvas_cxt.lineTo(this.x2pos,this.y2pos);
        canvas_cxt.stroke();
    }
    //calculate the angle of the wall. This is stored and used later when determining the angle to bounce balls off
    this.doSetup = function(){
        var anglex = this.x1pos - this.x2pos;
        var angley = this.y1pos - this.y2pos;
        this.angle = Math.atan2(angley,anglex) * 180 / Math.PI;
        if(this.angle > 360){
            this.angle = this.angle - 360;
        }
        if(this.angle < 0){
            this.angle = 360 + this.angle;
        }
        //console.log(this.angle);
        //work out bounds of wall
        //fixme slight hack to give a straight line a boundary
        this.boundleft = Math.min(this.x1pos,this.x2pos);
        this.boundright = Math.max(this.x1pos,this.x2pos);
        this.boundup = Math.min(this.y1pos,this.y2pos);
        this.bounddown = Math.max(this.y1pos,this.y2pos);
        //fixme bit inefficient to store this information twice
        this.objwidth = this.boundright - this.boundleft;
        this.objheight = this.bounddown - this.boundup;
        this.xpos = this.boundleft; //fixme some inefficiency here, need an xpos and ypos to have generic draw functions for objects later
        this.ypos = this.boundup;
    }
    //if the object has been moved based on an x,y coord, update its position on the canvas
    this.updateObj = function(x,y){
        //work out the position of the exact mid point of the current obj
        var midx = this.xpos + (this.objwidth / 2);
        var midy = this.ypos + (this.objheight / 2);
        //work out the difference between that and the mouse, which we assume is the exact mid point of the new position
        var diffx = midx - x;
        var diffy = midy - y;
        //adjust each relevant attribute by that difference
        this.xpos -= diffx;
        this.ypos -= diffy;
        this.x1pos -= diffx;
        this.y1pos -= diffy;
        this.x2pos -= diffx;
        this.y2pos -= diffy;
        this.boundleft -= diffx;
        this.boundright -= diffx;
        this.boundup -= diffy;
        this.bounddown -= diffy;
    }

    this.doSetup();
}


//generic slope object
var slopeobj = function(x,y,w,h,dir){
    this.objtype = "slope";
    this.xpos = x;
    this.ypos = y;
    this.objwidth = w;
    this.objheight = h;
    this.slopedir = dir; //direction can be 1 (n), 2 (e), 3 (s), 4 (w). In each instance the direction is from up to down
    this.steepness = 1;
    this.boundup;
    this.boundright;
    this.bounddown;
    this.boundleft;
    this.angle;

    this.doSetup = function(){
        this.boundleft = this.xpos;
        this.boundright = this.xpos + this.objwidth;
        this.boundup = this.ypos;
        this.bounddown = this.ypos + this.objheight;

        switch(this.slopedir){
            case 1:
                this.angle = 270;
                break;
            case 2:
                this.angle = 0;
                break;
            case 3:
                this.angle = 90;
                break;
            case 4:
                this.angle = 180;
                break;
        }
        console.log('left:',this.boundleft,'right',this.boundright,'top',this.boundup,'bottom',this.bounddown);
    }

    this.draw = function(){
        /*
        canvas_cxt.fillStyle = '#00FF00';
        canvas_cxt.fillRect(this.boundleft,this.boundup,this.boundright,this.bounddown);
        */
        var grd = canvas_cxt.createLinearGradient(this.xpos,this.ypos + this.objheight, this.xpos,this.ypos); //add linear gradient, defaults to 1 (n)
        //console.log(this.xpos,this.ypos,this.objwidth,this.objheight);
        if(this.slopedir == 2){
            grd = canvas_cxt.createLinearGradient(this.xpos,this.ypos,this.xpos + this.objwidth,this.ypos);
        }
        else if(this.slopedir == 3){
            grd = canvas_cxt.createLinearGradient(this.xpos,this.ypos,this.xpos,this.ypos + this.objheight);
        }
        else if(this.slopedir == 4){
            grd = canvas_cxt.createLinearGradient(this.xpos + this.objwidth,this.ypos,this.xpos,this.ypos);
        }
        grd.addColorStop(0, '#88d595'); //light green
        //this.grd.addColorStop(0, '#FF0000');
        grd.addColorStop(1, '#75936f'); //dark green
        canvas_cxt.fillStyle = grd;
        //canvas_cxt.fill();
        canvas_cxt.fillRect(this.xpos,this.ypos,this.objwidth,this.objheight);
    }
    //if the object has been moved based on an x,y coord, update its position on the canvas
    this.updateObj = function(x,y){
        //work out the position of the exact mid point of the current obj
        var midx = this.xpos + (this.objwidth / 2);
        var midy = this.ypos + (this.objheight / 2);
        //work out the difference between that and the mouse, which we assume is the exact mid point of the new position
        var diffx = midx - x;
        var diffy = midy - y;
        //adjust each relevant attribute by that difference
        this.xpos -= diffx;
        this.ypos -= diffy;
        this.boundleft -= diffx;
        this.boundright -= diffx;
        this.boundup -= diffy;
        this.bounddown -= diffy;
    }


    this.doSetup();
}



var ball; //variable for the ball, will need more than one
//var walls = []; //stores all walls
//var slopes = []; //stores all slopes

var obstacles = []; //stores all walls, slopes, etc.


