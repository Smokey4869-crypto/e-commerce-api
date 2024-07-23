const { exec } = require('child_process');

console.log('Initial Memory Usage:', process.memoryUsage());

exec('nest build', (error, stdout, stderr) => {
  if (error) {
    console.error(`Build failed with error: ${error.message}`);
    console.error(`Error details: ${stderr}`);
    return;
  }
  
  if (stderr) {
    console.error(`Build completed with errors: ${stderr}`);
    return;
  }
  
  console.log('Build completed successfully.');
  console.log('Build Output:', stdout);
  console.log('Memory Usage After Build:', process.memoryUsage());
});
