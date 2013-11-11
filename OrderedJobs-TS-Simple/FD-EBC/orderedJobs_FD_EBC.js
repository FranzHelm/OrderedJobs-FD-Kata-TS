/// <reference path='../../../../TypeScript/DefinitelyTyped-master/node/node.d.ts'/>
/// <reference path='../common/ojdomain.ts'/>
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var events = require("events");



(function (OrderedJobsWrapperModule) {
    "use strict";

    var OrderedJobs = (function () {
        function OrderedJobs() {
        }
        OrderedJobs.prototype.register = function (dependentJob, independentJob) {
            var register = OrderedJobsFDEBC.register();

            register.process(dependentJob, independentJob);
        };

        //public register(job: string): void {
        //}
        OrderedJobs.prototype.sort = function () {
            var sortedJobs = "";

            var sort1 = new OrderedJobsFDEBC.Sort();

            sort1.on("out", function (sortedJobsString) {
                sortedJobs = sortedJobsString;
            });

            sort1.process();

            return sortedJobs;
        };
        return OrderedJobs;
    })();
    OrderedJobsWrapperModule.OrderedJobs = OrderedJobs;
})(exports.OrderedJobsWrapperModule || (exports.OrderedJobsWrapperModule = {}));
var OrderedJobsWrapperModule = exports.OrderedJobsWrapperModule;

(function (OrderedJobsFDEBC) {
    "use strict";

    console.info("EBC");

    function register() {
        return new Register();
    }
    OrderedJobsFDEBC.register = register;

    function sort() {
        return new Sort();
    }
    OrderedJobsFDEBC.sort = sort;

    var jobListRegister = [];

    var Register = (function (_super) {
        __extends(Register, _super);
        function Register() {
            _super.apply(this, arguments);
        }
        Register.prototype.process = function (job, preJob) {
            console.log("Register:process(job:", job, ", preJob:", preJob, ")");

            if (preJob && preJob.length > 0) {
                jobListRegister.push({ job: job, preJob: preJob });
            } else {
                jobListRegister.push({ job: job });
            }
        };
        return Register;
    })(events.EventEmitter);
    OrderedJobsFDEBC.Register = Register;

    var Sort = (function (_super) {
        __extends(Sort, _super);
        function Sort() {
            console.log("Sort:constructor()");

            var createJobDefinitionList = new CreateJobDefinitionList();
            var sortJobDefinitions = new SortJobDefinitions();
            this._firstTask = createJobDefinitionList;

            createJobDefinitionList.on("jobDefinitionList", sortJobDefinitions.process.bind(sortJobDefinitions));
            sortJobDefinitions.on("out", this.result.bind(this));

            _super.call(this);
        }
        Sort.prototype.result = function (sortedJobs) {
            console.log("Sort:result(sortedJobs:", sortedJobs, ")");
            this.emit('out', sortedJobs);
        };

        Sort.prototype.process = function () {
            console.log("Sort:process()");

            this._firstTask.process();
        };
        return Sort;
    })(events.EventEmitter);
    OrderedJobsFDEBC.Sort = Sort;

    var CreateJobDefinitionList = (function (_super) {
        __extends(CreateJobDefinitionList, _super);
        function CreateJobDefinitionList() {
            _super.apply(this, arguments);
        }
        CreateJobDefinitionList.prototype.process = function () {
            console.log("CreateJobDefinitionList:process()");

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

            this.emit('jobDefinitionList', jobDefinitionList);
        };
        return CreateJobDefinitionList;
    })(events.EventEmitter);

    var SortJobDefinitions = (function (_super) {
        __extends(SortJobDefinitions, _super);
        function SortJobDefinitions() {
            console.log("SortJobDefinitions:constructor()");

            var forEachJobMarkOrderIfPossible = new ForEachJobMarkOrderIfPossible();

            var countJobsWhichAreSortedAlready = new CountJobsWhichAreSortedAlready();
            var compareWithLastNumberAndMaxCount = new CompareWithLastNumberAndMaxCount();
            var generateOrderString = new GenerateOrderString();

            this._firstTask = forEachJobMarkOrderIfPossible;
            this._taskCompareWithLastNumberAndMaxCount = compareWithLastNumberAndMaxCount;

            forEachJobMarkOrderIfPossible.on("jobDefinitionList", countJobsWhichAreSortedAlready.process.bind(countJobsWhichAreSortedAlready));
            countJobsWhichAreSortedAlready.on("jobsAreSortedCount", compareWithLastNumberAndMaxCount.process.bind(compareWithLastNumberAndMaxCount));
            compareWithLastNumberAndMaxCount.on("notAllDoneButIncreased", forEachJobMarkOrderIfPossible.process.bind(forEachJobMarkOrderIfPossible));
            compareWithLastNumberAndMaxCount.on("allDone", generateOrderString.process.bind(generateOrderString));
            generateOrderString.on("out", this.result.bind(this));

            _super.call(this);
        }
        SortJobDefinitions.prototype.result = function (sortedJobs) {
            console.log("SortJobDefinitions:result(sortedJobs:", sortedJobs, ")");
            this.emit('out', sortedJobs);
        };

        SortJobDefinitions.prototype.process = function (jobDefinitionList) {
            console.log("SortJobDefinitions:process(jobDefinitionList)");

            this._taskCompareWithLastNumberAndMaxCount.initialize(jobDefinitionList);

            this._firstTask.process(jobDefinitionList);
        };
        return SortJobDefinitions;
    })(events.EventEmitter);

    // 3
    var ForEachJobMarkOrderIfPossible = (function (_super) {
        __extends(ForEachJobMarkOrderIfPossible, _super);
        function ForEachJobMarkOrderIfPossible() {
            console.log("ForEachJobMarkOrderIfPossible:constructor()");

            var forAllJobDefinitions = new ForAllJobDefinitions();
            var testIfJobIsSorted = new TestIfJobIsSorted();
            var testIfAllPreJobsAreDone = new TestIfAllPreJobsAreDone();
            var setOrderAndIncrement = new SetOrderAndIncrement();

            this._firstTask = forAllJobDefinitions;
            this._testIfAllPreJobsAreDone = testIfAllPreJobsAreDone;

            forAllJobDefinitions.on("out", testIfJobIsSorted.process.bind(testIfJobIsSorted));
            testIfJobIsSorted.on("notSorted", testIfAllPreJobsAreDone.process.bind(testIfAllPreJobsAreDone));
            testIfAllPreJobsAreDone.on("allPreJobsDone", setOrderAndIncrement.process.bind(setOrderAndIncrement));

            forAllJobDefinitions.on("after", this.result.bind(this));

            _super.call(this);
        }
        ForEachJobMarkOrderIfPossible.prototype.result = function (jobDefinitionList) {
            console.log("ForEachJobMarkOrderIfPossible:result(jobDefinitionList)");
            this.emit('jobDefinitionList', jobDefinitionList);
        };

        ForEachJobMarkOrderIfPossible.prototype.process = function (jobDefinitionList) {
            console.log("ForEachJobMarkOrderIfPossible:process(jobDefinitionList)");

            this._testIfAllPreJobsAreDone.initialize(jobDefinitionList);
            this._firstTask.process(jobDefinitionList);
        };
        return ForEachJobMarkOrderIfPossible;
    })(events.EventEmitter);

    var CountJobsWhichAreSortedAlready = (function (_super) {
        __extends(CountJobsWhichAreSortedAlready, _super);
        function CountJobsWhichAreSortedAlready() {
            _super.apply(this, arguments);
        }
        CountJobsWhichAreSortedAlready.prototype.process = function (jobDefinitionList) {
            console.log("CountJobsWhichAreSortedAlready:process(jobDefinitionList)");

            var sortedJobs = jobDefinitionList.filter(function (jobDefinition) {
                return jobDefinition.order >= 0;
            });

            var jobsAreSortedCount = sortedJobs.length;
            this.emit('jobsAreSortedCount', jobsAreSortedCount);
        };
        return CountJobsWhichAreSortedAlready;
    })(events.EventEmitter);

    var CompareWithLastNumberAndMaxCount = (function (_super) {
        __extends(CompareWithLastNumberAndMaxCount, _super);
        function CompareWithLastNumberAndMaxCount() {
            _super.apply(this, arguments);
        }
        CompareWithLastNumberAndMaxCount.prototype.initialize = function (jobDefinitionList) {
            console.log("CompareWithLastNumberAndMaxCount:initialize(jobDefinitionList)");
            this.numberOfSortedJobs = 0;
            this.maxJobsCount = jobDefinitionList.length;
            this._jobDefinitionList = jobDefinitionList;
        };

        CompareWithLastNumberAndMaxCount.prototype.process = function (jobsAreSortedCount) {
            console.log("CompareWithLastNumberAndMaxCount:process(jobsAreSortedCount: ", jobsAreSortedCount, ")");

            var LastNumberOfSortedJobs = this.numberOfSortedJobs;
            this.numberOfSortedJobs = jobsAreSortedCount;

            if (jobsAreSortedCount === this.maxJobsCount) {
                this.emit('allDone', this._jobDefinitionList);
            } else {
                if (jobsAreSortedCount > LastNumberOfSortedJobs) {
                    this.emit('notAllDoneButIncreased', this._jobDefinitionList);
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
    })(events.EventEmitter);

    var GenerateOrderString = (function (_super) {
        __extends(GenerateOrderString, _super);
        function GenerateOrderString() {
            _super.apply(this, arguments);
        }
        GenerateOrderString.prototype.process = function (jobDefinitionList) {
            console.log("GenerateOrderString:process(jobDefinitionList)");
            var orderString = "";

            jobDefinitionList.sort(function (left, right) {
                return left.order === right.order ? 0 : (left.order < right.order ? -1 : 1);
            });

            jobDefinitionList.forEach(function (jobDefinition) {
                orderString += jobDefinition.job;
            });

            console.log("GenerateOrderString:process(jobDefinitionList): orderString: ", orderString);

            this.emit('out', orderString);
        };
        return GenerateOrderString;
    })(events.EventEmitter);

    //4
    var ForAllJobDefinitions = (function (_super) {
        __extends(ForAllJobDefinitions, _super);
        function ForAllJobDefinitions() {
            _super.apply(this, arguments);
        }
        ForAllJobDefinitions.prototype.process = function (jobDefinitionList) {
            console.log("ForAllJobDefinitions:process(jobDefinitionList)");
            var self = this;
            jobDefinitionList.forEach(function (jobDefinition) {
                self.emit('out', jobDefinition);
            });

            this.emit('after', jobDefinitionList);
        };
        return ForAllJobDefinitions;
    })(events.EventEmitter);

    var TestIfJobIsSorted = (function (_super) {
        __extends(TestIfJobIsSorted, _super);
        function TestIfJobIsSorted() {
            _super.apply(this, arguments);
        }
        TestIfJobIsSorted.prototype.process = function (jobDefinition) {
            console.log("TestIfJobIsSorted:process(jobDefinition: ", jobDefinition, ")");

            if (jobDefinition.order === -1) {
                this.emit('notSorted', jobDefinition);
            }
        };
        return TestIfJobIsSorted;
    })(events.EventEmitter);

    var TestIfAllPreJobsAreDone = (function (_super) {
        __extends(TestIfAllPreJobsAreDone, _super);
        function TestIfAllPreJobsAreDone() {
            _super.apply(this, arguments);
        }
        TestIfAllPreJobsAreDone.prototype.initialize = function (jobDefinitionList) {
            this._jobDefinitionList = jobDefinitionList;
        };

        TestIfAllPreJobsAreDone.prototype.process = function (jobDefinition) {
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
                this.emit('allPreJobsDone', jobDefinition);
            }
        };
        return TestIfAllPreJobsAreDone;
    })(events.EventEmitter);

    var SetOrderAndIncrement = (function (_super) {
        __extends(SetOrderAndIncrement, _super);
        function SetOrderAndIncrement() {
            console.log("SetOrderAndIncrement:constructor()");
            this._nextOrderNumber = 0;
            _super.call(this);
        }
        SetOrderAndIncrement.prototype.process = function (jobDefinition) {
            console.log("SetOrderAndIncrement:process(jobDefinition: ", jobDefinition, ")");

            jobDefinition.order = this._nextOrderNumber;
            this._nextOrderNumber++;
            console.log("SetOrderAndIncrement:process(jobDefinition): jobDefinition.order: ", jobDefinition.order);

            this.emit('out');
        };
        return SetOrderAndIncrement;
    })(events.EventEmitter);
})(exports.OrderedJobsFDEBC || (exports.OrderedJobsFDEBC = {}));
var OrderedJobsFDEBC = exports.OrderedJobsFDEBC;

