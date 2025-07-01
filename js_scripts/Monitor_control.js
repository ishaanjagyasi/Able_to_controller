// Simple Track Monitoring Control for Max for Live
// Debugging version to figure out the correct values

autowatch = 1;

var selectedTrack = null;

function init() {
    post("=== Track Monitoring Script Started ===\n");
}

function bang() {
    post("Bang received\n");
    refreshTrack();
}

// Simple refresh function - get fresh track every time
function refreshTrack() {
    post("--- Refreshing Track ---\n");
    
    try {
        // DON'T store the track reference - get it fresh each time
        var currentTrack = new LiveAPI("live_set view selected_track");
        
        if (currentTrack && currentTrack.id != 0) {
            var name = currentTrack.get("name");
            post("Track name result: " + name + "\n");
            
            if (name && name.length > 0) {
                post("Selected track: " + name[0] + "\n");
                post("Track ID: " + currentTrack.id + "\n");
                
                // Store this track reference
                selectedTrack = currentTrack;
                
                // Get current monitoring state
                getCurrentState();
            } else {
                post("Could not get track name\n");
            }
        } else {
            post("No valid track selected\n");
        }
    } catch (e) {
        post("Error in refreshTrack: " + e + "\n");
    }
}

function getCurrentState() {
    // Get fresh track reference for getting state too
    try {
        var currentTrack = new LiveAPI("live_set view selected_track");
        
        if (!currentTrack || currentTrack.id == 0) {
            post("No track to get state from\n");
            return;
        }
        
        var state = currentTrack.get("current_monitoring_state");
        post("Monitoring state result: " + state + "\n");
        
        if (state && state.length > 0) {
            var stateValue = state[0];
            post("Current monitoring state: " + stateValue + "\n");
            
            // Output to Max
            outlet(0, "current_state", stateValue);
        }
    } catch (e) {
        post("Error getting state: " + e + "\n");
    }
}

// Simple set functions
function setToOff() {
    post("Trying to set to OFF (value 2)\n");
    setMonitoringState(2);
}

function setToIn() {
    post("Trying to set to IN (value 0)\n");
    setMonitoringState(0);
}

function setToAuto() {
    post("Trying to set to AUTO (value 1)\n");
    setMonitoringState(1);
}

function setMonitoringState(value) {
    // ALWAYS get a fresh track reference before setting
    post("Getting fresh track reference before setting...\n");
    
    try {
        var currentTrack = new LiveAPI("live_set view selected_track");
        
        if (!currentTrack || currentTrack.id == 0) {
            post("No track selected for setting state\n");
            return;
        }
        
        var name = currentTrack.get("name");
        if (name && name.length > 0) {
            post("Setting monitoring on track: " + name[0] + " (ID: " + currentTrack.id + ")\n");
        }
        
        post("Setting monitoring state to: " + value + "\n");
        currentTrack.set("current_monitoring_state", value);
        post("Set command completed\n");
        
        // Update our stored reference
        selectedTrack = currentTrack;
        
        // Check what it actually got set to
        var task = new Task(function() {
            getCurrentState();
        });
        task.schedule(50);
        
    } catch (e) {
        post("Error setting state: " + e + "\n");
    }
}

// Handle different message types
function msg_int(value) {
    post("Received integer: " + value + "\n");
    setMonitoringState(value);
}

function msg_float(value) {
    msg_int(Math.floor(value));
}

function anything() {
    var message = messagename;
    post("Received message: " + message + "\n");
    
    switch (message) {
        case "refresh":
            refreshTrack();
            break;
        case "off":
            setToOff();
            break;
        case "in":
            setToIn();
            break;
        case "auto":
            setToAuto();
            break;
        case "get":
            getCurrentState();
            break;
        case "test":
            post("Test message received - script is working\n");
            break;
        default:
            post("Unknown message: " + message + "\n");
    }
}

// Initialize when loaded
init();