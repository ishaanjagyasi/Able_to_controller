outlets = 4;

var api = new LiveAPI();
var allTracks = [];
var trackCount = 0;
var currentIndex = 0;

function loadbang() {
    post("===== TRACK SELECTOR LOADING =====\n");
    refresh();
}

function refresh() {
    post("===== REFRESH FUNCTION CALLED =====\n");
    
    try {
        allTracks = [];
        
        // Get audio tracks
        api.path = "live_set tracks";
        var audioTracks = api.children.length;
        post("Found " + audioTracks + " audio tracks\n");

        for (var i = 0; i < audioTracks; i++) {
            api.path = "live_set tracks " + i;
            var name = api.get("name")[0];
            
            // Only add audio tracks that have names (skip undefined ones)
            if (name && name !== "undefined" && name.trim() !== "") {
                allTracks.push({
                    name: name,
                    type: "track",
                    index: i,
                    path: "live_set tracks " + i
                });
                post("Audio Track " + i + ": " + name + "\n");
            } else {
                post("Skipping unnamed audio track " + i + "\n");
            }
        }
        
        // Get return tracks
        api.path = "live_set return_tracks";
        var returnTracks = api.children.length;
        post("Found " + returnTracks + " return tracks\n");

        for (var j = 0; j < returnTracks; j++) {
            api.path = "live_set return_tracks " + j;
            var returnName = api.get("name")[0];
            
            // Only add return tracks that have names (skip undefined ones)
            if (returnName && returnName !== "undefined" && returnName.trim() !== "") {
                allTracks.push({
                    name: "Return: " + returnName,
                    type: "return",
                    index: j,
                    path: "live_set return_tracks " + j
                });
                post("Return Track " + j + ": " + returnName + "\n");
            } else {
                post("Skipping unnamed return track " + j + "\n");
            }
        }
        
        // Get master track
        api.path = "live_set master_track";
        var masterName = api.get("name")[0];
        allTracks.push({
            name: "Master: " + masterName,
            type: "master",
            index: 0,
            path: "live_set master_track"
        });
        post("Master Track: " + masterName + "\n");
        
        trackCount = allTracks.length;
        
        // Clear and populate umenu
        outlet(1, "clear");
        for (var k = 0; k < allTracks.length; k++) {
            outlet(1, "append", allTracks[k].name);
        }
        
        getCurrentTrack();
        outlet(3, "success", "refreshed", trackCount, "total_tracks");
        post("===== REFRESH COMPLETE - " + trackCount + " total tracks =====\n");
        
    } catch (error) {
        post("ERROR in refresh: " + error.toString() + "\n");
        outlet(3, "error", "refresh_failed", error.toString());
    }
}

function getCurrentTrack() {
    try {
        api.path = "live_set view selected_track";
        var selectedPath = api.path;
        post("Selected track path: " + selectedPath + "\n");
        
        // Find which track is selected
        for (var i = 0; i < allTracks.length; i++) {
            if (selectedPath === allTracks[i].path) {
                currentIndex = i;
                outlet(0, currentIndex);
                outlet(2, allTracks[i].name);
                post("Current: " + i + " (" + allTracks[i].name + ")\n");
                return;
            }
        }
        
    } catch (error) {
        post("ERROR getting current track: " + error.toString() + "\n");
    }
}

function selectTrackByIndex(index) {
    try {
        if (index >= 0 && index < allTracks.length) {
            var track = allTracks[index];
            api.path = "live_set view";
            api.call("set", "selected_track", track.path);
            currentIndex = index;
            outlet(0, currentIndex);
            outlet(2, track.name);
            post("Selected: " + index + " (" + track.name + ")\n");
            outlet(3, "success", "selected", index, track.name);
        }
    } catch (error) {
        post("ERROR selecting track: " + error.toString() + "\n");
    }
}

function next() {
    if (currentIndex < trackCount - 1) {
        selectTrackByIndex(currentIndex + 1);
    } else {
        post("Already at last track\n");
    }
}

function prev() {
    if (currentIndex > 0) {
        selectTrackByIndex(currentIndex - 1);
    } else {
        post("Already at first track\n");
    }
}

function msg_int(index) {
    selectTrackByIndex(index);
}