﻿/// <reference path='FD/orderedJobs_FD.ts'/>


"use strict";

import orderedJobs = require("FD/orderedJobs_FD");
//import orderedJobs = require("orderedJobs_FD_EBC");


var OrderedJobsWrapperModule = orderedJobs.OrderedJobsWrapperModule;



// hide log messages
console.log = function () { };



export class Program {

    static main() {

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

    }

}

Program.main();
