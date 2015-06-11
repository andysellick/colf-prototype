

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
    
    //need to configure some initial values based on the size of the canvas. These will later be recalculated if the canvas is resized
    this.doSetup = function(xpos,ypos){
        this.maxspeed = (canvas.width / 100) * 1.67; //should be about 10px for a 600px canvas
        this.accelerate = (canvas.width / 100) * 0.16666666666666666666666666666667; //should be about 1 for a 600px canvas
        this.decelerate = (canvas.width / 100) * 0.0125; //should be about 0.075px for a 600px canvas
        //we need to do this as we're creating temporary ball objects for easy collision detection based on where the mouse click was
        if(!xpos){
            this.xpos = canvas.width / 2;
        }
        if(!ypos){
            this.ypos = canvas.width / 2;
        }
        this.objwidth = (canvas.width / 100) * 1.67; //10px on a 600px canvas
    }
    this.doSetup(xpos,ypos);

    //called just before canvas resize, stores all relevant attributes as a percentage of the canvas size, to recalculate them shortly when canvas resizes
    this.storePositions = function(){
        this.perc_xpos = (this.xpos / canvas.width) * 100;
        this.perc_ypos = (this.ypos / canvas.height) * 100;
        this.perc_objwidth = (this.objwidth / canvas.width) * 100;
        this.perc_speed = (this.speed / canvas.width) * 100;
        this.perc_maxspeed = (this.maxspeed / canvas.width) * 100;
        this.perc_accelerate = (this.accelerate / canvas.width) * 100;
        this.perc_decelerate = (this.decelerate / canvas.width) * 100;
        this.perc_lastx = (this.lastx / canvas.width) * 100;
        this.perc_lasty = (this.lasty / canvas.height) * 100;
        this.perc_origx = (this.origx / canvas.width) * 100;
        this.perc_origy = (this.origy / canvas.width) * 100;
    }
    //using the percentage values for them, reposition all relevant attributes according to the new canvas size
    this.resizeObj = function(){
        this.xpos = (canvas.width / 100) * this.perc_xpos;
        this.ypos = (canvas.width / 100) * this.perc_ypos;
        this.objwidth = (canvas.width / 100) * this.perc_objwidth;
        this.speed = (canvas.width / 100) * this.perc_speed;
        this.maxspeed = (canvas.width / 100) * this.perc_maxspeed;
        this.accelerate = (canvas.width / 100) * this.perc_accelerate;
        this.decelerate = (canvas.width / 100) * this.perc_decelerate;
        this.lastx = (canvas.width / 100) * this.perc_lastx;
        this.lasty = (canvas.width / 100) * this.perc_lasty;
        this.origx = (canvas.width / 100) * this.perc_origx;
        this.origy = (canvas.width / 100) * this.perc_origy;
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

    this.perc_x1pos;
    this.perc_y1pos;
    this.perc_x2pos;
    this.perc_y2pos;


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
        
        //set some stored values for what percentage of the canvas size key properties are, used on canvas resize
        //(number_one / number_two) * 100
        this.perc_x1pos = (this.x1pos / canvas.width) * 100;
        this.perc_y1pos = (this.y1pos / canvas.height) * 100;
        this.perc_x2pos = (this.x2pos / canvas.width) * 100;
        this.perc_y2pos = (this.y2pos / canvas.height) * 100;
    }
    this.doSetup();

    //using the percentage values for them, reposition all relevant attributes according to the new canvas size
    this.resizeObj = function(){
        this.x1pos = (canvas.width / 100) * this.perc_x1pos;
        this.y1pos = (canvas.height / 100) * this.perc_y1pos;
        this.x2pos = (canvas.width / 100) * this.perc_x2pos;
        this.y2pos = (canvas.height / 100) * this.perc_y2pos;
        this.doSetup();
    }
    //draw - it's just a line
    this.draw = function(){
        canvas_cxt.beginPath();
        canvas_cxt.moveTo(this.x1pos,this.y1pos);
        canvas_cxt.lineTo(this.x2pos,this.y2pos);
        canvas_cxt.stroke();
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

    this.perc_xpos;
    this.perc_ypos;
    this.perc_objwidth;
    this.perc_objheight;

    //do some initial setup when the obj is created
    this.doSetup = function(){
        this.boundleft = this.xpos;
        this.boundright = this.xpos + this.objwidth;
        this.boundup = this.ypos;
        this.bounddown = this.ypos + this.objheight;

        //set some stored values for what percentage of the canvas size key properties are, used on canvas resize
        //(number_one / number_two) * 100
        this.perc_xpos = (this.xpos / canvas.width) * 100;
        this.perc_ypos = (this.ypos / canvas.height) * 100;
        this.perc_objwidth = (this.objwidth / canvas.width) * 100;
        this.perc_objheight = (this.objheight / canvas.height) * 100;
        
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
        //console.log('left:',this.boundleft,'right',this.boundright,'top',this.boundup,'bottom',this.bounddown);
    }
    this.doSetup();

    //using the percentage values for them, reposition all relevant attributes according to the new canvas size
    this.resizeObj = function(){
        this.xpos = (canvas.width / 100) * this.perc_xpos;
        this.ypos = (canvas.height / 100) * this.perc_ypos;
        this.objwidth = (canvas.width / 100) * this.perc_objwidth;
        this.objheight = (canvas.width / 100) * this.perc_objheight;
        this.doSetup();
    }


    this.draw = function(){
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
        grd.addColorStop(1, '#75936f'); //dark green
        canvas_cxt.fillStyle = grd;
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
    //fixme need to adjust walls for resizing
}



var ball; //variable for the ball, will need more than one
//var walls = []; //stores all walls
//var slopes = []; //stores all slopes

var obstacles = []; //stores all walls, slopes, etc.


