class StreamChart{

    constructor(globalFlags, redrawOthers, data = globalFlags.data){
        this.globalFlags = globalFlags;
        this.redrawOthers = redrawOthers;
        this.data = data;
    }

    //draw function for this chart. do not call drawAll from here.
    draw(){
        console.log("drawing streamchart");
        // d3.select("#blah").data(globalFlags.grossing).enter().append()

        this.globalFlags.test = "true";
        this.redrawOthers(this)
    }
}