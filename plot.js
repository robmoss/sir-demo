// Create a namespace to contain all of the variables and functions.
var Plot = Plot || {};

// Create the SVG element that will contain the plot.
Plot.initialise = function(selector, model, width, height, m_x, m_y) {
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
        margin_x: m_x,
        margin_y: m_y,
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
    Plot.define_axes(plot);
    // Create empty paths for each time series.
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

    var plot_line = d3.line()
        .x(function(d) { return plot.scale.x(d.x); })
        .y(function(d) { return plot.scale.y(d.y); })
        .curve(d3.curveStepAfter);

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
    plot.scale = {};
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
        plot.svg_group.selectAll('.axis.x').remove();
        plot.svg_group.selectAll('.axis.y').remove();
        Plot.define_axes(plot);
    }
};

// Internal function: (re)defined axis scales and (re)create axes.
Plot.define_axes = function(plot) {
    // Create the axis scales.
    plot.scale.x = d3.scaleLinear().domain([0, plot.x_max])
        .range([plot.margin_x, plot.width - plot.margin_x]);
    plot.scale.y = d3.scaleLinear().domain([0, model.N])
        .range([plot.height - plot.margin_y, plot.margin_y]);
    // Create the axis objects.
    plot.axis.x = d3.axisBottom(plot.scale.x);
    plot.axis.y = d3.axisLeft(plot.scale.y);
    plot.svg_group
        .append('g')
        .attr('class', 'axis x')
        .attr('transform', 'translate(0,' + (plot.height - plot.margin_y) + ')')
        .call(plot.axis.x);
    plot.svg_group
        .append('g')
        .attr('class', 'axis y')
        .attr('transform', 'translate(' + plot.margin_x + ',0)')
        .call(plot.axis.y);
};
