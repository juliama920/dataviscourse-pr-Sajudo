class StreamChart{

    constructor(globalFlags, redrawOthers){
        this.globalFlags = globalFlags;
        this.redrawOthers = redrawOthers;
        this.genre=['Action', 'Drama', 'Animation',  'Adventure',
        'Crime', 'Horror', 'Comedy', 'Biography' ,'Mystery', 'Fantasy']
    }

    //draw function for this chart. do not call drawAll from here.
    draw(){
        let streamChartSVG = d3.select(".streamChart");
        // streamChartSVG.append("circle").attr("cx", 100).attr("cy", 100).attr("r", 10);

        this.drawStreamChart();
        // this.drawMockChart();
        // streamChartSVG.selectAll("path").data(this.globalFlags).join("path").attr("fill", "steelblue").attr("d", 100).attr("r", 10);

        this.globalFlags.test = "true";
        // this.redrawOthers(this)
        this.registerEventListeners();
    }

    drawStreamChart(){
        d3.select(".streamChart").select("svg").remove();

       // set the dimensions and margins of the graph
        const margin = {top: 20, right: 30, bottom: 30, left: 90},
        width = 800 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

        // append the svg object to the body of the page
        const svg = d3.select(".streamChart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            `translate(${margin.left}, ${margin.top})`);

        svg
        .append('text')
        // .attr('id', 'testText')
        .text('Popularity (Genre Revenue)')
        .attr('transform', 'rotate(-90)')
        .attr('x', -320)
        .attr('y', -40)
        .attr('fill', 'black')
        .attr('font-size', '16px')
        .attr('font-weight','bold');

        svg.append('text')
        .text('Time in Years')
        .attr('transform', `translate(290,480)`)
        .attr('fill', 'black')
        .attr('font-size', '16px')
        .attr('font-weight','bold');
        
        //get keys, this gets an array of the movies genres
        this.allMoviesGenres = this.getAllMovieGenres();

        //sorted Array by date attribute of objects containing genre and their contributions per date
        let sortedData = this.getTotalRevenueFromGenreByYear();

        sortedData = sortedData.slice(1, sortedData.length - 2);

        //console.log(sortedData);

        // Add X axis
        const x = d3.scaleTime()
        .domain([new Date("1969"), new Date("2020")]).range([ 0, width ]);

        //add x axis
        svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x).ticks(5));

        // yScale for how much money a genre contributed
        const y = d3.scaleLinear()
        .domain([0, 60000000000])
        .range([ height, 0 ]);

        // //Add y axis
        // svg.append("g")
        // .call(d3.axisLeft(y));

        // color palette
        
        const color = d3.scaleOrdinal().domain(this.genre).range(d3.schemeCategory10);
        //this.allMoviesGenres

        //stack the data
        const stackedData = d3.stack()
        .offset(d3.stackOffsetSilhouette)
        .keys(this.genre).value((obj, key) => obj[key])
        (sortedData);
        //this.allMoviesGenres
        //console.log("sara",this.allMoviesGenres)
        //Show the areas
        svg
        .selectAll("mylayers")
        .data(stackedData)
        .join("path")
        .attr("transform",
        `translate(0, -200)`)
        .attr("id", d => d.key)
        .style("stroke", "none")
        .style("fill", function(d) { 
            return color(d.key); })
            .attr("d", d3.area()
            .x(function(d) {
                let parseTime = d3.timeParse("%Y");
                return x(parseTime(d.data.date));
            })
            .y0(function(d) {
                return y(d[0]); 
            })
            .y1(function(d) {
                return y(d[1]); 
            })
        );
    }

    //add event listeners
    registerEventListeners(){
        let paths =  d3.select(".streamChart").selectAll("path");
        paths.on("mouseover", e => {
            this.globalFlags.tooltipValues.Genre = e.target.id;
            this.globalFlags.toolTip.destroy();
            //this.allMoviesGenres
            const color = d3.scaleOrdinal().domain(this.genre).range(d3.schemeCategory10);
            paths.style("opacity", .3);
            d3.select(`#${this.globalFlags.Genre}`).style("opacity", 1);
            e.target.style.opacity = 1;
        }).on("mouseout", e => {
            paths.style("opacity", 1);
        }).on("click", e=> {
            paths.style("opacity", .3);
            this.globalFlags.Genre = e.target.id;
            e.target.style.opacity = 1;
            //console.log(this.globalFlags.Genre);
            this.globalFlags.barChart.draw();
        });

        d3.select(".streamChart").on("mousemove", e => {
            this.globalFlags.toolTip.draw(e.x, e.pageY);
        }).on("mouseenter", e => {
            this.globalFlags.tooltipValues = {};
        });
    }

    //Return Array containing all Genres that appear in grossing
    getAllGrossingGenres(){
        let genres = [];
        
        for(let row of this.globalFlags.grossing){
            let movieGenres = row["Genre"].replaceAll("[", "").replaceAll("]", "").replaceAll("'","").replaceAll(" ", "").split(",");

            for(let genre of movieGenres){
                if(!(genres.includes(genre))){
                    genres.push(genre);
                }
            }
        }

        return genres.sort();
    }

    //Get Gross revenue for year by genre
    getTotalRevenueFromGenreByYear(){
        //Create new object mapping month year dates to array of genre totals
        let groups = d3.rollup(this.globalFlags.combined, g => this.totalUpGenreRevenues(g), d=> {
            //Try and handle empty dates going into whichever month/year index
            if(d["Release Date"]){
                return this.getYear(d["Release Date"]);
            }
            return this.getYear(d["released"]);
        });

        return Array.from(groups.values()).sort((a,b) => {
            return new Date(a["date"]) - new Date(b["date"]);
        });
    }

    getMonthYear(date){
        //Format Time Column to get Month and Year
        return d3.timeFormat("%B %Y")(d3.timeParse("%B %d, %Y")(date));
    }
        
    //Format Time Column by Year
    getYear(date){
        return d3.timeFormat("%Y")(d3.timeParse("%B %d, %Y")(date));
    }

    //get total genre revenue by totaling each movie's(that has that genre) contribution
    totalUpGenreRevenues(moviesFromMonthYear){
        let genreRevs = {};
        genreRevs.date = this.getYear(moviesFromMonthYear[0]["Release Date"]);
        for(let genre of this.allMoviesGenres){
            genreRevs[genre] = 0;
            for(let movie of moviesFromMonthYear){
                if(movie.Genre.includes(genre)){
                    genreRevs[genre] += parseInt(movie["International Sales (in $)"]);
                }
            }
        }

        return genreRevs;
    }

    //Return Array containing all Genres that appear in movies
    getAllMovieGenres(){
        let genres = [];
        for(let row of this.globalFlags.movies){
            if(!genres.includes(row.genre)){
                genres.push(row.genre);
            }
        }

        return genres.sort();
    }
}