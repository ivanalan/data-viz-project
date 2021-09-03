var toolTip = d3.tip()
    .attr("class", "d3-tip")
    .offset([-12, 0])
    .html(function(d) {
        var duration = d['duration'];
        var mins = duration % 60;
        var hrs = Math.floor(duration / 60);
        return "<h5>" + d['title'] + "(" + d["year"] + ")" + "</h5>" +
            "<h6>" + "Duration: " + hrs + " hours, " + mins + " minutes" + "<h6>" +
            "<h6>" + "Imdb Score: " + d['score'] + "<h6>";
    });
var toolTip2 = d3.tip()
    .attr("class", "d3-tip")
    .offset([-12, 0])
    .html(function(d) {
        return "<h5>" + d['title'] + "</h5>"
    });

var padding = { t: 40, r: 40, b: 40, l: 40 };
var axisPadding = 20
var svg = d3.select('svg');
var colorScale = d3.scaleOrdinal(d3.schemeSet2);
var valueArr = [];
var scoreMap = new Map();


// Get layout parameters
var svgWidth = +svg.attr('width');
var svgHeight = +svg.attr('height');
var circleGroupPlaceHolder;
var circleGroup;

var actorsMap = new Map();
var numMoviesActedMap = new Map();

var chartG = svg.append('g')
    .attr('transform', 'translate(' + [padding.l, padding.t] + ')');


// Global x and y scales for duration and imdb score
var xScale = d3.scaleLinear().range([0, svgWidth - padding.l - axisPadding]).domain([10, 250]);
var yScale = d3.scaleLinear().range([svgHeight - padding.t - axisPadding - 40, 0]).domain([.8, 9.1]);

// axes 
var xAxis = d3.axisBottom(xScale).ticks(6);
var yAxis = d3.axisLeft(yScale).ticks(6);
var moviesData;
var csv = 'movies.csv';
let genreMap = new Map();
genreMap.set("All genres", 100);
let plotKeywordsMap = new Map();
let directorMap = new Map();
var currGenreSelectedSet = new Set();
var keyWordsArr = [];
var currSelectedRating = "All ratings";

var genreSelect = document.getElementById("genre-select");
var contentRatingSelect = document.getElementById("rating-select");
var selectedMovieGenre = "All genres";
var selectedDirector = "All directors";
//key is director, values are genre arr
let directorGenres = new Map();
let numMoviesDirected = new Map();
var minNumMoviesDirected = 0;
let newDirectorsMap = new Map();
var contentRatingSet = new Set();
contentRatingSet.add("All ratings");

newDirectorsMap.set("All directors", 100);
// Instantiate a slider
var scoreSlider = $("input#scoreSlider").bootstrapSlider();
var yearSlider = $("input#yearSlider").bootstrapSlider();

// set the dimensions and margins of the graph
var margin = { top: 10, right: 10, bottom: 10, left: 10 },
    width = 1100 - margin.left - margin.right,
    height = 450 - margin.top - margin.bottom;
// append the svg object to the body of the page
var svg2 = d3.select("#my_dataviz").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");
var layout;



// svg 3
var svg3 = d3.select('#chart3').append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

var chartG3 = svg3.append('g')
    .attr('transform', 'translate(' + [padding.l, padding.t] + ')');

function resetAll() {

}

function onGenreChanged() {
    var select = d3.select('#genre-select').node();
    // Get current value of select element
    var genre = select.options[select.selectedIndex].value;
    selectedMovieGenre = genre;
    updateCharts();
}

function onRatingChanged() {
    var select = d3.select('#rating-select').node();
    var r = select.options[select.selectedIndex].value;
    currSelectedRating = r;
    updateCharts();
}

function createOptionElement(value) {
    const newOption = document.createElement("option");
    newOption.setAttribute("value", value);
    var t = document.createTextNode(value);
    newOption.appendChild(t);
    return newOption;
}

d3.csv('movies.csv', dataPreprocessor).then(function(dataset) {
    //add default values for each genre 
    genreMap.forEach((value, key) => {
        genreSelect.appendChild(createOptionElement(key));
        currGenreSelectedSet.add(key);
    });
    contentRatingSet.forEach((value) => {
        contentRatingSelect.appendChild(createOptionElement(value));
    })

    moviesData = dataset;
    svg.call(toolTip);
    svg2.call(toolTip2)
    valueArr.sort(function(a, b) { return a - b });
    updateCharts();
});

function updateCharts() {
    //clear previous text
    keyWordsArr = [];
    svg.selectAll("text").remove();
    svg.selectAll("axis").remove();
    svg2.selectAll("text").remove();
    svg3.selectAll("text").remove();
    svg3.selectAll("axis").remove();
    valueArr = [];
    var facebookLikes = new Map();
    scoreMap = new Map();
    actorsMap = new Map();



    var genreE = document.getElementById("genre-select");
    var directorE = document.getElementById("director-select");
    var currSelectedGenre = genreE.options[genreE.selectedIndex].text;
    var scoreSliderVal = scoreSlider.bootstrapSlider('getValue');
    var yearSliderVal = yearSlider.bootstrapSlider('getValue');
    var lowerRange = yearSliderVal[0];
    var highestRange = yearSliderVal[1];
    var ratingLowestRange = scoreSliderVal[0];
    var ratingHighestRange = scoreSliderVal[1];
    console.log(currSelectedGenre);
    console.log(currSelectedRating);

    //first filter based on the YEAR slider values, then by imdb rating
    var filteredMovieData = moviesData.filter(function(d) {
        //genre filter
        if (currSelectedRating == "All ratings" || d["rating"] == currSelectedRating) {
            //yearfilter
            if (parseInt(d["year"]) >= (lowerRange) && parseInt(d["year"]) <= (highestRange)) {
                //imdb rating
                if (parseInt(d["score"]) >= ratingLowestRange && parseInt(d["score"]) <= ratingHighestRange) {
                    //category
                    if (currSelectedGenre == "All genres" || d["genres"].includes(currSelectedGenre)) {
                        valueArr.push(parseFloat(d["score"]));
                        scoreMap.set(parseFloat(d["score"]), d["title"]);
                        facebookLikes.set(d["title"], parseInt(d["facebookLikes"]));
                        d["plot_keywords"].forEach((value) => {
                            keyWordsArr.push(value);
                        });
                        if (d["actor1"] != "") {
                            actorsMap.set(d["actor1"], d["actor1Likes"]);
                        }
                        if (d["actor2"] != "") {
                            actorsMap.set(d["actor2"], d["actor2Likes"]);
                        }
                        if (d["actor3"] != "") {
                            actorsMap.set(d["actor3"], d["actor3Likes"]);
                        }

                        return d;
                    }
                }
            }
        }
    });
    var facebookSort = new Map([...facebookLikes.entries()].sort((a, b) => b[1] - a[1]));
    var topLimit1 = 19;
    var facebookSort2 = new Map();
    facebookSort.forEach((value, key) => {
        if (topLimit1 >= 0) {
            facebookSort2.set(key, value);
            topLimit1--;
        }
    })


    var topLimit = 19;
    var top20movies = filteredMovieData.filter(function(d) {
        if (topLimit >= 0 && facebookSort2.get(d["title"]) != null) {
            topLimit--;
            return d;
        }
    });
    var sortedmoviesData = top20movies.sort((a, b) => b["facebookLikes"] - a["facebookLikes"]);



    var mapSort1 = new Map([...scoreMap.entries()].sort((a, b) => b[1] - a[1]));
    var sortedActors = new Map([...actorsMap.entries()].sort((a, b) => b[1] - a[1]));

    //find worst movies and best movies to watch (for duration)
    //first get values
    valueArr.sort(function(a, b) { return a - b });

    var top5Vals = [];
    var bottom5Vals = [];
    var countLimit;
    if (valueArr.length < 10) {
        countLimit = valueArr.length;
    } else {
        countLimit = 5;
    }
    for (var c = 0; c < countLimit; c++) {
        bottom5Vals.push(valueArr[c]);
        top5Vals.push(valueArr[valueArr.length - c - 1]);
    }
    //then construct an array
    var bottom5Movies = [];
    var top5Movies = [];
    bottom5Vals.forEach((value) => {
        var movie = filteredMovieData.find(x => x["score"] == value);
        //since many movies have the same rating, find the next one
        if (movie != null && bottom5Movies.includes(movie["title"])) {
            var filteredArray = filteredMovieData.filter(function(obj) {
                return obj["score"] == value;
            });
            var newMovies = [];
            filteredArray.forEach((value) => {
                if (!bottom5Movies.includes(value["title"])) {
                    newMovies.push(value["title"]);
                }
            });
            bottom5Movies.push(newMovies[0]);
        } else if (movie != null) {
            bottom5Movies.push(movie["title"]);
        }
    });

    top5Vals.forEach((value) => {
        var movie = filteredMovieData.find(x => x["score"] == value);

        //since many movies have the same rating, find the next one
        if (movie != null && top5Movies.includes(movie["title"])) {
            var filteredArray = filteredMovieData.filter(function(obj) {
                return obj["score"] == value;
            });
            var newMovies = [];
            filteredArray.forEach((value) => {
                if (!top5Movies.includes(value["title"])) {
                    newMovies.push(value["title"]);
                }
            });
            top5Movies.push(newMovies[0]);
        } else if (movie != null) {
            top5Movies.push(movie["title"]);
        }
    });

    var topList = document.getElementById("bestValList");
    $('ol').empty();
    top5Movies.forEach((value) => {
        var listEl = document.createElement("LI");
        var t = document.createTextNode(value);
        listEl.appendChild(t);
        topList.appendChild(listEl);
    })

    var bottomList = document.getElementById("worstValList");
    bottom5Movies.forEach((value) => {
        var listEl = document.createElement("LI");
        var t = document.createTextNode(value);
        listEl.appendChild(t);
        bottomList.appendChild(listEl);
    })

    // -------------------------------------- scatterplot

    //append bottom axis
    chartG.append("g")
        .attr("transform", "translate(0," + (svgHeight - padding.b - 50) + ")")
        .attr("class", "axis")
        .call(xAxis);

    //append left axis
    chartG.append("g")
        .call(yAxis)
        .attr("class", "axis")
        .attr("transform", "translate(0,10)");

    //append y axis label
    svg.append('text')
        .attr('class', 'label')
        .attr('transform', 'translate(12,260) rotate(270)')
        .text("imdb score");

    //append x axis label
    svg.append('text')
        .attr('class', 'label')
        .attr('transform', 'translate(400, 490)')
        .text("Duration (minutes)");

    for (var b = 2010; b <= 2016; b++) {
        var xTranslate = 60 + ((b - 2010) * 110);
        svg.append('text')
            .attr('class', 'label')
            .attr('transform', 'translate(' + xTranslate + ', 20)')
            .text(b)
            .style("fill", colorScale("" + b))
            .attr("class", "legend");
    }

    //append and update circles
    circleGroup = chartG.selectAll(".circle-group")
        .data(filteredMovieData, function(d) {
            return d;
        });

    circleGroupPlaceHolder = circleGroup.enter()
        .append("g")
        .attr("class", "circle-group");


    circleGroupPlaceHolder.merge(circleGroup)
        .attr("transform", function(d) {
            return "translate(" + (xScale(d["duration"])) + ", " + (yScale(d["score"])) + ")";
        });

    circleGroupPlaceHolder.append("circle")
        .attr('r', 5)
        .attr("class", "dot")
        .style("fill", function(d) { return colorScale(d["year"]); })




    circleGroup.exit().remove();

    circleGroupPlaceHolder.on('mouseover', toolTip.show)
        .on('mouseout', toolTip.hide);

    // ----------------------------------------- bar chart

    //get extent of data

    // Create map for each attribute's extent
    var rangeLikes = d3.extent(sortedmoviesData, function(d) {
        return parseInt(d["facebookLikes"]);
    });
    rangeLikes.sort(function(a, b) { return a - b });

    //append bottom axis
    var left = 190;

    var xScale2 = d3.scaleLinear().range([0, width - margin.right - 300]);
    console.log(sortedmoviesData);
    console.log(rangeLikes);
    xScale2.domain(rangeLikes);

    var yScale2 = d3.scaleLinear().range([height - margin.bottom - 40, 0])
        .domain(sortedmoviesData.map(d => d["title"]));

    var yScaleBarChart = d3.scaleBand()
        .domain(sortedmoviesData.map(d => d["title"]))
        .range([height - margin.bottom - 40, 0])
        .padding(0.2);

    //append bottom axis
    chartG3.append("g")
        .attr("transform", "translate(" + left + ", " + (svgHeight - padding.b - 40) + ")")
        .attr("class", "axis")
        .call(d3.axisBottom(xScale2).ticks(5));

    //append left axis
    chartG3.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(" + left + ", -40)")
        .call(d3.axisLeft(yScaleBarChart));

    //append y axis label
    // svg3.append('text')
    //     .attr('class', 'label')
    //     .attr('transform', 'translate(12,260) rotate(270)')
    //     .text("title");

    //append x axis label
    svg3.append('text')
        .attr('class', 'label')
        .attr('transform', 'translate(600, 425)')
        .text("Duration (minutes)");


    //append and update bars
    barGroup = chartG3.selectAll(".bar-group")
        .data(sortedmoviesData, function(d) {
            return d;
        });

    barGroupPlaceHolder = barGroup.enter()
        .append("g")
        .attr("class", "bar-group");


    barGroupPlaceHolder.merge(barGroup)
        .attr("transform", function(d, i) {
            return "translate(" + 191 + ", " + (-33 + (i * 21)) + ")";
        });

    barGroupPlaceHolder.append("rect")
        .attr('width', function(d) {
            return xScale2(d["facebookLikes"]);
        })
        .attr('height', 10)
        .attr("class", "bar")
        .style("fill", function(d) { return colorScale(d["year"]); })

    barGroup.exit().remove();

    // ----------------------------------------- word cloud

    var tempMovies = filteredMovieData;
    var rand100Movies = tempMovies.splice(0, 100);

    // Constructs a new cloud layout instance. It run an algorithm to find the position of words that suits your requirements
    // Wordcloud features that are different from one word to the other must be here
    layout = d3.layout.cloud()
        .size([width, height])
        .words(rand100Movies.map(function(d) { return { text: d["plot_keywords"][0], title: d["title"] }; }))
        .padding(5) //space between words
        .fontSize(20) // font size of words
        .on("end", draw);
    layout.start();
}

// version 1:
function filter(map, pred) {
    const result = new Map();
    for (let [k, v] of map) {
        if (pred(k, v)) {
            result.set(k, v);
        }
    }
    return result;
}


// This function takes the output of 'layout' above and draw the words
// Better not to touch it. To change parameters, play with the 'layout' variable above
function draw(words) {
    svg2
        .append("g")
        .attr("transform", "translate(" + layout.size()[0] / 2 + "," + layout.size()[1] / 2 + ")")
        .selectAll("text")
        .data(words)
        .enter().append("text")
        .style("font-size", function(d) { return d.size + "px"; })
        .attr("text-anchor", "middle")
        .attr("transform", function(d) {
            return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
        })
        .on('mouseover', toolTip2.show)
        .on('mouseout', toolTip2.hide)
        .text(function(d) { return d.text; });
}

function getRandom(arr, n) {
    var result = new Array(n),
        len = arr.length,
        taken = new Array(len);
    if (n > len)
        throw new RangeError("getRandom: more elements taken than available");
    while (n--) {
        var x = Math.floor(Math.random() * len);
        result[n] = arr[x in taken ? taken[x] : x];
        taken[x] = --len in taken ? taken[len] : len;
    }
    return result;
}

function dataPreprocessor(row) {
    //create an array with genres
    var genres = row['genres'].split('|');
    genres.forEach(element => {
        var count = genreMap.get(element);
        if (count == null) {
            count = 1;
        } else {
            count++;
        }
        genreMap.set(element, count);
    });
    var actors = [];
    var actor1 = row['actor_1_name'];
    var actor2 = row['actor_2_name'];
    var actor3 = row['actor_3_name'];

    var actor1Score = row['actor_1_facebook_likes'];
    var actor2Score = row['actor_2_facebook_likes'];
    var actor3Score = row['actor_3_facebook_likes'];
    if (actor1 != "") {
        actors.push(actor1);
    }
    if (actor2 != "") {
        actors.push(actor2);
    }
    if (actor3 != "") {
        actors.push(actor3);
    }

    actors.forEach((value) => {
        if (numMoviesActedMap.get(value) != null) {
            numMoviesActedMap.set(value, numMoviesActedMap.get(value) + 1);
        } else {
            numMoviesActedMap.set(value, 1);
        }
    });

    //create an array with plot keywords
    var plotKeywords = row['plot_keywords'].split('|');
    plotKeywords.forEach(element => {
        var count = plotKeywordsMap.get(element);
        if (count == null) {
            count = 1;
        } else {
            count++;
        }
        plotKeywordsMap.set(element, count);
    });

    var currDirectorMovCount = directorMap.get(row["director_name"]);
    if (currDirectorMovCount == null) {
        currDirectorMovCount = 1;
    } else {
        currDirectorMovCount++;
    }

    //add all of the genres for each movie a director has filmed
    if (directorGenres.get(row["director_name"]) == null) {
        directorGenres.set(row["director_name"], genres);
    } else {
        var currDirectorGenresArr = directorGenres.get(row["director_name"]);
        genres.forEach(element => {
            if (!currDirectorGenresArr.includes(element)) {
                currDirectorGenresArr.push(element);
            }
        })
        directorGenres.set(row["director_name"], currDirectorGenresArr);
    }
    directorMap.set(row["director_name"], currDirectorMovCount);
    if (row["duration"] == 0 || row["title_year"] == "" || row["content_rating"] == "") {
        return;
    }
    var val = (row["imdb_score"]) / (row["duration"]);
    valueArr.push(parseFloat(row["imdb_score"]));
    plotKeywords.forEach((value) => {
        keyWordsArr.push(value);
    });
    scoreMap.set(parseFloat(row["imdb_score"]), row["movie_title"]);
    contentRatingSet.add(row["content_rating"]);

    return {
        'director': row["director_name"],
        'genres': genres,
        'plot_keywords': plotKeywords,
        'duration': row["duration"],
        'title': row["movie_title"],
        'score': row["imdb_score"],
        'actor1': actor1,
        'actor2': actor2,
        'actor3': actor3,
        'year': row["title_year"],
        'value': val,
        'rating': row["content_rating"],
        'actors': actors,
        'actor1Likes': actor1Score,
        'actor2Likes': actor2Score,
        'actor3Likes': actor3Score,
        'facebookLikes': row['movie_facebook_likes']
    };
}