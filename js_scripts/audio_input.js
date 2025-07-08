// Correct Input Routing Control for Max for Live
// Using proper dictionary format as specified in LOM

autowatch = 1;

function init() {
    post("=== Correct Input Routing Control ===\n");
}

function getCurrentTrack() {
    try {
        var currentTrack = new LiveAPI("live_set view selected_track");
        if (!currentTrack || currentTrack.id == 0) {
            post("No track selected\n");
            return null;
        }
        return currentTrack;
    } catch (e) {
        post("Error getting track: " + e + "\n");
        return null;
    }
}

function showRoutingInfo() {
    var track = getCurrentTrack();
    if (!track) return;
    
    try {
        var trackName = track.get("name")[0];
        post("=== Track: " + trackName + " ===\n");
        
        // Get available input routing types (these are the dictionary objects)
        var availableTypes = track.get("available_input_routing_types");
        post("Available input types:\n");
        for (var i = 0; i < availableTypes.length; i++) {
            post("  [" + i + "] " + availableTypes[i] + "\n");
        }
        
        // Get available input routing channels
        var availableChannels = track.get("available_input_routing_channels");
        post("Available input channels:\n");
        for (var i = 0; i < availableChannels.length; i++) {
            post("  [" + i + "] " + availableChannels[i] + "\n");
        }
        
        // Get current settings
        var currentType = track.get("input_routing_type");
        var currentChannel = track.get("input_routing_channel");
        
        post("Current input type: " + currentType + "\n");
        post("Current input channel: " + currentChannel + "\n");
        
        outlet(0, "info", availableTypes.length, availableChannels.length);
        
    } catch (e) {
        post("Error showing routing info: " + e + "\n");
    }
}

function setInputType(index) {
    post("Setting input type to index: " + index + "\n");
    
    var track = getCurrentTrack();
    if (!track) return;
    
    try {
        var availableTypes = track.get("available_input_routing_types");
        
        if (index >= 0 && index < availableTypes.length) {
            // Get the dictionary object at the specified index
            var typeDict = availableTypes[index];
            
            post("Setting type to: " + typeDict + "\n");
            
            // Set using the entire dictionary object
            track.set("input_routing_type", typeDict);
            
            post("✓ Input type set successfully!\n");
            
            // Show updated info
            showRoutingInfo();
            
        } else {
            post("Invalid type index: " + index + " (available: 0-" + (availableTypes.length-1) + ")\n");
        }
        
    } catch (e) {
        post("Error setting input type: " + e + "\n");
    }
}

function setInputChannel(index) {
    post("Setting input channel to index: " + index + "\n");
    
    var track = getCurrentTrack();
    if (!track) return;
    
    try {
        var availableChannels = track.get("available_input_routing_channels");
        
        if (index >= 0 && index < availableChannels.length) {
            // Get the dictionary object at the specified index
            var channelDict = availableChannels[index];
            
            post("Setting channel to: " + channelDict + "\n");
            
            // Set using the entire dictionary object
            track.set("input_routing_channel", channelDict);
            
            post("✓ Input channel set successfully!\n");
            
            // Show updated info
            showRoutingInfo();
            
        } else {
            post("Invalid channel index: " + index + " (available: 0-" + (availableChannels.length-1) + ")\n");
        }
        
    } catch (e) {
        post("Error setting input channel: " + e + "\n");
    }
}

// Preset functions for common inputs
function setToExtIn() {
    post("Setting to External Input...\n");
    var track = getCurrentTrack();
    if (!track) return;
    
    try {
        var availableTypes = track.get("available_input_routing_types");
        
        // Look for "Ext. In" in the available types
        for (var i = 0; i < availableTypes.length; i++) {
            var typeStr = availableTypes[i].toString();
            if (typeStr.indexOf("Ext. In") !== -1 || typeStr.indexOf("External") !== -1) {
                post("Found External Input at index " + i + "\n");
                setInputType(i);
                return;
            }
        }
        post("External Input not found in available types\n");
        
    } catch (e) {
        post("Error setting to External Input: " + e + "\n");
    }
}

function setToResampling() {
    post("Setting to Resampling...\n");
    var track = getCurrentTrack();
    if (!track) return;
    
    try {
        var availableTypes = track.get("available_input_routing_types");
        
        // Look for "Resampling" in the available types
        for (var i = 0; i < availableTypes.length; i++) {
            var typeStr = availableTypes[i].toString();
            if (typeStr.indexOf("Resampling") !== -1) {
                post("Found Resampling at index " + i + "\n");
                setInputType(i);
                return;
            }
        }
        post("Resampling not found in available types\n");
        
    } catch (e) {
        post("Error setting to Resampling: " + e + "\n");
    }
}

function setToNoInput() {
    post("Setting to No Input...\n");
    var track = getCurrentTrack();
    if (!track) return;
    
    try {
        var availableTypes = track.get("available_input_routing_types");
        
        // Look for "No Input" in the available types
        for (var i = 0; i < availableTypes.length; i++) {
            var typeStr = availableTypes[i].toString();
            if (typeStr.indexOf("No Input") !== -1) {
                post("Found No Input at index " + i + "\n");
                setInputType(i);
                return;
            }
        }
        post("No Input not found in available types\n");
        
    } catch (e) {
        post("Error setting to No Input: " + e + "\n");
    }
}

// Handle messages
function anything() {
    var message = messagename;
    var args = arrayfromargs(arguments);
    
    switch (message) {
        case "show":
        case "info":
            showRoutingInfo();
            break;
        case "set_type":
            if (args.length > 0) {
                setInputType(args[0]);
            } else {
                post("set_type requires index (e.g., set_type 0)\n");
            }
            break;
        case "set_channel":
            if (args.length > 0) {
                setInputChannel(args[0]);
            } else {
                post("set_channel requires index (e.g., set_channel 1)\n");
            }
            break;
        case "ext_in":
            setToExtIn();
            break;
        case "resampling":
            setToResampling();
            break;
        case "no_input":
            setToNoInput();
            break;
        case "test":
            post("Correct Input Routing Control is working\n");
            break;
        default:
            post("Available commands:\n");
            post("  show/info - Show available routing options\n");
            post("  set_type <index> - Set input type by index\n");
            post("  set_channel <index> - Set input channel by index\n");
            post("  ext_in - Set to External Input\n");
            post("  resampling - Set to Resampling\n");
            post("  no_input - Set to No Input\n");
            post("  test - Test if script is working\n");
    }
}

// Initialize
init();