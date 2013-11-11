/// <reference path='../common/ojdomain.ts'/>


(function (OrderedJobsWrapperModule) {
    "use strict";

    var OrderedJobs = (function () {
        function OrderedJobs() {
        }
        OrderedJobs.prototype.register = function (dependentJob, independentJob) {
            OrderedJobsFD.register(dependentJob, independentJob);
        };

        //public register(job: string): void {
        //}
        OrderedJobs.prototype.sort = function () {
            var sortedJobs = "";

            OrderedJobsFD.sort(function (sortedJobsString) {
                sortedJobs = sortedJobsString;
            });

            return sortedJobs;
        };
        return OrderedJobs;
    })();
    OrderedJobsWrapperModule.OrderedJobs = OrderedJobs;
})(exports.OrderedJobsWrapperModule || (exports.OrderedJobsWrapperModule = {}));
var OrderedJobsWrapperModule = exports.OrderedJobsWrapperModule;

(function (OrderedJobsFD) {
    "use strict";

    var jobListRegister = [];

    function register(job, preJob) {
        console.log("register(job:", job, ", preJob:", preJob, ")");

        if (preJob && preJob.length > 0) {
            jobListRegister.push({ job: job, preJob: preJob });
        } else {
            jobListRegister.push({ job: job });
        }
    }
    OrderedJobsFD.register = register;

    function sort(outCallback) {
        console.log("sort()");

        createJobDefinitionList(function (jobDefinitionList) {
            sortJobDefinitions(jobDefinitionList, outCallback);
        });
    }
    OrderedJobsFD.sort = sort;

    function createJobDefinitionList(outCallback) {
        console.log("createJobDefinitionList()");

        //var jobDefinitionList: { job: string; preJobs: string[]; order: number }[];
        var jobDefinitionList = [];

        jobListRegister.forEach(function (jobListEntry) {
            var job = jobListEntry.job;
            var preJob = jobListEntry.preJob;
            var order = -1;

            if (preJob && preJob.length > 0) {
                var preJobFound = false;
                var i = 0;
                while (!preJobFound && i < jobDefinitionList.length) {
                    if (jobDefinitionList[i].job === preJob) {
                        preJobFound = true;
                    }
                    i++;
                }
                if (!preJobFound) {
                    jobDefinitionList.push({ job: preJob, preJobs: null, order: order });
                }
            }

            // add job
            // if job exists already in the list, only update preJob
            var jobFound = null;
            var i = 0;
            while (!jobFound && i < jobDefinitionList.length) {
                if (jobDefinitionList[i].job === job) {
                    jobFound = jobDefinitionList[i];
                }
                i++;
            }

            if (jobFound) {
                if (jobFound.preJobs) {
                    jobFound.preJobs.push(preJob);
                } else {
                    jobFound.preJobs = [preJob];
                }
            } else {
                var preJobs = preJob ? [preJob] : null;
                jobDefinitionList.push({ job: job, preJobs: preJobs, order: order });
            }
        });

        outCallback(jobDefinitionList);
    }

    function sortJobDefinitions(jobDefinitionList, outCallback) {
        console.log("sortJobDefinitions(jobDefinitionList)");

        var compareWithLastNumberAndMaxCount = new CompareWithLastNumberAndMaxCount();
        compareWithLastNumberAndMaxCount.initialize(jobDefinitionList);

        var outAllDoneCB = function (jobDefinitionList) {
            generateOrderString(jobDefinitionList, outCallback);
        };

        var notAllDoneButIncreasedCB = function (jobDefinitionList) {
            forEachJobMarkOrderIfPossible(jobDefinitionList, outCB2);
        };

        var jobsAreSortedCountCB = function (jobsAreSortedCount) {
            compareWithLastNumberAndMaxCount.process(jobsAreSortedCount, outAllDoneCB, notAllDoneButIncreasedCB);
        };

        var outCB2 = function (jobDefinitionList) {
            countJobsWhichAreSortedAlready(jobDefinitionList, jobsAreSortedCountCB);
        };

        forEachJobMarkOrderIfPossible(jobDefinitionList, outCB2);
    }

    // 3
    function forEachJobMarkOrderIfPossible(jobDefinitionList, jobDefinitionListCallback) {
        console.log("forEachJobMarkOrderIfPossible(jobDefinitionList)");

        var setOrderAndIncrement = new SetOrderAndIncrement();
        var testIfAllPreJobsAreDone = new TestIfAllPreJobsAreDone();
        testIfAllPreJobsAreDone.initialize(jobDefinitionList);

        forAllJobDefinitions(jobDefinitionList, function (jobDefinition) {
            testIfJobIsSorted(jobDefinition, function (jobDefinition) {
                testIfAllPreJobsAreDone.process(jobDefinition, function (jobDefinition) {
                    setOrderAndIncrement.process(jobDefinition, function () {
                    });
                });
            });
        }, function (jobDefinitionList) {
            jobDefinitionListCallback(jobDefinitionList);
        });
    }

    function countJobsWhichAreSortedAlready(jobDefinitionList, jobsAreSortedCountCallback) {
        console.log("countJobsWhichAreSortedAlready(jobDefinitionList)");

        var sortedJobs = jobDefinitionList.filter(function (jobDefinition) {
            return jobDefinition.order >= 0;
        });

        var jobsAreSortedCount = sortedJobs.length;
        jobsAreSortedCountCallback(jobsAreSortedCount);
    }

    var CompareWithLastNumberAndMaxCount = (function () {
        function CompareWithLastNumberAndMaxCount() {
        }
        CompareWithLastNumberAndMaxCount.prototype.initialize = function (jobDefinitionList) {
            console.log("CompareWithLastNumberAndMaxCount:initialize(jobDefinitionList)");
            this.numberOfSortedJobs = 0;
            this.maxJobsCount = jobDefinitionList.length;
            this._jobDefinitionList = jobDefinitionList;
        };

        CompareWithLastNumberAndMaxCount.prototype.process = function (jobsAreSortedCount, outAllDoneCallback, notAllDoneButIncreasedCallback) {
            console.log("CompareWithLastNumberAndMaxCount:process(jobsAreSortedCount: ", jobsAreSortedCount, ")");

            var LastNumberOfSortedJobs = this.numberOfSortedJobs;
            this.numberOfSortedJobs = jobsAreSortedCount;

            if (jobsAreSortedCount === this.maxJobsCount) {
                outAllDoneCallback(this._jobDefinitionList);
            } else {
                if (jobsAreSortedCount > LastNumberOfSortedJobs) {
                    notAllDoneButIncreasedCallback(this._jobDefinitionList);
                } else {
                    var errorMessage = "Exception at sort():\n";

                    this._jobDefinitionList.sort(function (left, right) {
                        return left.order === right.order ? 0 : (left.order < right.order ? -1 : 1);
                    });

                    this._jobDefinitionList.forEach(function (jobDefinition) {
                        errorMessage += jobDefinition.order > -1 ? jobDefinition.order + 1 + ".: " + jobDefinition.job : "! - " + jobDefinition.job + " => " + (jobDefinition.preJobs ? jobDefinition.preJobs.join(',') : "");
                        errorMessage += "\n";
                    });

                    throw new Error(errorMessage);
                }
            }
        };
        return CompareWithLastNumberAndMaxCount;
    })();

    function generateOrderString(jobDefinitionList, outCallback) {
        console.log("generateOrderString(jobDefinitionList)");
        var orderString = "";

        jobDefinitionList.sort(function (left, right) {
            return left.order === right.order ? 0 : (left.order < right.order ? -1 : 1);
        });

        jobDefinitionList.forEach(function (jobDefinition) {
            orderString += jobDefinition.job;
        });

        console.log("generateOrderString(jobDefinitionList): orderString: ", orderString);

        outCallback(orderString);
    }

    //4
    function forAllJobDefinitions(jobDefinitionList, outCallback, afterCallback) {
        console.log("forAllJobDefinitions(jobDefinitionList)");
        var self = this;
        jobDefinitionList.forEach(function (jobDefinition) {
            outCallback(jobDefinition);
        });

        afterCallback(jobDefinitionList);
    }

    function testIfJobIsSorted(jobDefinition, notSortedCallback) {
        console.log("testIfJobIsSorted(jobDefinition: ", jobDefinition, ")");

        if (jobDefinition.order === -1) {
            notSortedCallback(jobDefinition);
        }
    }

    var TestIfAllPreJobsAreDone = (function () {
        function TestIfAllPreJobsAreDone() {
        }
        TestIfAllPreJobsAreDone.prototype.initialize = function (jobDefinitionList) {
            console.log("TestIfAllPreJobsAreDone:initialize(jobDefinitionList)");
            this._jobDefinitionList = jobDefinitionList;
        };

        TestIfAllPreJobsAreDone.prototype.process = function (jobDefinition, allPreJobsDoneCallback) {
            console.log("TestIfAllPreJobsAreDone:process(jobDefinition: ", jobDefinition, ")");

            var preJobs = jobDefinition.preJobs;

            this._preJobsDone = true;
            var self = this;

            if (preJobs) {
                preJobs.forEach(function (preJob) {
                    var jobDefinition = null;
                    var i = 0;
                    while (!jobDefinition && i < self._jobDefinitionList.length) {
                        var jobDefinitionPreJob = self._jobDefinitionList[i];
                        if (jobDefinitionPreJob.job === preJob) {
                            jobDefinition = jobDefinitionPreJob;
                        }
                        i++;
                    }

                    if (jobDefinition.order === -1) {
                        self._preJobsDone = false;
                    }
                });
            }

            if (this._preJobsDone) {
                allPreJobsDoneCallback(jobDefinition);
            }
        };
        return TestIfAllPreJobsAreDone;
    })();

    var SetOrderAndIncrement = (function () {
        function SetOrderAndIncrement() {
        }
        SetOrderAndIncrement.prototype.process = function (jobDefinition, outCallback) {
            console.log("SetOrderAndIncrement:process(jobDefinition: ", jobDefinition, ")");

            //jobDefinition.order = this._nextOrderNumber;
            //this._nextOrderNumber++;
            jobDefinition.order = SetOrderAndIncrement.nextOrderNumber;
            SetOrderAndIncrement.nextOrderNumber++;
            console.log("SetOrderAndIncrement:process(jobDefinition): jobDefinition.order: ", jobDefinition.order);

            outCallback();
        };
        SetOrderAndIncrement.nextOrderNumber = 0;
        return SetOrderAndIncrement;
    })();
})(exports.OrderedJobsFD || (exports.OrderedJobsFD = {}));
var OrderedJobsFD = exports.OrderedJobsFD;

