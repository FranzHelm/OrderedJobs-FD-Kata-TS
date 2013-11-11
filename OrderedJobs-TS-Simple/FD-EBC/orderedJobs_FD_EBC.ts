/// <reference path='../../../../TypeScript/DefinitelyTyped-master/node/node.d.ts'/>
/// <reference path='../common/ojdomain.ts'/>

import events = require("events");

import jd = require("../common/ojdomain");


export module OrderedJobsWrapperModule {
    "use strict";

    export class OrderedJobs implements jd.Domain.IOrderedJobs {


        public register(dependentJob: string, independentJob?: string): void {

            var register = OrderedJobsFDEBC.register();

            register.process(dependentJob, independentJob);
        }

        //public register(job: string): void {
        //}

        public sort(): string {
            var sortedJobs = "";

            var sort1 = new OrderedJobsFDEBC.Sort();

            sort1.on("out", function (sortedJobsString: string): void {
                sortedJobs = sortedJobsString;
            });

            sort1.process();

            return sortedJobs;
        }

    }

}



export module OrderedJobsFDEBC {
    "use strict";

    console.info("EBC");

    export interface IRegister extends events.NodeEventEmitter {
        process(job: string, preJob?: string): void;
    }
    export function register(): IRegister {
        return new Register();
    }

    export interface ISort extends events.NodeEventEmitter {
        process(): void;
    }
    export function sort(): ISort {
        return new Sort();
    }




    interface ICreateJobDefinitionList extends events.NodeEventEmitter {
        process(): void;
    }

    interface ISortJobDefinitions extends events.NodeEventEmitter {
        process(jobDefinitionList: jd.Domain.JobDefinition[]): void;
    }


    //3
    interface IForEachJobMarkOrderIfPossible extends events.NodeEventEmitter {
        process(jobDefinitionList: jd.Domain.JobDefinition[]): void;
    }

    interface ICountJobsWhichAreSortedAlready extends events.NodeEventEmitter {
        process(jobDefinitionList: jd.Domain.JobDefinition[]): void;
    }

    interface ICompareWithLastNumberAndMaxCount extends events.NodeEventEmitter {
        initialize(jobDefinitionList: jd.Domain.JobDefinition[]): void;
        process(jobsAreSortedCount: number): void;
    }

    interface IGenerateOrderString extends events.NodeEventEmitter {
        process(jobDefinitionList: jd.Domain.JobDefinition[]): void;
    }


    //4
    interface IForAllJobDefinitions extends events.NodeEventEmitter {
        process(jobDefinitionList: jd.Domain.JobDefinition[]): void;
    }

    interface ITestIfJobIsSorted extends events.NodeEventEmitter {
        process(jobDefinition: jd.Domain.JobDefinition): void;
    }

    interface ITestIfAllPreJobsAreDone extends events.NodeEventEmitter {
        process(jobDefinition: jd.Domain.JobDefinition): void;
        initialize(jobDefinitionList: jd.Domain.JobDefinition[]): void;
    }

    interface ISetOrderAndIncrement extends events.NodeEventEmitter {
        process(jobDefinition: jd.Domain.JobDefinition): void;
    }








    var jobListRegister: { job: string; preJob?: string }[] = [];



    export class Register extends events.EventEmitter implements IRegister {

        public process(job: string, preJob?: string): void {
            console.log("Register:process(job:", job, ", preJob:", preJob, ")");

            if (preJob && preJob.length > 0) {
                jobListRegister.push({ job: job, preJob: preJob });
            } else {
                jobListRegister.push({ job: job });
            }
        }
    }





    export class Sort extends events.EventEmitter implements ISort {

        constructor() {
            console.log("Sort:constructor()");

            var createJobDefinitionList = new CreateJobDefinitionList();
            var sortJobDefinitions = new SortJobDefinitions();
            this._firstTask = createJobDefinitionList;

            createJobDefinitionList.on("jobDefinitionList", sortJobDefinitions.process.bind(sortJobDefinitions));
            sortJobDefinitions.on("out", this.result.bind(this));

            super();
        }

        private result(sortedJobs: string): void {
            console.log("Sort:result(sortedJobs:", sortedJobs, ")");
            this.emit('out', sortedJobs);
        }

        private _firstTask: ICreateJobDefinitionList;

        public process(): void {
            console.log("Sort:process()");

            this._firstTask.process();
        }

    }







    class CreateJobDefinitionList extends events.EventEmitter implements ICreateJobDefinitionList {

        public process(): void {
            console.log("CreateJobDefinitionList:process()");

            //var jobDefinitionList: { job: string; preJobs: string[]; order: number }[];
            var jobDefinitionList: jd.Domain.IJobDefinition[] = [];

            jobListRegister.forEach(function (jobListEntry) {

                var job = jobListEntry.job;
                var preJob = jobListEntry.preJob;
                var order = -1;

                // if preJob is not in list, add it.
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
                var jobFound: jd.Domain.JobDefinition = null;
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
        }
    }


    class SortJobDefinitions extends events.EventEmitter implements ISortJobDefinitions {

        constructor() {
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

            super();
        }
        private _firstTask: IForEachJobMarkOrderIfPossible;
        private _taskCompareWithLastNumberAndMaxCount: ICompareWithLastNumberAndMaxCount;


        private result(sortedJobs: string): void {
            console.log("SortJobDefinitions:result(sortedJobs:", sortedJobs, ")");
            this.emit('out', sortedJobs);
        }

        public process(jobDefinitionList: { job: string; preJobs: string[]; order: number }[]): void {

            console.log("SortJobDefinitions:process(jobDefinitionList)");

            this._taskCompareWithLastNumberAndMaxCount.initialize(jobDefinitionList);

            this._firstTask.process(jobDefinitionList);

        }
    }



    // 3


    class ForEachJobMarkOrderIfPossible extends events.EventEmitter implements IForEachJobMarkOrderIfPossible {

        constructor() {
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

            super();
        }
        private _firstTask: IForAllJobDefinitions;
        private _testIfAllPreJobsAreDone: ITestIfAllPreJobsAreDone;


        private result(jobDefinitionList: jd.Domain.JobDefinition[]): void {
            console.log("ForEachJobMarkOrderIfPossible:result(jobDefinitionList)");
            this.emit('jobDefinitionList', jobDefinitionList);
        }

        public process(jobDefinitionList: { job: string; preJobs: string[]; order: number }[]): void {

            console.log("ForEachJobMarkOrderIfPossible:process(jobDefinitionList)");

            this._testIfAllPreJobsAreDone.initialize(jobDefinitionList);
            this._firstTask.process(jobDefinitionList);
        }

    }





    class CountJobsWhichAreSortedAlready extends events.EventEmitter implements ICountJobsWhichAreSortedAlready {

        public process(jobDefinitionList: jd.Domain.JobDefinition[]): void {
            console.log("CountJobsWhichAreSortedAlready:process(jobDefinitionList)");

            var sortedJobs = jobDefinitionList.filter(function (jobDefinition) {
                return jobDefinition.order >= 0;
            });

            var jobsAreSortedCount = sortedJobs.length;
            this.emit('jobsAreSortedCount', jobsAreSortedCount);
        }
    }





    class CompareWithLastNumberAndMaxCount extends events.EventEmitter implements ICompareWithLastNumberAndMaxCount {

        private numberOfSortedJobs: number;
        private maxJobsCount: number;

        private _jobDefinitionList: jd.Domain.JobDefinition[];

        public initialize(jobDefinitionList: jd.Domain.JobDefinition[]): void {
            console.log("CompareWithLastNumberAndMaxCount:initialize(jobDefinitionList)");
            this.numberOfSortedJobs = 0;
            this.maxJobsCount = jobDefinitionList.length;
            this._jobDefinitionList = jobDefinitionList;
        }

        public process(jobsAreSortedCount: number): void {
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
                        return left.order === right.order ?
                            0 : (left.order < right.order ? -1 : 1)
                    });

                    this._jobDefinitionList.forEach(function (jobDefinition) {
                        errorMessage += jobDefinition.order > -1 ?
                        jobDefinition.order + 1 + ".: " + jobDefinition.job :
                        "! - " + jobDefinition.job + " => " + (jobDefinition.preJobs ? jobDefinition.preJobs.join(',') : "");
                        errorMessage += "\n";
                    });

                    throw new Error(errorMessage);
                }
            }
        }
    }





    class GenerateOrderString extends events.EventEmitter implements IGenerateOrderString {

        public process(jobDefinitionList: jd.Domain.JobDefinition[]): void {
            console.log("GenerateOrderString:process(jobDefinitionList)");
            var orderString = "";

            jobDefinitionList.sort(function (left, right) {
                return left.order === right.order ?
                    0 : (left.order < right.order ? -1 : 1)
            });

            jobDefinitionList.forEach(function (jobDefinition) {
                orderString += jobDefinition.job;
            });

            console.log("GenerateOrderString:process(jobDefinitionList): orderString: ", orderString);

            this.emit('out', orderString);
        }
    }








    //4



    class ForAllJobDefinitions extends events.EventEmitter implements IForAllJobDefinitions {

        public process(jobDefinitionList: jd.Domain.JobDefinition[]): void {
            console.log("ForAllJobDefinitions:process(jobDefinitionList)");
            var self = this;
            jobDefinitionList.forEach(function (jobDefinition) {
                self.emit('out', jobDefinition);
            });

            this.emit('after', jobDefinitionList);
        }
    }



    class TestIfJobIsSorted extends events.EventEmitter implements ITestIfJobIsSorted {

        public process(jobDefinition: jd.Domain.JobDefinition): void {
            console.log("TestIfJobIsSorted:process(jobDefinition: ", jobDefinition, ")");

            if (jobDefinition.order === -1) {
                this.emit('notSorted', jobDefinition);
            }
        }
    }






    class TestIfAllPreJobsAreDone extends events.EventEmitter implements ITestIfAllPreJobsAreDone {

        private _jobDefinitionList: jd.Domain.IJobDefinition[];
        private _preJobsDone: boolean;

        public initialize(jobDefinitionList: jd.Domain.JobDefinition[]): void {
            this._jobDefinitionList = jobDefinitionList;
        }

        public process(jobDefinition: jd.Domain.JobDefinition): void {
            console.log("TestIfAllPreJobsAreDone:process(jobDefinition: ", jobDefinition, ")");

            var preJobs = jobDefinition.preJobs;

            this._preJobsDone = true;
            var self = this;

            if (preJobs) {

                preJobs.forEach(function (preJob) {

                    var jobDefinition: jd.Domain.JobDefinition = null;
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
        }

    }






    class SetOrderAndIncrement extends events.EventEmitter implements ISetOrderAndIncrement {

        private _nextOrderNumber: number;

        constructor() {
            console.log("SetOrderAndIncrement:constructor()");
            this._nextOrderNumber = 0;
            super();
        }

        public process(jobDefinition: jd.Domain.JobDefinition): void {
            console.log("SetOrderAndIncrement:process(jobDefinition: ", jobDefinition, ")");

            jobDefinition.order = this._nextOrderNumber;
            this._nextOrderNumber++;
            console.log("SetOrderAndIncrement:process(jobDefinition): jobDefinition.order: ", jobDefinition.order);

            this.emit('out');
        }
    }



}
