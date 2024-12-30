const { spawn } = require('child_process');
const path = require('path');
const schedule = require('node-schedule');
require('dotenv').config();

function runImmersveRewards() {
  return new Promise((resolve, reject) => {
    const pythonScriptPath = path.join(__dirname, 'immersve_rewards.py');
    const pythonProcess = spawn('python', [pythonScriptPath]);

    let output = '';
    let error = '';

    pythonProcess.stdout.on('data', (data) => {
      console.log('Output:', data.toString());
      output += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      console.error('Error:', data.toString());
      error += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Immersve rewards failed. Error: ${error}`));
      } else {
        const resultsMatch = output.match(/DistributionResults:(.+)/);
        if (resultsMatch) {
          resolve(JSON.parse(resultsMatch[1]));
        } else {
          resolve([]);
        }
      }
    });
  });
}

function initializeImmersveRewardsScheduler() {
    // Run every hour at minute 30
    const job = schedule.scheduleJob('30 * * * *', () => {
      console.log('Starting Immersve rewards at:', new Date().toISOString());
      runImmersveRewards()
        .then(results => console.log('Distribution results:', results))
        .catch(error => console.error('Distribution error:', error));
    });
    
    console.log('Immersve rewards scheduler initialized. Will run hourly at :30');
    console.log('Next run:', job.nextInvocation().toString());
}

module.exports = {
  runImmersveRewards,
  initializeImmersveRewardsScheduler
};