#!/bin/bash
# Wrapper script to run the MediaPipe face tracker with the correct path.

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Define the path to the actual executable inside the dist folder
EXECUTABLE_PATH="$SCRIPT_DIR/device/dist/MediaPipe_Facial_Feature_OSC_Out/MediaPipe_Facial_Feature_OSC_Out"

echo "▶ Wrapper script starting..."
echo "▶ Looking for executable at: $EXECUTABLE_PATH"

# Check if the executable exists at the correct path
if [ ! -f "$EXECUTABLE_PATH" ]; then
    echo "❌ ERROR: Executable not found at the expected location!"
    echo "▶ Please ensure you have run PyInstaller and the file exists at: $EXECUTABLE_PATH"
    exit 1
fi

# Run the executable
echo "▶ Starting MediaPipe face tracker..."
exec "$EXECUTABLE_PATH"