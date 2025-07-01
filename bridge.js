// FINAL SCRIPT - v.Detached Background Process
const Max = require('max-api');
const osc = require('node-osc');
const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// --- OSC SERVER SETUP ---
const OSC_PORT = 8001;
const OSC_IP = '127.0.0.1';
const oscServer = new osc.Server(OSC_PORT, OSC_IP, () => {
  Max.post(`[1] Node.js OSC Server listening on port ${OSC_PORT}`);
});
oscServer.on('message', (msg) => {
  Max.outlet(msg[0], msg[1]);
});

// --- EXECUTABLE PROCESS MANAGEMENT ---
const wrapperScript = 'run_face_tracker.sh';
const executablePath = path.join(__dirname, wrapperScript);

// This handler is triggered by the "ready" outlet of [node.script]
Max.addHandler('start_process', () => {
    Max.post(`[2] 'start_process' handler triggered.`);
    
    // Check if the wrapper script exists
    if (!fs.existsSync(executablePath)) {
        Max.error(`FATAL ERROR: Wrapper script not found at ${executablePath}`);
        return;
    }
    
    try {
        Max.post(`[3] Launching process in detached mode via wrapper script...`);
        
        const backgroundProcess = spawn(executablePath, [], {
            detached: true,
            stdio: 'ignore' // This is the key: we disconnect from the child's output.
        });

        // This allows the Node.js script to exit without waiting for the child.
        backgroundProcess.unref();

        Max.post(`✅ Process successfully launched in background. Check your camera.`);
        Max.post(`-> It may take a few moments for the camera to initialize.`);

    } catch (e) {
        Max.error(`-> CRITICAL ERROR during spawn: ${e.message}`);
    }
});

// Add this handler anywhere in the "Max Handlers" section of the script
Max.addHandler('test', () => {
    Max.post("Sending a test message to the outlet.");
    Max.outlet("this is a test message");
});

// This handler is triggered by a [closebang] in the Max patch
Max.addHandler('stop_process', () => {
    Max.post(`Stopping background process...`);
    // Since the process is detached, we can't call .kill().
    // We must kill it by name using a system command.
    const appName = 'MediaPipe_Facial_Feature_OSC_Out';
    
    if (process.platform === 'win32') {
        exec(`taskkill /F /IM ${appName}.exe`);
    } else {
        // Use pkill to find and kill the process by its name
        exec(`pkill -f ${appName}`);
    }
    Max.post(`-> Kill signal sent to all processes named '${appName}'.`);
});