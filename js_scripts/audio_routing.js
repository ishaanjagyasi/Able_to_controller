// String-Based Audio Routing Script
// Tries setting routing using display names as strings

autowatch = 1;
outlets = 5;

var track = null;
var availableInputTypes = [];
var availableInputChannels = [];
var isRefreshing = false;
var unsetTask = null;

function bang() {
    post("--> Refreshing I/O Routings\n");
    refresh();
}

function refresh() {
    if (unsetTask) {
        unsetTask.cancel();
    }
    
    isRefreshing = true;
    
    var selectedTrack = new LiveAPI("live_set view selected_track");
    
    if (!selectedTrack || selectedTrack.id == 0) {
        post("No track selected.\n");
        clearMenus();
        track = null;
        unsetTask = new Task(function() { isRefreshing = false; });
        unsetTask.schedule(100);
        return;
    }
    
    track = selectedTrack;
    post("Selected Track:", track.get("name"), "\n");
    
    getInputTypes();
    
    unsetTask = new Task(function() { 
        isRefreshing = false; 
        post("--- Refresh complete. Ready for input. ---\n"); 
    });
    unsetTask.schedule(100);
}

function clearMenus() {
    outlet(0, "clear");
    outlet(1, "clear");
    outlet(4, "message", "Select an audio track to begin.");
}

function parseRoutingData(rawData) {
    try {
        if (typeof rawData === 'string') {
            var jsonStart = rawData.indexOf('[');
            var jsonEnd = rawData.lastIndexOf(']') + 1;
            if (jsonStart >= 0 && jsonEnd > jsonStart) {
                var jsonStr = rawData.substring(jsonStart, jsonEnd);
                var parsed = JSON.parse(jsonStr);
                return parsed;
            }
        } else if (rawData instanceof Array && rawData.length == 1 && typeof rawData[0] === 'string') {
            return parseRoutingData(rawData[0]);
        }
        return [];
    } catch (e) {
        post("Error parsing routing data: " + e + "\n");
        return [];
    }
}

function getInputTypes() {
    if (!track) return;
    
    var rawTypes = track.get("available_input_routing_types");
    var parsedTypes = parseRoutingData(rawTypes);
    
    availableInputTypes = [];
    outlet(0, "clear");
    
    for (var i = 0; i < parsedTypes.length; i++) {
        var typeObj = parsedTypes[i];
        var displayName = typeObj.display_name;
        post("  [" + i + "] " + displayName + "\n");
        availableInputTypes.push(displayName); // Store just the display name string
        outlet(0, "append", displayName);
    }
    
    // Set current selection
    var currentType = track.get("input_routing_type");
    post("Current type raw: " + currentType + "\n");
    
    // Try to extract display name from current type
    if (currentType) {
        if (typeof currentType === 'string') {
            var currentParsed = parseRoutingData(currentType);
            if (currentParsed.length > 0 && currentParsed[0].display_name) {
                outlet(0, "set", currentParsed[0].display_name);
                post("Set current to: " + currentParsed[0].display_name + "\n");
            }
        } else if (typeof currentType === 'object' && currentType.display_name) {
            outlet(0, "set", currentType.display_name);
            post("Set current to: " + currentType.display_name + "\n");
        }
    }
    
    getInputChannels();
}

function getInputChannels() {
    if (!track) return;
    
    var rawChannels = track.get("available_input_routing_channels");
    var parsedChannels = parseRoutingData(rawChannels);
    
    availableInputChannels = [];
    outlet(1, "clear");
    
    for (var i = 0; i < parsedChannels.length; i++) {
        var channelObj = parsedChannels[i];
        var displayName = channelObj.display_name;
        post("  [" + i + "] " + displayName + "\n");
        availableInputChannels.push(displayName); // Store just the display name string
        outlet(1, "append", displayName);
    }
    
    // Set current channel selection
    var currentChannel = track.get("input_routing_channel");
    if (currentChannel && typeof currentChannel === 'object' && currentChannel.display_name) {
        outlet(1, "set", currentChannel.display_name);
    }
    
    updateStatus();
}

// Multiple approaches to setting input type
function set_input_type(index) {
    if (isRefreshing) {
        post("Info: Input ignored during refresh.\n");
        return;
    }
    if (!track || index < 0 || index >= availableInputTypes.length) {
        post("Error: Invalid input type index: " + index + "\n");
        return;
    }
    
    var typeName = availableInputTypes[index];
    post("=== ATTEMPTING TO SET INPUT TYPE TO: " + typeName + " ===\n");
    
    // Method 1: Set using display name string
    try {
        post("Method 1: Setting with display name string\n");
        track.set("input_routing_type", typeName);
        post("✓ Method 1 SUCCESS!\n");
        checkIfChanged(typeName);
        return;
    } catch (e1) {
        post("Method 1 FAILED: " + e1 + "\n");
    }
    
    // Method 2: Set using property assignment
    try {
        post("Method 2: Setting with property assignment\n");
        track.property = "input_routing_type";
        track.property = typeName;
        post("✓ Method 2 SUCCESS!\n");
        checkIfChanged(typeName);
        return;
    } catch (e2) {
        post("Method 2 FAILED: " + e2 + "\n");
    }
    
    // Method 3: Set using call method
    try {
        post("Method 3: Setting with call method\n");
        track.call("set", "input_routing_type", typeName);
        post("✓ Method 3 SUCCESS!\n");
        checkIfChanged(typeName);
        return;
    } catch (e3) {
        post("Method 3 FAILED: " + e3 + "\n");
    }
    
    // Method 4: Create LiveAPI path and set
    try {
        post("Method 4: Setting with path\n");
        var pathAPI = new LiveAPI(track.path + " input_routing_type");
        pathAPI.set(typeName);
        post("✓ Method 4 SUCCESS!\n");
        checkIfChanged(typeName);
        return;
    } catch (e4) {
        post("Method 4 FAILED: " + e4 + "\n");
    }
    
    post("❌ ALL METHODS FAILED - Input routing may not be settable via API\n");
}

function set_input_channel(index) {
    if (isRefreshing) return;
    if (!track || index < 0 || index >= availableInputChannels.length) {
        post("Error: Invalid input channel index: " + index + "\n");
        return;
    }
    
    var channelName = availableInputChannels[index];
    post("=== ATTEMPTING TO SET INPUT CHANNEL TO: " + channelName + " ===\n");
    
    try {
        track.set("input_routing_channel", channelName);
        post("✓ Input channel set successfully!\n");
        
        // Check if it actually changed
        var task = new Task(function() {
            var newChannel = track.get("input_routing_channel");
            post("After setting, current channel: " + newChannel + "\n");
        });
        task.schedule(100);
        
    } catch (e) {
        post("Error setting input channel: " + e + "\n");
    }
}

function checkIfChanged(expectedName) {
    // Check if the change actually took effect
    var task = new Task(function() {
        try {
            var currentType = track.get("input_routing_type");
            post("After setting, current type: " + currentType + "\n");
            
            if (typeof currentType === 'object' && currentType.display_name) {
                if (currentType.display_name === expectedName) {
                    post("🎉 CONFIRMED: Input type actually changed to " + expectedName + "\n");
                } else {
                    post("😞 Input type is still " + currentType.display_name + ", not " + expectedName + "\n");
                }
            } else {
                post("Could not verify change - current type format: " + typeof currentType + "\n");
            }
        } catch (e) {
            post("Error checking if changed: " + e + "\n");
        }
    });
    task.schedule(100);
}

// Test function to try alternative API approaches
function test_alternative() {
    post("=== TESTING ALTERNATIVE API APPROACHES ===\n");
    
    if (!track) {
        post("No track selected\n");
        return;
    }
    
    try {
        // Try accessing the mixer device
        var mixerDevice = track.get("mixer_device");
        post("Mixer device: " + mixerDevice + "\n");
        
        if (mixerDevice) {
            var mixerAPI = new LiveAPI("id " + mixerDevice);
            post("Mixer API created: " + mixerAPI.id + "\n");
            
            // Check if mixer has routing properties
            try {
                var mixerProps = mixerAPI.info();
                post("Mixer properties: " + mixerProps + "\n");
            } catch (e) {
                post("Could not get mixer properties: " + e + "\n");
            }
        }
        
    } catch (e) {
        post("Error testing alternatives: " + e + "\n");
    }
}

function updateStatus() {
    if (!track) {
        outlet(4, "message", "Select a track to begin.");
        return;
    }
    var trackName = track.get("name");
    outlet(4, "message", "Controlling I/O for track: " + trackName[0]);
}

function anything() {
    var message = messagename;
    var args = arrayfromargs(arguments);
    
    switch (message) {
        case "set_input_type":
            if (args.length > 0) {
                set_input_type(args[0]);
            }
            break;
        case "set_input_channel":
            if (args.length > 0) {
                set_input_channel(args[0]);
            }
            break;
        case "test_alt":
            test_alternative();
            break;
        case "refresh":
            refresh();
            break;
        default:
            post("Commands: set_input_type <index>, set_input_channel <index>, test_alt, refresh\n");
    }
}

post("--- String-Based Audio Routing Script Loaded ---\n");