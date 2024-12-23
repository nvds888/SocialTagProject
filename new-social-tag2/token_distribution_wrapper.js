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
        } else {
          reject(new Error(`Failed to parse distribution results from output: ${output}`));
        }
      }
    });
  });
}

function initializeDistributionScheduler() {
    // Schedule to run at 9:40 AM UTC (10:40 AM GMT+1) daily
    schedule.scheduleJob('40 9 * * *', () => {
      runDistribution()
        .then(results => console.log('Distribution results:', results))
        .catch(error => console.error('Error in distribution:', error));
    });
    
    console.log('Token distribution scheduler initialized - will run daily at 14:00 UTC');
  }

module.exports = {
  runDistribution,
  initializeDistributionScheduler
};

