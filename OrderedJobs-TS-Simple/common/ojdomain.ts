export module Domain {
    "use strict";

    export interface IOrderedJobs {
        register(dependentJob: string, independentJob: string): void;
        register(job: string): void;
        sort(): string;
    }



    export interface IJobDefinition {
        job: string;
        preJobs: string[];
        order: number;
    }

    export class JobDefinition implements IJobDefinition {

        constructor(public job: string, public preJobs: string[], public order: number) {
        }

        public toString() {
            var job = "{" + this.job + ", [";
            var preJobs = this.preJobs;
            if (preJobs) {
                job += preJobs.join(',');
            }
            job += "], ";
            job += this.order;
            job += "}";
            return job;
        }

    }

}

