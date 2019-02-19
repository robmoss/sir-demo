// Create a namespace to contain all of the variables and functions.

var SIR = SIR || {};

SIR.init_sliders = function(selector, param_vals, model) {
    var ctrls = d3.select(selector);
    // Set parameters to initial form values.
    var set_param = function() {
        return(function() {
            if (this.id in param_vals) {
                if (this.type === "range") {
                    if (this.min === this.max) {
                        var values = param_vals[this.id];
                        this.min = 0;
                        this.max = values.length - 1;
                        this.step = 1;
                        this.data = values;
                        // Pick the default initial value, if specified.
                        var def = values.findIndex(function(v) { return v.default; });
                        if (def >= 0) {
                            this.value = def;
                        }
                    }

                    // Display the parameter value.
                    var ix = parseInt(this.value);
                    var parent = d3.select(this.parentNode);
                    var label = parent.select(".show_value")[0][0];
                    if (this.data[ix].label !== undefined) {
                        label.textContent = this.data[ix].label;
                    } else {
                        label.textContent = this.data[ix].value;
                    }

                    // Update the parameter value.
                    model[this.id] = this.data[ix].value;
                    // TODO: reset the model state?
                    // SIR.reset(model);
                } else {
                    plot.params[this.id] = parseFloat(this.value);
                }
            }
        });
    };

    ctrls.selectAll('select').each(set_param());
    ctrls.selectAll('input').each(set_param());

    ctrls.selectAll('select').on("change.param_val", set_param());
    ctrls.selectAll('input').on("change.param_val", set_param());
    ctrls.selectAll('input').on("input.param_val", set_param());
};

SIR.reset = function(model) {
    model.state = new Uint8Array(model.N);
    for (var i = 0; i < model.state.length; i++) {
        model.state[i] = 0;
    }
    if (model.I0 >= model.N) {
        return;
    }
    var n_inf = 0;
    var tries = 0;
    var rand;
    while (n_inf < model.I0) {
        rand = Math.round(model.N * Math.random() - 0.5);
        if (model.state[rand] === undefined) {
            return;
        }
        if (model.state[rand] == 0) {
            model.state[rand] = 1;
            n_inf += 1;
        }
    }
};

SIR.model = function(R0, inv_gamma, N, I0) {
    // State vector for N individuals; 0 = S, 1 = I, 2 = R.
    var model = {state: [], R0: R0, inv_gamma: inv_gamma, N: N, I0: I0, t: 0.0};
    SIR.reset(model);
    // var i;
    // for (i = 0; i < state.length; i++) {
    //     state[i] = 0;
    // }
    // var n_inf = 0;
    // var rand;
    // while (n_inf < I0) {
    //     rand = Math.round((N + 1) * Math.random() - 0.5);
    //     if (state[rand] == 0) {
    //         state[rand] = 1;
    //         n_inf += 1;
    //     }
    // }
    return model;
};

SIR.update = function(model) {
    var rates = new Float64Array(2);
    var S = model.state.filter(person => person == 0).length;
    var I = model.state.filter(person => person == 1).length;
    var beta = model.R0 / model.inv_gamma;
    rates[0] = beta * I * S / (model.N - 1);
    rates[1] = I / model.inv_gamma;
    var net_rate = rates[0] + rates[1];
    // console.log("S = %d, I = %d, rates = %s", S, I, rates);
    if (net_rate > 0) {
        // Pick the time to the next event.
        var sample = Math.random();
        var dt = - Math.log(sample) / net_rate;
        // console.log("Sample = %f, dt = %f", sample, dt);
        model.t += dt;
        // Pick the type of event and to whom this event applies.
        var rand_event = net_rate * Math.random();
        var event_ix;
        var person_ix;
        var counter = 0;
        if (rand_event > rates[0]) {
            event_ix = 1;
            sample = Math.round(I * Math.random() + 0.5);
            // Find the Nth infectious individual.
            // console.log("Recover I #%d", sample);
            model.state.forEach((person, ix) => {
                if (person == 1) {
                    counter += 1;
                    if (counter == sample) {
                        model.state[ix] = 2;
                        person_ix = ix;
                        // console.log("Person #%d", person_ix);
                    }
                }
            });
        } else {
            event_ix = 0;
            sample = Math.round(S * Math.random() + 0.5);
            // Find the Nth susceptible individual.
            // console.log("Infect S #%d", sample);
            model.state.forEach((person, ix) => {
                if (person == 0) {
                    counter += 1;
                    if (counter == sample) {
                        model.state[ix] = 1;
                        person_ix = ix;
                        // console.log("Person #%d", person_ix);
                    }
                }
            });
        }
        return {event_ix: event_ix, person_ix: person_ix};
    } else {
        return null;
    }
};
