// Quick script to check if the MediaPipe process is still running
// Save this as process_checker.js and run with: node process_checker.js

const { exec } = require('child_process');
const os = require('os');

function checkForProcess() {
    const command = os.platform() === 'win32' 
        ? 'tasklist | findstr MediaPipe'
        : 'ps aux | grep MediaPipe';
    
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.log('No MediaPipe processes found (this is good!)');
            return;
        }
        
        if (stdout.trim()) {
            console.log('Found MediaPipe processes:');
            console.log(stdout);
            
            // Try to kill them
            if (os.platform() === 'win32') {
                exec('taskkill /F /IM MediaPipe_Facial_Feature_OSC_Out.exe', (killError) => {
                    if (killError) {
                        console.log('Could not kill process:', killError.message);
                    } else {
                        console.log('Killed MediaPipe process');
                    }
                });
            } else {
                exec('pkill -f MediaPipe_Facial_Feature_OSC_Out', (killError) => {
                    if (killError) {
                        console.log('Could not kill process:', killError.message);
                    } else {
                        console.log('Killed MediaPipe process');
                    }
                });
            }
        } else {
            console.log('No MediaPipe processes found (this is good!)');
        }
    });
}

checkForProcess();