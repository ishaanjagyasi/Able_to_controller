outlets = 5;

var api = new LiveAPI();
var allTracks = [];
var trackCount = 0;
var currentIndex = 0;

function loadbang() {
    post("Track Selector loaded\n");
    refresh();
}

function refresh() {
    try {
        allTracks = [];
        
        // Get ALL audio tracks dynamically
        api.path = "live_set tracks";
        var audioTracks = api.children.length;
        post("=== SCANNING " + audioTracks + " AUDIO TRACKS ===\n");

        // Check every single track in your session
        for (var i = 0; i < audioTracks; i++) {
            api.path = "live_set tracks " + i;
            
            try {
                var name = api.get("name")[0];
                var trackId = api.id;
                
                post("Track " + i + ": name='" + name + "' type=" + typeof name + " id=" + trackId + "\n");
                
                // SIMPLIFIED CHECK - add ALL tracks with any name
                if (name) {
                    allTracks.push({
                        name: name,
                        type: "track", 
                        index: i,
                        path: "live_set tracks " + i,
                        id: trackId
                    });
                    post("  --> ADDED: " + name + "\n");
                } else {
                    post("  --> SKIPPED: no name\n");
                }
            } catch (trackError) {
                post("  --> ERROR: " + trackError.toString() + "\n");
                continue;
            }
        }
        
        post("=== FOUND " + allTracks.length + " AUDIO TRACKS ===\n");
        
        // Get return tracks
        api.path = "live_set return_tracks";
        var returnTracks = api.children.length;
        post("=== SCANNING " + returnTracks + " RETURN TRACKS ===\n");

        for (var j = 0; j < returnTracks; j++) {
            api.path = "live_set return_tracks " + j;
            
            try {
                var returnName = api.get("name")[0];
                var returnId = api.id;
                
                post("Return " + j + ": name='" + returnName + "'\n");
                
                if (returnName) {
                    allTracks.push({
                        name: "Return: " + returnName,
                        type: "return",
                        index: j,
                        path: "live_set return_tracks " + j,
                        id: returnId
                    });
                    post("  --> ADDED: Return: " + returnName + "\n");
                }
            } catch (returnError) {
                post("  --> ERROR: " + returnError.toString() + "\n");
                continue;
            }
        }
        
        // Get master track
        try {
            api.path = "live_set master_track";
            var masterName = api.get("name")[0];
            var masterId = api.id;
            allTracks.push({
                name: "Master: " + masterName,
                type: "master",
                index: 0,
                path: "live_set master_track",
                id: masterId
            });
            post("ADDED: Master: " + masterName + "\n");
        } catch (masterError) {
            post("Master track error: " + masterError.toString() + "\n");
        }
        
        trackCount = allTracks.length;
        post("=== TOTAL TRACKS FOUND: " + trackCount + " ===\n");
        
        // Populate umenu with ALL tracks found
        outlet(1, "clear");
        for (var k = 0; k < allTracks.length; k++) {
            outlet(1, "append", allTracks[k].name);
            post("Adding to umenu: " + allTracks[k].name + "\n");
        }
        
        findCurrentPosition();
        
    } catch (error) {
        post("ERROR: " + error.toString() + "\n");
    }
}

function findCurrentPosition() {
    try {
        api.path = "live_set view selected_track";
        var selectedPath = api.path.replace(/"/g, "");
        
        for (var i = 0; i < allTracks.length; i++) {
            if (allTracks[i].path === selectedPath) {
                currentIndex = i;
                outlet(0, currentIndex);
                outlet(2, allTracks[i].name);
                return;
            }
        }
    } catch (error) {
        // Silent fail
    }
}

function select(trackName) {
    for (var i = 0; i < allTracks.length; i++) {
        if (allTracks[i].name === trackName) {
            var trackId = allTracks[i].id;
            var trackIndex = allTracks[i].index;
            
            currentIndex = i;
            outlet(0, currentIndex);
            outlet(2, allTracks[i].name);
            outlet(3, ["set", "selected_track", "id", parseInt(trackId)]);
            outlet(4, trackIndex);
            return;
        }
    }
}

function next() {
    if (currentIndex < allTracks.length - 1) {
        var nextIndex = currentIndex + 1;
        var track = allTracks[nextIndex];
        
        currentIndex = nextIndex;
        outlet(0, currentIndex);
        outlet(2, track.name);
        outlet(3, ["set", "selected_track", "id", parseInt(track.id)]);
        outlet(4, track.index);
    }
}

function prev() {
    if (currentIndex > 0) {
        var prevIndex = currentIndex - 1;
        var track = allTracks[prevIndex];
        
        currentIndex = prevIndex;
        outlet(0, currentIndex);
        outlet(2, track.name);
        outlet(3, ["set", "selected_track", "id", parseInt(track.id)]);
        outlet(4, track.index);
    }
}

function msg_int(index) {
    if (index >= 0 && index < allTracks.length) {
        var track = allTracks[index];
        currentIndex = index;
        outlet(0, currentIndex);
        outlet(2, track.name);
        outlet(3, ["set", "selected_track", "id", parseInt(track.id)]);
        outlet(4, track.index);
    }
}