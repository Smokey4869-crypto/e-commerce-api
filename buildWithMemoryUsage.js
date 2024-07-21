const { exec } = require('child_process');

console.log('Initial Memory Usage:', process.memoryUsage());

exec('nest build', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`Stderr: ${stderr}`);
    return;
  }
  console.log('Build Output:', stdout);
  console.log('Memory Usage After Build:', process.memoryUsage());
});
