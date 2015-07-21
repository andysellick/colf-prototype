//generic slope object
var slopeobj = function(x,y,w,h,dir,steepness){
    this.objtype = "slope";
    this.xpos = x;
    this.ypos = y;
    this.objwidth = w;
    this.objheight = h;

    this.slopedir = dir; //direction can be 1 (n), 2 (e), 3 (s), 4 (w). In each instance the direction is from up to down
    this.steepness = steepness;
    this.boundup;
    this.boundright;
    this.bounddown;
    this.boundleft;
    this.angle;

    this.perc_xpos;
    this.perc_ypos;
    this.perc_objwidth;
    this.perc_objheight;

    //do some initial calc to make the game responsive
    //this should only be called on object creation
    this.doPreSetup = function(){
        //coords are all percentages, convert these to actual numbers in relation to the current canvas size
        this.xpos = (canvas.width / 100) * this.xpos;
        this.ypos = (canvas.height / 100) * this.ypos;
        this.objwidth = (canvas.width / 100) * this.objwidth;
        this.objheight = (canvas.height / 100) * this.objheight;
    }

    //do some initial setup when the obj is created
    //this gets called again later on canvas resize
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
        
        //slopes are confusing
        //this is really hard to describe. A slope starts at up and descends to down, except we need to invert all the angles to allow the ball to interact with them correctly
        switch(this.slopedir){
            case 1: //from bottom (up) to top (down)
                this.angle = 270; //actually 90
                break;
            case 2: //from left (up) to right (down)
                this.angle = 0; //actually 180
                break;
            case 3: //from top (up) to bottom (down)
                this.angle = 90; //actually 270
                break;
            case 4: //from right (up) to left (down)
                this.angle = 180; //actually 0
                break;
        }
        console.log(this.angle);
        //console.log('left:',this.boundleft,'right',this.boundright,'top',this.boundup,'bottom',this.bounddown);
    }

    //using the percentage values for them, reposition all relevant attributes according to the new canvas size
    this.resizeObj = function(){
        this.xpos = (canvas.width / 100) * this.perc_xpos;
        this.ypos = (canvas.height / 100) * this.perc_ypos;
        this.objwidth = (canvas.width / 100) * this.perc_objwidth;
        this.objheight = (canvas.height / 100) * this.perc_objheight;
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
        if(lastx){
            var diffx = lastx - x; //work out the difference between previous and current mouse positions...
            var diffy = lasty - y;

            this.xpos -= diffx; //...then update relevant attributes accordingly
            this.ypos -= diffy;
            this.boundleft -= diffx;
            this.boundright -= diffx;
            this.boundup -= diffy;
            this.bounddown -= diffy;
        }

        /* temporarily disabled while i work out the resize
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
        */
    }
    //fixme need to adjust walls for resizing

    //not to be confused with the resizeObj function
    this.mouseResizeObj = function(x,y){
        console.log('mouseResizeObj ',x,y,lastx,lasty);
        if(x < this.xpos + this.objwidth && y < this.ypos + this.objheight){ //don't invert the object over itself
            if(lastx){
                var diffx = lastx - x;
                var diffy = lasty - y;

                this.xpos -= diffx;
                this.ypos -= diffy;
                
                this.objwidth += diffx;
                this.objheight += diffy;

                //update boundaries
                //fixme generic function for this as code duplicated elsewhere?
                this.boundleft = this.xpos;
                this.boundright = this.xpos + this.objwidth;
                this.boundup = this.ypos;
                this.bounddown = this.ypos + this.objheight;
            }
        }
    }

    //draw little box in the corner that will allow resizing
    this.drawResizeControl = function(){
        canvas_cxt.beginPath();
        canvas_cxt.rect(obstacles[editobj].xpos, obstacles[editobj].ypos, 30, 30);
        canvas_cxt.lineWidth = 2;
        canvas_cxt.strokeStyle = 'rgba(215,70,70,0.5)';
        canvas_cxt.stroke();
    }
    
    //check to see if the mouse is over the resize control
    this.onResizeControl = function(x,y){
        //rule out any possible collisions, remembering that all y numbers are inverted on canvas
        if(y < this.ypos) //player bottom edge is higher than object top edge
            return(0);
        if(y > this.ypos + 30) //player top edge is lower than obj bottom edge
            return(0);
        if(x > this.xpos + 30) //player left edge is to the right of obj right edge
            return(0);
        if(x < this.xpos) //player right edge is to the left of obj left edge
            return(0);
        return(1); //collision
    }

    this.doPreSetup();
    this.doSetup();
}
