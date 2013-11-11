(function (Domain) {
    "use strict";

    var JobDefinition = (function () {
        function JobDefinition(job, preJobs, order) {
            this.job = job;
            this.preJobs = preJobs;
            this.order = order;
        }
        JobDefinition.prototype.toString = function () {
            var job = "{" + this.job + ", [";
            var preJobs = this.preJobs;
            if (preJobs) {
                job += preJobs.join(',');
            }
            job += "], ";
            job += this.order;
            job += "}";
            return job;
        };
        return JobDefinition;
    })();
    Domain.JobDefinition = JobDefinition;
})(exports.Domain || (exports.Domain = {}));
var Domain = exports.Domain;

