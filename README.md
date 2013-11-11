A solution for the problem 'Ordered Jobs' in Flow-Designs (FD).

http://unicular.blogspot.com/2013/11/flow-design.html


Two implementations for the solution in TypeScript, one with Event Based Components (EBC) and one with function callbacks. (The same algorithm, only the connections are different.)

The version with EBC uses node.js events. So get \node\node.d.ts from https://github.com/borisyankov/DefinitelyTyped/ and update the link in 
\OrderedJobs-TS-Simple\FD-EBC\orderedJobs_FD_EBC.js


compile and run

cd OrderedJobs-TS-Simple
tsc test_OJ_FD.ts test_OJ_FD_EBC --module "commonjs"
node test_OJ_FD.js
node test_OJ_FD_EBC.js


Note: This is a test project to learn this design method. It is not sure, if it is correct in the sense of Flow Design or Event Based Components already.