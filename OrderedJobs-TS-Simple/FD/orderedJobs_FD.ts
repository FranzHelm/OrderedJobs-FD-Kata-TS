/// <reference path='../common/ojdomain.ts'/>

import jd = require("../common/ojdomain");





export module OrderedJobsWrapperModule {
    "use strict";



    export class OrderedJobs implements jd.Domain.IOrderedJobs {

        public register(dependentJob: string, independentJob?: string): void {

            OrderedJobsFD.register(dependentJob, independentJob);
        }

        //public register(job: string): void {
        //}

        public sort(): string {
            var sortedJobs = "";

            OrderedJobsFD.sort(function (sortedJobsString: string): void {
                sortedJobs = sortedJobsString;
            });

            return sortedJobs;
        }

    }

}





export module OrderedJobsFD {
    "use strict";



    var jobListRegister: { job: string; preJob?: string }[] = [];


    export function register(job: string, preJob?: string): void {
        console.log("register(job:", job, ", preJob:", preJob, ")");

        if (preJob && preJob.length > 0) {
            jobListRegister.push({ job: job, preJob: preJob });
        } else {
            jobListRegister.push({ job: job });
        }
    }


    export function sort(outCallback: (string) => void): void {
        console.log("sort()");


        createJobDefinitionList(function (jobDefinitionList: jd.Domain.IJobDefinition[]) {
            sortJobDefinitions(jobDefinitionList, outCallback);
        });
    }



    function createJobDefinitionList(outCallback: (any) => void): void {
        console.log("createJobDefinitionList()");

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

        outCallback(jobDefinitionList);
    }


    function sortJobDefinitions(jobDefinitionList: { job: string; preJobs: string[]; order: number }[], outCallback: (string) => void): void {

        console.log("sortJobDefinitions(jobDefinitionList)");

        var compareWithLastNumberAndMaxCount = new CompareWithLastNumberAndMaxCount();
        compareWithLastNumberAndMaxCount.initialize(jobDefinitionList);


        var outAllDoneCB = function (jobDefinitionList) {
            generateOrderString(jobDefinitionList, outCallback);
        };

        var notAllDoneButIncreasedCB = function (jobDefinitionList) {
            forEachJobMarkOrderIfPossible(jobDefinitionList, outCB2);
        };

        var jobsAreSortedCountCB = function (jobsAreSortedCount: number) {
            compareWithLastNumberAndMaxCount.process(jobsAreSortedCount, outAllDoneCB, notAllDoneButIncreasedCB);
        };

        var outCB2 = function (jobDefinitionList) {
            countJobsWhichAreSortedAlready(jobDefinitionList, jobsAreSortedCountCB);
        };

        forEachJobMarkOrderIfPossible(jobDefinitionList, outCB2);

    }



    // 3

    function forEachJobMarkOrderIfPossible(jobDefinitionList: jd.Domain.JobDefinition[], jobDefinitionListCallback: (any) => void): void {

        console.log("forEachJobMarkOrderIfPossible(jobDefinitionList)");

        var setOrderAndIncrement = new SetOrderAndIncrement();
        var testIfAllPreJobsAreDone = new TestIfAllPreJobsAreDone();
        testIfAllPreJobsAreDone.initialize(jobDefinitionList);


        forAllJobDefinitions(jobDefinitionList, function (jobDefinition) {
            testIfJobIsSorted(jobDefinition, function (jobDefinition) {
                testIfAllPreJobsAreDone.process(jobDefinition, function (jobDefinition) {
                    setOrderAndIncrement.process(jobDefinition, function () { });
                });
            })
            }, function (jobDefinitionList: jd.Domain.JobDefinition[]): void {
                jobDefinitionListCallback(jobDefinitionList);
            });

    }





    function countJobsWhichAreSortedAlready(jobDefinitionList: jd.Domain.JobDefinition[], jobsAreSortedCountCallback: (number) => void): void {
        console.log("countJobsWhichAreSortedAlready(jobDefinitionList)");

        var sortedJobs = jobDefinitionList.filter(function (jobDefinition) {
            return jobDefinition.order >= 0;
        });

        var jobsAreSortedCount = sortedJobs.length;
        jobsAreSortedCountCallback(jobsAreSortedCount);
    }





    class CompareWithLastNumberAndMaxCount {

        private numberOfSortedJobs: number;
        private maxJobsCount: number;

        private _jobDefinitionList: jd.Domain.JobDefinition[];

        public initialize(jobDefinitionList: jd.Domain.JobDefinition[]): void {
            console.log("CompareWithLastNumberAndMaxCount:initialize(jobDefinitionList)");
            this.numberOfSortedJobs = 0;
            this.maxJobsCount = jobDefinitionList.length;
            this._jobDefinitionList = jobDefinitionList;
        }

        public process(jobsAreSortedCount: number, outAllDoneCallback: (any/*IJobDefinition[]*/) => void, notAllDoneButIncreasedCallback: (any/*IJobDefinition[]*/) => void): void {
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





    function generateOrderString(jobDefinitionList: jd.Domain.JobDefinition[], outCallback: (string) => void): void {
        console.log("generateOrderString(jobDefinitionList)");
        var orderString = "";

        jobDefinitionList.sort(function (left, right) {
                return left.order === right.order ?
                0 : (left.order < right.order ? -1 : 1)
            });

        jobDefinitionList.forEach(function (jobDefinition) {
            orderString += jobDefinition.job;
        });

        console.log("generateOrderString(jobDefinitionList): orderString: ", orderString);

        outCallback(orderString);
    }








    //4







    function forAllJobDefinitions(jobDefinitionList: jd.Domain.JobDefinition[], outCallback: (IJobDefinition) => void, afterCallback: (any/*IJobDefinition[]*/) => void): void {
        console.log("forAllJobDefinitions(jobDefinitionList)");
        var self = this;
        jobDefinitionList.forEach(function (jobDefinition) {
            outCallback(jobDefinition);
        });

        afterCallback(jobDefinitionList);
    }





    function testIfJobIsSorted(jobDefinition: jd.Domain.JobDefinition, notSortedCallback: (IJobDefinition) => void): void {
        console.log("testIfJobIsSorted(jobDefinition: ", jobDefinition, ")");

        if (jobDefinition.order === -1) {
            notSortedCallback(jobDefinition);
        }
    }



    class TestIfAllPreJobsAreDone {

        private _jobDefinitionList: jd.Domain.IJobDefinition[];
        private _preJobsDone: boolean;

        public initialize(jobDefinitionList: jd.Domain.JobDefinition[]): void {
            console.log("TestIfAllPreJobsAreDone:initialize(jobDefinitionList)");
            this._jobDefinitionList = jobDefinitionList;
        }

        public process(jobDefinition: jd.Domain.JobDefinition, allPreJobsDoneCallback: (JobDefinition) => void): void {
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
                allPreJobsDoneCallback(jobDefinition);
            }
        }

    }





    class SetOrderAndIncrement {

        private static nextOrderNumber: number = 0;

        public process(jobDefinition: jd.Domain.JobDefinition, outCallback: () => void): void {
            console.log("SetOrderAndIncrement:process(jobDefinition: ", jobDefinition, ")");

            //jobDefinition.order = this._nextOrderNumber;
            //this._nextOrderNumber++;
            jobDefinition.order = SetOrderAndIncrement.nextOrderNumber;
            SetOrderAndIncrement.nextOrderNumber++;
            console.log("SetOrderAndIncrement:process(jobDefinition): jobDefinition.order: ", jobDefinition.order);

            outCallback();
        }
    }



}
