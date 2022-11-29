class StreamChart{

    constructor(globalFlags, redrawOthers){
        this.globalFlags = globalFlags;
        this.redrawOthers = redrawOthers;
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
    }

    drawStreamChart(){
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

        // Parse the Data

        // List of groups = header of the csv files
        //TODO: this needs to be genres
        let that = this;

        let grossingGenres = this.getAllGrossingGenres();
        
        this.allMoviesGenres = this.getAllMovieGenres();

        this.dateGenreRevMap = this.getTotalRevenueFromGenreByYear();
    
        const keys = this.allMoviesGenres;
        let parseTime = d3.timeParse("%B %d, %Y");

        // Add X axis
        const x = d3.scaleTime()
        .domain(d3.extent(this.globalFlags.grossing, function(d) { 
            return new Date(parseTime(d["Release Date"]));
        }))
        .range([ 0, width ]);
        svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x).ticks(5));

        let timeFormat = d3.timeFormat("%B %Y");
        let parseTime2 = d3.timeParse("%B %Y");

        let extent = d3.extent(this.globalFlags.grossing, function(d) { 
            return parseInt(d["World Sales (in $)"]);
        });
        console.log(extent);
        // Add Y axis
        const y = d3.scaleLinear()
        .domain(extent)
        .range([ height, 0 ]);

        svg.append("g")
        .call(d3.axisLeft(y));

        // color palette
        const color = d3.scaleOrdinal()
        .domain(keys)
        .range(['#e41a1c','#377eb8','#4daf4a','#984ea3','#ff7f00','#ffff33','#a65628','#f781bf']);

        let sortedData = Array.from(this.dateGenreRevMap.values()).sort((a,b) => {
            let date1 = new Date(a["date"]);
            let date2 = new Date(b["date"]);

            return date1 - date2;
        });

        console.log(sortedData);

        //stack the data?
        const stackedData = d3.stack()
        .offset(d3.stackOffsetSilhouette)
        .keys(keys).value((obj, key) => obj[key])
        (sortedData);

        console.log(stackedData);

        //Show the areas
        svg
        .selectAll("mylayers")
        .data(stackedData)
        .join("path")
        .attr("transform",
        `translate(100, -400)`)
        .style("stroke", "none")
        .style("fill", function(d) { 
            return color(d.key); })
            .attr("d", d3.area()
            .x(function(d) {
                let parseTime = d3.timeParse("%B %Y");
                return x(parseTime(d.data.date));
            })
            .y0(function(d) {
                return y(d[0]); 
            })
            .y1(function(d) {
                return y(d[1]); 
            })
        )
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
                return this.getMonthYear(d["Release Date"]);
            }
            return this.getMonthYear(d["released"]);
        });

        return groups;
    }

    getMonthYear(date){
        //Format Time Column to get Month and Year
        let parseTime = d3.timeParse("%B %d, %Y");
        let timeFormat = d3.timeFormat("%B %Y");

        return timeFormat(parseTime(date));
    }

    //get total genre revenue by totaling each movie's(that has that genre) contribution
    totalUpGenreRevenues(moviesFromMonthYear){
        let genreRevs = {};
        genreRevs.date = this.getMonthYear(moviesFromMonthYear[0]["Release Date"]);
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