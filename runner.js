const args = require('minimist')(process.argv);
const axios = require('axios');
const percentile = require('percentile');
const lodash = require('lodash');
const employess = require('./data');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

console.log("Total employees: " + employess.length);

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

var dataIndex=17500;
var requestNumber = 1;
var _iThreadCount = parseInt(args.threadCount);
var successCount = 0;
var failureCount = 0;
var responseTimes = [];

for (var i = 1; i <= _iThreadCount; i++) {
    start();
}

async function start() {
    var _iRequestCount = parseInt(args.requestPerThread);
    for (var n = 0; n < _iRequestCount; n++) {
        _sURL = args.url.replace("ARGUMENT", employess[dataIndex++]);
        console.log(`Starting request number ${requestNumber++} with ${_sURL}`);
        axios
            .get(_sURL,
                {   headers: {
                    "Accept": "application/json",
                    "TransactionID": "1",
                    "applicationOwnerCode": "CNO",
                    "apiResourceName": "CNO-CMA",
                    "apiRequestUtcTs": "SYSDATE",
                    "applicationName": "CNO-Crew Mobile App",
                    "applicationVersionNum": "1",
                    "applicationDeviceName": "CNO",
                    "applicationDeviceOS": "CNO",
                    "applicationDeviceMacAddress": "CNO",
                    "networkIpAddress": "CNO",
                    "apiConsumerRecordText": "CNO",
                    "employeeId": "0000300300",
                    "Content-Type": "application/json",
                    "Cookie": "045e94007b2777fba90c88d1cb5e712b=47afc34ee0605b2837867d66fd29ef55",
                   "Authorization": "Bearer g4xpvFCPA95x5isK8ouFOidyNb21"
                },
                    timeout: 900000 }
                )
            .then(res => {
                successCount++;
                responseTimes.push(res.responseTime);
                console.log(`Returned statusCode: ${res.status} in ${res.responseTime / 1000} sec`);
            })
            .catch(error => {
                failureCount++;
                console.error("Returned error", error);
            });
        await new Promise(r => setTimeout(r, parseInt(args.waitTime) * 1000));
    }
}

process.on('exit', (code) =>{
    console.log(`Success: ${successCount}`);
    console.log(`Failure: ${failureCount}`);
    console.log(`Minimum response time: ${lodash.min(responseTimes) /1000} sec`);
    console.log(`Maximum response time: ${lodash.max(responseTimes) /1000} sec`);
    console.log(`Average response time: ${lodash.mean(responseTimes) /1000} sec`);
    console.log(`90th P response time: ${percentile(90, responseTimes) /1000} sec`);
});