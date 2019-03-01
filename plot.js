// Create a namespace to contain all of the variables and functions.
var Plot = Plot || {};

// Create the SVG element that will contain the plot.
Plot.initialise = function(selector, model, width, height) {
    var container = d3.select(selector);
    var svg = container.append('svg')
        .attr('class', 'plot')
        .attr('preserveAspectRatio', 'xMinYMin')
        .attr("viewBox", "0 0 " + width + " " + height);
    var svg_group = svg.append('svg:g');

    return {
        model: model,
        width: width,
        height: height,
        // Set the default x-axis range to be double the infectious period.
        x_max: 2 * model.inv_gamma,
        container: container,
        svg: svg,
        svg_group: svg_group,
    };
};

// Initialise the plot for a new outbreak.
Plot.start_outbreak = function(plot) {
    Plot.reset_data(plot);
    // Set the default x-axis range to be double the infectious period.
    plot.x_max = 2 * model.inv_gamma;
    plot.axis.x = d3.scale.linear().domain([0, plot.x_max])
        .range([0, plot.width]);
    plot.axis.y = d3.scale.linear().domain([0, model.N])
        .range([plot.height, 0]);
    // Draw the bottom x-axis.
    plot.axis.x_bot = plot.svg_group.append("svg:line")
        .attr("class", "axis x");
    plot.axis.x_bot
        .attr("x1", 0)
        .attr("y1", plot.height)
        .attr("x2", plot.width)
        .attr("y2", plot.height);
    plot.axis.y_left = plot.svg_group.append("svg:line")
        .attr("class", "axis y");
    plot.axis.y_left
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", 0)
        .attr("y2", plot.height);
    plot.series.s = plot.svg_group.append('svg:path')
        .attr('class', 'series s');
    plot.series.i = plot.svg_group.append('svg:path')
        .attr('class', 'series i');
    plot.series.r = plot.svg_group.append('svg:path')
        .attr('class', 'series r');
    Plot.next_event(plot);
};

// Update the plot to depict the new event.
Plot.next_event = function(plot) {
    Plot.update_data(plot);

    var plot_line = d3.svg.line()
        .x(function(d) { return plot.axis.x(d.x); })
        .y(function(d) { return plot.axis.y(d.y); })
        .interpolate('step-after');

    plot.series.s.attr('d', plot_line(plot.s));
    plot.series.i.attr('d', plot_line(plot.i));
    plot.series.r.attr('d', plot_line(plot.r));
};

// Internal function: clear the plot data at the start of an outbreak.
Plot.reset_data = function(plot) {
    plot.svg_group.selectAll('*').remove();
    plot.time = [];
    plot.s = [];
    plot.i = [];
    plot.r = [];
    plot.axis = {};
    plot.series = {};
};

// Internal function: update the plot data in response to the new event.
Plot.update_data = function(plot) {
    var S = plot.model.state.filter(person => person == 0).length;
    var I = plot.model.state.filter(person => person == 1).length;
    var R = plot.model.state.filter(person => person == 2).length;
    plot.time.push(plot.model.t);
    plot.s.push({x: plot.model.t, y: S});
    plot.i.push({x: plot.model.t, y: I});
    plot.r.push({x: plot.model.t, y: R});

    if (plot.model.t > plot.x_max) {
        plot.x_max = plot.model.t + model.inv_gamma;
        plot.axis.x = d3.scale.linear().domain([0, plot.x_max])
            .range([0, plot.width]);
    }
};
