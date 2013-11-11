/// <reference path='FD/orderedJobs_FD.ts'/>
"use strict";

var orderedJobs = require("./FD/orderedJobs_FD");

//import orderedJobs = require("orderedJobs_FD_EBC");
var OrderedJobsWrapperModule = orderedJobs.OrderedJobsWrapperModule;

// hide log messages
console.log = function () {
};

var Program = (function () {
    function Program() {
    }
    Program.main = function () {
        var orderedJobs = new OrderedJobsWrapperModule.OrderedJobs();

        orderedJobs.register('c');
        orderedJobs.register('b', 'a');
        orderedJobs.register('c', 'b');
        orderedJobs.register('d', 'b');
        orderedJobs.register('d', 'c');
        orderedJobs.register('e');
        orderedJobs.register('z', 'x');
        orderedJobs.register('w', 'z');
        orderedJobs.register('w', 'y');
        orderedJobs.register('v', 'w');
        orderedJobs.register('u', 'w');

        // for test -> to get an exception:
        //orderedJobs.register('z', 'u');
        var sortedJobs = orderedJobs.sort();
        console.info("orderedJobs: ", sortedJobs);
    };
    return Program;
})();
exports.Program = Program;

Program.main();

