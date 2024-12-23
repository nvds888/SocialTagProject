const { spawn } = require('child_process');
const path = require('path');
const schedule = require('node-schedule');
require('dotenv').config();

function runDistribution() {
  return new Promise((resolve, reject) => {
    console.log('Starting token distribution process...');
    const pythonScriptPath = path.join(__dirname, 'token_distribution.py');
    const pythonProcess = spawn('python', [pythonScriptPath]);

    let output = '';
    let error = '';

    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      error += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`Distribution script exited with code ${code}. Error: ${error}`);
        reject(new Error(`Token distribution failed. Error: ${error}`));
      } else {
        const resultsMatch = output.match(/DistributionResults:(.+)/);
        if (resultsMatch && resultsMatch[1]) {
          console.log('Token distribution completed successfully');
          resolve(JSON.parse(resultsMatch[1]));
        } else if (output.includes("No wallets found in database")) {
          console.log('No wallets found to distribute tokens to');
          resolve([]);
        } else {
          console.error('Full script output:', output);
          reject(new Error(`Failed to parse distribution results from output: ${output}`));
        }
      }
    });
  });
}

function initializeDistributionScheduler() {
    // Schedule to run at 11:09 AM UTC (12:09 PM GMT+1) daily
    console.log('Current time:', new Date().toISOString());
    const job = schedule.scheduleJob('09 11 * * *', () => {
      console.log('Starting scheduled distribution at:', new Date().toISOString());
      runDistribution()
        .then(results => console.log('Distribution results:', results))
        .catch(error => console.error('Error in distribution:', error));
    });
    
    const nextRun = job.nextInvocation();
    console.log('Token distribution scheduler initialized - will run daily at 12:09 PM GMT+1');
    console.log('Next scheduled run:', nextRun.toString());
}

module.exports = {
  runDistribution,
  initializeDistributionScheduler
};

