// Max for Live Voice Transcription Script
// Save as: voice_transcription.js

const Max = require('max-api');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// --- GLOBAL VARIABLES ---
let transcriptionProcess = null;
let availableDevices = [];
let isListening = false;
let selectedDeviceIndex = null;

// Path to your compiled application - UPDATE THIS PATH!
const TRANSCRIBER_PATH = path.join(__dirname, 'whisper_transcriber');

// --- MAX HANDLERS ---

// Initialize the system
Max.addHandler('bang', () => {
    Max.post("🎤 Voice Transcription System Initializing...");
    listAudioDevices();
});

// List all available audio devices
Max.addHandler('list_devices', () => {
    Max.post("Scanning for audio devices...");
    listAudioDevices();
});

// Set audio device by index
Max.addHandler('set_device', (deviceIndex) => {
    setDevice(deviceIndex);
});

// Start voice transcription
Max.addHandler('start_listening', () => {
    startListening();
});

// Stop voice transcription
Max.addHandler('stop_listening', () => {
    stopListening();
});

// Get current status
Max.addHandler('get_status', () => {
    getStatus();
});

// Test handler
Max.addHandler('test', () => {
    Max.post("Voice transcription script is loaded and ready!");
    Max.outlet("status", "script_ready");
});

// --- CORE FUNCTIONS ---

function listAudioDevices() {
    // Check if transcriber exists
    if (!fs.existsSync(TRANSCRIBER_PATH)) {
        Max.error(`FATAL ERROR: Transcriber not found at ${TRANSCRIBER_PATH}`);
        Max.outlet("error", "transcriber_not_found");
        return;
    }
    
    Max.post("Launching device scanner...");
    
    const deviceProcess = spawn(TRANSCRIBER_PATH, ['--list-devices']);
    let output = '';
    
    deviceProcess.stdout.on('data', (data) => {
        output += data.toString();
    });
    
    deviceProcess.stderr.on('data', (data) => {
        const errorText = data.toString();
        if (!errorText.includes('DeprecationWarning')) {
            Max.post("Device scan error: " + errorText);
        }
    });
    
    deviceProcess.on('close', (code) => {
        if (code === 0) {
            parseDeviceOutput(output);
        } else {
            Max.error(`Failed to list devices (exit code: ${code})`);
            Max.outlet("error", "device_scan_failed");
        }
    });
    
    deviceProcess.on('error', (err) => {
        Max.error(`Device scanner failed to start: ${err.message}`);
        Max.outlet("error", "device_scanner_error");
    });
}

function parseDeviceOutput(output) {
    const lines = output.split('\n');
    availableDevices = [];
    
    for (let line of lines) {
        if (line.startsWith('DEVICES_JSON:')) {
            try {
                const jsonStr = line.substring(13); // Remove "DEVICES_JSON:" prefix
                availableDevices = JSON.parse(jsonStr);
                
                Max.post(`Found ${availableDevices.length} audio devices:`);
                
                // Send device count
                Max.outlet("device_count", availableDevices.length);
                
                // Send each device info
                for (let i = 0; i < availableDevices.length; i++) {
                    const device = availableDevices[i];
                    Max.post(`  ${device.index}: ${device.name} (${device.channels} channels)`);
                    
                    // Send device info: index, name, channels
                    Max.outlet("device_info", device.index, device.name, device.channels);
                }
                
                Max.outlet("status", "devices_listed");
                return;
                
            } catch (e) {
                Max.error("Error parsing device list: " + e);
                Max.outlet("error", "device_parse_error");
            }
        }
    }
    
    Max.error("No device list found in output");
    Max.outlet("error", "no_devices_found");
}

function setDevice(deviceIndex) {
    const index = parseInt(deviceIndex);
    
    // Validate device index
    let deviceFound = false;
    let deviceName = "Unknown Device";
    
    for (let device of availableDevices) {
        if (device.index === index) {
            deviceFound = true;
            deviceName = device.name;
            break;
        }
    }
    
    if (!deviceFound && availableDevices.length > 0) {
        Max.error(`Invalid device index: ${index}`);
        Max.outlet("error", "invalid_device_index");
        return;
    }
    
    selectedDeviceIndex = index;
    Max.post(`✅ Selected audio device ${selectedDeviceIndex}: ${deviceName}`);
    Max.outlet("device_selected", selectedDeviceIndex, deviceName);
}

function startListening() {
    if (isListening) {
        Max.post("Already listening!");
        Max.outlet("status", "already_listening");
        return;
    }
    
    if (selectedDeviceIndex === null) {
        Max.error("Please select an audio device first!");
        Max.outlet("error", "no_device_selected");
        return;
    }
    
    if (!fs.existsSync(TRANSCRIBER_PATH)) {
        Max.error(`Transcriber not found at ${TRANSCRIBER_PATH}`);
        Max.outlet("error", "transcriber_not_found");
        return;
    }
    
    Max.post(`🎤 Starting voice transcription with device ${selectedDeviceIndex}...`);
    
    // Start transcription process with selected device
    const args = ['--device', selectedDeviceIndex.toString()];
    
    try {
        transcriptionProcess = spawn(TRANSCRIBER_PATH, args);
        
        // Handle output from transcription process
        transcriptionProcess.stdout.on('data', (data) => {
            parseTranscriptionOutput(data.toString());
        });
        
        transcriptionProcess.stderr.on('data', (data) => {
            const errorText = data.toString();
            // Filter out harmless warnings
            if (!errorText.includes('DeprecationWarning') && 
                !errorText.includes('DEBUG:') && 
                !errorText.includes('STATUS:')) {
                Max.post("Transcription warning: " + errorText.trim());
            }
        });
        
        transcriptionProcess.on('close', (code) => {
            isListening = false;
            transcriptionProcess = null;
            Max.post(`Transcription process ended (exit code: ${code})`);
            Max.outlet("status", "stopped");
        });
        
        transcriptionProcess.on('error', (err) => {
            isListening = false;
            transcriptionProcess = null;
            Max.error(`Failed to start transcription: ${err.message}`);
            Max.outlet("error", "transcription_start_failed");
        });
        
        isListening = true;
        Max.outlet("status", "listening");
        Max.post("✅ Voice transcription started. Say 'Hey Max' to activate!");
        
    } catch (e) {
        Max.error(`Critical error starting transcription: ${e.message}`);
        Max.outlet("error", "critical_start_error");
    }
}

function stopListening() {
    if (!isListening || !transcriptionProcess) {
        Max.post("Not currently listening");
        Max.outlet("status", "not_listening");
        return;
    }
    
    Max.post("🛑 Stopping voice transcription...");
    
    try {
        transcriptionProcess.kill('SIGTERM');
        transcriptionProcess = null;
        isListening = false;
        Max.outlet("status", "stopped");
        Max.post("✅ Voice transcription stopped");
    } catch (e) {
        Max.error(`Error stopping transcription: ${e.message}`);
        Max.outlet("error", "stop_error");
    }
}

function parseTranscriptionOutput(output) {
    const lines = output.split('\n');
    
    for (let line of lines) {
        line = line.trim();
        
        if (line.startsWith('STATUS:')) {
            const status = line.substring(7).trim();
            
            if (status.includes('Listening for')) {
                Max.outlet("status", "ready");
            } else if (status.includes('Wake word detected')) {
                Max.post("🎯 Wake word detected!");
                Max.outlet("status", "wake_detected");
            } else if (status.includes('Transcribing')) {
                Max.outlet("status", "transcribing");
            }
            
        } else if (line.startsWith('TRANSCRIPTION:')) {
            const transcription = line.substring(14).trim();
            Max.post(`🎯 TRANSCRIPTION: "${transcription}"`);
            
            // Main output - send full transcription
            Max.outlet("transcription", transcription);
            
            // Also send individual words for granular control
            const words = transcription.toLowerCase().split(' ').filter(word => word.length > 0);
            for (let word of words) {
                Max.outlet("word", word);
            }
            
            // Send word count
            Max.outlet("word_count", words.length);
        }
    }
}

function getStatus() {
    if (isListening) {
        Max.outlet("status", "listening");
    } else {
        Max.outlet("status", "stopped");
    }
    
    if (selectedDeviceIndex !== null) {
        Max.outlet("selected_device", selectedDeviceIndex);
    }
    
    Max.outlet("device_count", availableDevices.length);
    Max.post(`Status: ${isListening ? 'Listening' : 'Stopped'}, Device: ${selectedDeviceIndex}, Available devices: ${availableDevices.length}`);
}

// Cleanup on script shutdown
process.on('exit', () => {
    if (isListening && transcriptionProcess) {
        transcriptionProcess.kill('SIGTERM');
    }
});

/*
MAX PATCH INTERFACE:

MESSAGES TO SEND TO NODE.SCRIPT:
- bang                    → Initialize system
- list_devices           → Scan for audio devices  
- set_device <index>     → Select audio device
- start_listening        → Start voice transcription
- stop_listening         → Stop voice transcription
- get_status            → Get current status
- test                  → Test if script is working

OUTLETS FROM NODE.SCRIPT:
- status <message>              → System status updates
- device_count <number>         → Number of available devices
- device_info <index> <name> <channels> → Individual device info
- device_selected <index> <name> → Selected device confirmation
- transcription <text>          → 🎯 MAIN OUTPUT: Transcribed speech
- word <word>                   → Individual words from transcription
- word_count <number>           → Number of words in transcription
- error <message>               → Error messages

EXAMPLE MAX PATCH SETUP:
[bang] → [node.script voice_transcription.js]
[123] → (set_device 123)
[start_listening] → 
[stop_listening] →
                    ↓ outlets ↓
[route status device_count device_info transcription word error]
*/