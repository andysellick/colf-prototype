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

    //do some initial calc to make the game responsive
    //this should only be called on game init
    this.doPreSetup = function(){
        //coords are all percentages, convert these to actual numbers in relation to the current canvas size
        this.x1pos = (canvas.width / 100) * this.x1pos;
        this.y1pos = (canvas.height / 100) * this.y1pos;
        this.x2pos = (canvas.width / 100) * this.x2pos;
        this.y2pos = (canvas.height / 100) * this.y2pos;
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
        //slight hack to give a straight line a boundary
        var extra = 10;
        this.boundleft = Math.min(this.x1pos - extra,this.x2pos  - extra);
        this.boundright = Math.max(this.x1pos + extra,this.x2pos + extra);
        this.boundup = Math.min(this.y1pos - extra,this.y2pos - extra);
        this.bounddown = Math.max(this.y1pos + extra,this.y2pos + extra);
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
    
    //draw little box in the corner that will allow resizing
    this.drawResizeControl = function(){
        canvas_cxt.beginPath();
        canvas_cxt.rect(obstacles[editobj].x1pos - 10, obstacles[editobj].y1pos - 10, 20, 20);
        canvas_cxt.lineWidth = 2;
        canvas_cxt.strokeStyle = 'rgba(215,70,70,0.5)';
        canvas_cxt.stroke();
    }

    //not to be confused with the resizeObj function
    this.mouseResizeObj = function(x,y){
        console.log('mouseResizeObj ',x,y,lastx,lasty);
        if(lastx){
            var diffx = lastx - x;
            var diffy = lasty - y;

            this.x1pos -= diffx;
            this.y1pos -= diffy;

            //update boundaries
            //fixme generic function for this as code duplicated elsewhere?
            var extra = 10;
            this.boundleft = Math.min(this.x1pos - extra,this.x2pos  - extra);
            this.boundright = Math.max(this.x1pos + extra,this.x2pos + extra);
            this.boundup = Math.min(this.y1pos - extra,this.y2pos - extra);
            this.bounddown = Math.max(this.y1pos + extra,this.y2pos + extra);
            //fixme bit inefficient to store this information twice
            this.objwidth = this.boundright - this.boundleft;
            this.objheight = this.bounddown - this.boundup;
            this.xpos = this.boundleft; //fixme some inefficiency here, need an xpos and ypos to have generic draw functions for objects later
            this.ypos = this.boundup;
        }
    }

    //check to see if the mouse is over the resize control
    this.onResizeControl = function(x,y){
        //rule out any possible collisions, remembering that all y numbers are inverted on canvas
        if(y < this.y1pos - 10) //player bottom edge is higher than object top edge
            return(0);
        if(y > this.y1pos + 10) //player top edge is lower than obj bottom edge
            return(0);
        if(x > this.x1pos + 10) //player left edge is to the right of obj right edge
            return(0);
        if(x < this.x1pos - 10) //player right edge is to the left of obj left edge
            return(0);
        return(1); //collision
    }

    this.doPreSetup();
    this.doSetup();

}
