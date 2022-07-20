const args = require('minimist')(process.argv);
const axios = require('axios');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

if (!args.url || !args.waitTime || !args.threadCount || !args.requestPerThread) {
    console.log("node runner url=serviceUrl waitTime=? threadCount=?");
    console.log("\twaitTime = time in seconds a thread waits between calls");
    console.log("\tthreadCount = maximum number of total threads");
    console.log("\trequestPerThread = maximum number of request per threads");
    process.exit(-1);
}

console.log(`url: ${args.url}`);
console.log(`waitTime: ${args.waitTime} seconds`);
console.log(`threadCount: ${args.threadCount} threads`);
console.log(`requestPerThread: ${args.requestPerThread} request per thread`);

// install interceptor for response time measure
axios.interceptors.request.use(x => {
    // to avoid overwriting if another interceptor
    // already defined the same object (meta)
    x.meta = x.meta || {}
    x.meta.requestStartedAt = new Date().getTime();
    return x;
})

axios.interceptors.response.use(x => {
    x.responseTime = new Date().getTime() - x.config.meta.requestStartedAt;
    return x;
})


var requestNumber = 1;
var _iThreadCount = parseInt(args.threadCount);

for (var i = 1; i <= _iThreadCount; i++) {
    start();
}

async function start() {
    var _iRequestCount = parseInt(args.requestPerThread);
    for (var n = 0; n < _iRequestCount; n++) {
        console.log(`Starting request number ${requestNumber++}`);
        axios
            .get(args.url, { timeout: 900000 })
            .then(res => {
                console.log(`Returned statusCode: ${res.status} in ${res.responseTime / 1000} sec`);
            })
            .catch(error => {
                console.error("Returned error", error);
            });
        await new Promise(r => setTimeout(r, parseInt(args.waitTime) * 1000));
    }
}