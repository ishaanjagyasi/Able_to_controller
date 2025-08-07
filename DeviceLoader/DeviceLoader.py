from _Framework.ControlSurface import ControlSurface
import Live

class DeviceLoader(ControlSurface):
    def __init__(self, c_instance):
        ControlSurface.__init__(self, c_instance)
        self.log_message("DeviceLoader: ControlSurface created successfully!")
        
        # Store c_instance for low-level access
        self._c_instance = c_instance
        
        # Create a timer to periodically check for MIDI
        self._midi_check_counter = 0
        
        # Program Change number to device mapping
        self.program_to_device = {
            # INSTRUMENTS (Program 0-11)
            0: "Operator",
            1: "Analog",
            2: "Wavetable",
            3: "Sampler",
            4: "Simpler",
            5: "Collision",
            6: "Electric",
            7: "Tension",
            8: "Drum Rack",
            9: "Impulse",
            10: "Instrument Rack",
            11: "External Instrument",
            
            # AUDIO EFFECTS (Program 12-47)
            12: "EQ Eight",
            13: "EQ Three",
            14: "Compressor",
            15: "Reverb",
            16: "Delay",
            17: "Echo",
            18: "Chorus",
            19: "Flanger",
            20: "Phaser",
            21: "Filter Delay",
            22: "Auto Filter",
            23: "Auto Pan",
            24: "Saturator",
            25: "Overdrive",
            26: "Limiter",
            27: "Gate",
            28: "Utility",
            29: "Spectrum",
            30: "Tuner",
            31: "Vocoder",
            32: "Beat Repeat",
            33: "Cabinet",
            34: "Amp",
            35: "Erosion",
            36: "Redux",
            37: "Vinyl Distortion",
            38: "Dynamic Tube",
            39: "Corpus",
            40: "Resonators",
            41: "Frequency Shifter",
            42: "Grain Delay",
            43: "Looper",
            44: "Multiband Dynamics",
            45: "Glue Compressor",
            46: "Pedal",
            47: "Audio Effect Rack",
            
            # MIDI EFFECTS (Program 48-55)
            48: "Arpeggiator",
            49: "Chord",
            50: "Note Length",
            51: "Pitch",
            52: "Random",
            53: "Scale",
            54: "Velocity",
            55: "MIDI Effect Rack",
            
            # UTILITY COMMANDS (Program 120-127)
            120: "__GET_STATUS__",
            121: "__REFRESH_CACHE__",
            122: "__LIST_DEVICES__",
            123: "__HELP__",
            124: "__PANIC__",
            125: "__CLEAR_TRACK__",
            126: "__SAVE_PRESET__",
            127: "__LOAD_PRESET__",
        }
        
        try:
            self.browser = self.application().browser
            self.song = self.application().get_document()
            self.device_cache = {}
            self.build_device_cache()
            self.log_message("DeviceLoader: Successfully connected to Live API!")
            self.log_message("DeviceLoader: Ready to receive external MIDI on IAC Bus 1")
            
            # Set up aggressive MIDI monitoring
            self._setup_aggressive_midi_monitoring()
            
        except Exception as e:
            self.log_message("DeviceLoader: Error connecting to Live API: %s" % str(e))
    
    def _setup_aggressive_midi_monitoring(self):
        """Set up multiple ways to catch MIDI"""
        try:
            self.log_message("DeviceLoader: Setting up aggressive MIDI monitoring...")
            
            # Try to hook into Live's MIDI system at multiple levels
            self._setup_method_overrides()
            
        except Exception as e:
            self.log_message("DeviceLoader: Aggressive MIDI setup error: %s" % str(e))
    
    def _setup_method_overrides(self):
        """Override multiple methods to catch MIDI"""
        try:
            # Store original methods and override them
            original_update_display = getattr(self, 'update_display', None)
            def update_display_override():
                self._midi_check_counter += 1
                if self._midi_check_counter % 100 == 0:  # Log every 100 calls
                    self.log_message("DeviceLoader: Heartbeat - update_display called %d times" % self._midi_check_counter)
                if original_update_display:
                    original_update_display()
            
            self.update_display = update_display_override
            self.log_message("DeviceLoader: Method overrides installed")
            
        except Exception as e:
            self.log_message("DeviceLoader: Method override error: %s" % str(e))
    
    def refresh_state(self):
        """Override refresh_state to catch MIDI"""
        try:
            self.log_message("DeviceLoader: refresh_state called - checking for MIDI activity")
            # Call parent method if it exists
            if hasattr(ControlSurface, 'refresh_state'):
                ControlSurface.refresh_state(self)
        except Exception as e:
            self.log_message("DeviceLoader: refresh_state error: %s" % str(e))
    
    def update_display(self):
        """Override update_display - this gets called regularly"""
        try:
            # Don't log every time - too spammy
            pass
        except Exception as e:
            self.log_message("DeviceLoader: update_display error: %s" % str(e))
    
    def can_lock_to_devices(self):
        """Override can_lock_to_devices"""
        try:
            self.log_message("DeviceLoader: can_lock_to_devices called")
            return False
        except Exception as e:
            self.log_message("DeviceLoader: can_lock_to_devices error: %s" % str(e))
            return False
    
    def connect_script_instances(self, instanciated_scripts):
        """Override connect_script_instances"""
        try:
            self.log_message("DeviceLoader: connect_script_instances called with: %s" % str(instanciated_scripts))
        except Exception as e:
            self.log_message("DeviceLoader: connect_script_instances error: %s" % str(e))
    
    def build_midi_map(self, midi_map_handle):
        """Tell Live we want to receive external MIDI"""
        try:
            self.log_message("DeviceLoader: build_midi_map called - setting up external MIDI reception")
            self.log_message("DeviceLoader: MIDI map handle: %s" % str(midi_map_handle))
            
            # Try to map ALL MIDI messages
            try:
                # Map all possible Program Change messages
                for program in range(128):
                    Live.MidiMap.map_midi_note_with_feedback(midi_map_handle, 0, program, Live.MidiMap.MapMode.absolute, False)
                    
                self.log_message("DeviceLoader: Mapped 128 Program Change messages to handler")
            except Exception as e:
                self.log_message("DeviceLoader: MIDI mapping error: %s" % str(e))
                
            # For external MIDI, we don't need to map specific CCs
            # Live should forward all MIDI from our input port
        except Exception as e:
            self.log_message("DeviceLoader: build_midi_map error: %s" % str(e))
    
    def receive_midi(self, midi_event):
        """Handle incoming MIDI from external source (Method 1)"""
        try:
            self.log_message("DeviceLoader: receive_midi called with: %s" % str(midi_event))
            self._process_midi(midi_event)
        except Exception as e:
            self.log_message("DeviceLoader: receive_midi error: %s" % str(e))
    
    def handle_nonsysex(self, midi_event):
        """Handle incoming MIDI from external source (Method 2)"""
        try:
            self.log_message("DeviceLoader: handle_nonsysex called with: %s" % str(midi_event))
            self._process_midi(midi_event)
        except Exception as e:
            self.log_message("DeviceLoader: handle_nonsysex error: %s" % str(e))
    
    def handle_sysex(self, midi_event):
        """Handle SysEx messages (Method 3)"""
        try:
            self.log_message("DeviceLoader: handle_sysex called with: %s" % str(midi_event))
        except Exception as e:
            self.log_message("DeviceLoader: handle_sysex error: %s" % str(e))
    
    def _on_control_element_received(self, control_element, value):
        """Handle control element changes (Method 4)"""
        try:
            self.log_message("DeviceLoader: _on_control_element_received - element: %s, value: %s" % (control_element, value))
        except Exception as e:
            self.log_message("DeviceLoader: _on_control_element_received error: %s" % str(e))
    
    def _process_midi(self, midi_event):
        """Process MIDI from any handler method"""
        try:
            # Extract MIDI bytes from the event
            if hasattr(midi_event, 'bytes'):
                midi_bytes = midi_event.bytes
            elif hasattr(midi_event, 'data'):
                midi_bytes = midi_event.data
            elif isinstance(midi_event, (list, tuple)):
                midi_bytes = midi_event
            else:
                midi_bytes = [midi_event]
            
            self.log_message("DeviceLoader: External MIDI received! Raw: %s" % str(midi_bytes))
            
            if len(midi_bytes) >= 2:
                status = midi_bytes[0]
                program = midi_bytes[1]
                
                self.log_message("DeviceLoader: Parsed - Status: %d, Program: %d" % (status, program))
                
                # Check for Program Change (192 + channel, so 192-207)
                if status >= 192 and status <= 207:
                    channel = status - 192
                    self.log_message("DeviceLoader: Program Change %d on channel %d" % (program, channel))
                    
                    if program in self.program_to_device:
                        device_name = self.program_to_device[program]
                        self.log_message("DeviceLoader: Loading device: %s" % device_name)
                        
                        # Handle utility commands
                        if device_name == "__GET_STATUS__":
                            result = self.get_status()
                            self.log_message("DeviceLoader: Status - %s" % result)
                        elif device_name == "__REFRESH_CACHE__":
                            result = self.refresh_cache()
                            self.log_message("DeviceLoader: %s" % result)
                        elif device_name == "__LIST_DEVICES__":
                            device_list = [v for v in self.program_to_device.values() if not v.startswith("__")]
                            self.log_message("DeviceLoader: Available devices: %s" % ", ".join(sorted(set(device_list))))
                        elif device_name == "__HELP__":
                            self.log_message("DeviceLoader: Send Program Change 0-127 to load devices. Check log for mappings.")
                            self.print_program_mappings()
                        elif device_name == "__PANIC__":
                            self.song.stop_all_clips()
                            self.log_message("DeviceLoader: PANIC - Stopped all clips")
                        elif device_name == "__CLEAR_TRACK__":
                            result = self.clear_selected_track()
                            self.log_message("DeviceLoader: %s" % result)
                        else:
                            # Load actual device
                            result = self.load_device(device_name)
                            self.log_message("DeviceLoader PC%d: %s" % (program, result))
                    else:
                        self.log_message("DeviceLoader: Unknown Program Change %d" % program)
                        
                else:
                    self.log_message("DeviceLoader: Not a Program Change (status: %d)" % status)
                    
        except Exception as e:
            self.log_message("DeviceLoader: _process_midi error: %s" % str(e))
    
    def print_program_mappings(self):
        """Print all Program Change mappings to log"""
        self.log_message("DeviceLoader: Program Change Mappings:")
        self.log_message("=== INSTRUMENTS (Program 0-11) ===")
        for prog in range(0, 12):
            if prog in self.program_to_device:
                self.log_message("Program %d: %s" % (prog, self.program_to_device[prog]))
        
        self.log_message("=== AUDIO EFFECTS (Program 12-47) ===")
        for prog in range(12, 48):
            if prog in self.program_to_device:
                self.log_message("Program %d: %s" % (prog, self.program_to_device[prog]))
                
        self.log_message("=== MIDI EFFECTS (Program 48-55) ===")
        for prog in range(48, 56):
            if prog in self.program_to_device:
                self.log_message("Program %d: %s" % (prog, self.program_to_device[prog]))
                
        self.log_message("=== UTILITIES (Program 120-127) ===")
        for prog in range(120, 128):
            if prog in self.program_to_device:
                self.log_message("Program %d: %s" % (prog, self.program_to_device[prog]))
    
    def clear_selected_track(self):
        """Remove all devices from selected track"""
        try:
            selected_track = self.song.view.selected_track
            if not selected_track:
                return "ERROR: No track selected"
            
            # Remove all devices except mixer device
            devices_to_remove = []
            for device in selected_track.devices:
                if hasattr(device, 'class_name') and device.class_name != 'MixerDevice':
                    devices_to_remove.append(device)
            
            for device in devices_to_remove:
                selected_track.delete_device(list(selected_track.devices).index(device))
            
            return "SUCCESS: Cleared %d devices from track '%s'" % (len(devices_to_remove), selected_track.name)
            
        except Exception as e:
            return "ERROR: Clear track failed: %s" % str(e)
    
    def build_device_cache(self):
        """Build a comprehensive cache of all browser items"""
        try:
            self.device_cache = {}
            
            # Get all main browser categories
            categories = [
                ('instruments', self.browser.instruments),
                ('audio_effects', self.browser.audio_effects),
                ('midi_effects', self.browser.midi_effects),
                ('drums', self.browser.drums),
                ('sounds', self.browser.sounds),
            ]
            
            for category_name, category in categories:
                self._index_browser_items(category, category_name, [])
                
            self.log_message("DeviceLoader: Cached %d devices" % len(self.device_cache))
        except Exception as e:
            self.log_message("DeviceLoader: Cache build error: %s" % str(e))
    
    def _index_browser_items(self, item, category, path):
        """Recursively index all browser items"""
        try:
            current_path = path + [item.name]
            
            # If item is loadable, add to cache
            if hasattr(item, 'is_loadable') and item.is_loadable:
                item_name = item.name.lower()
                
                # Store with multiple search keys
                self.device_cache[item_name] = {
                    'item': item,
                    'name': item.name,
                    'category': category,
                    'path': current_path
                }
                
                # Add partial matches for better search
                words = item_name.split()
                for word in words:
                    if len(word) > 2:  # Skip very short words
                        if word not in self.device_cache:
                            self.device_cache[word] = {
                                'item': item,
                                'name': item.name,
                                'category': category,
                                'path': current_path
                            }
            
            # Recursively process children
            if hasattr(item, 'children') and len(item.children) > 0:
                for child in item.children:
                    self._index_browser_items(child, category, current_path)
                    
        except Exception as e:
            # Skip items that cause errors
            pass
    
    def search_device(self, query):
        """Search for device with fuzzy matching"""
        query = query.lower().strip()
        
        # Exact match first
        if query in self.device_cache:
            return self.device_cache[query]
        
        # Partial matches
        matches = []
        for key, item_data in self.device_cache.items():
            if query in key:
                matches.append((key, item_data))
        
        # Sort by relevance (exact matches first, then shorter names)
        matches.sort(key=lambda x: (query not in x[0], len(x[0])))
        
        return matches[0][1] if matches else None
        
    def load_device(self, device_name):
        """Load device by name onto selected track - ACTUALLY WORKS!"""
        try:
            self.log_message("DeviceLoader: Searching for device: %s" % device_name)
            
            # Search for the device
            device_data = self.search_device(device_name)
            
            if not device_data:
                return "ERROR: Device '%s' not found" % device_name
            
            # Get currently selected track
            selected_track = self.song.view.selected_track
            if not selected_track:
                return "ERROR: No track selected"
            
            # Load the device using Live's browser - THIS ACTUALLY LOADS IT!
            browser_item = device_data['item']
            self.browser.load_item(browser_item)
            
            success_msg = "SUCCESS: Loaded '%s' onto '%s'" % (device_data['name'], selected_track.name)
            self.log_message("DeviceLoader: %s" % success_msg)
            return success_msg
            
        except Exception as e:
            error_msg = "ERROR: %s" % str(e)
            self.log_message("DeviceLoader: %s" % error_msg)
            return error_msg
    
    def get_suggestions(self, partial_name, limit=10):
        """Get device suggestions for autocomplete"""
        try:
            partial = partial_name.lower().strip()
            suggestions = []
            
            for key, item_data in self.device_cache.items():
                if partial in key:
                    suggestions.append(item_data['name'])
            
            # Remove duplicates and sort
            unique_suggestions = list(set(suggestions))
            unique_suggestions.sort()
            
            return unique_suggestions[:limit]
        except Exception as e:
            self.log_message("DeviceLoader: Suggestions error: %s" % str(e))
            return []
    
    def get_status(self):
        """Get current status"""
        try:
            track_count = len(self.song.tracks)
            selected_track = self.song.view.selected_track
            track_name = selected_track.name if selected_track else "None"
            cache_size = len(self.device_cache)
            return "STATUS: %d tracks, selected: %s, %d devices cached" % (track_count, track_name, cache_size)
        except Exception as e:
            return "ERROR: %s" % str(e)
    
    def refresh_cache(self):
        """Refresh the device cache"""
        try:
            self.build_device_cache()
            return "SUCCESS: Cache refreshed with %d devices" % len(self.device_cache)
        except Exception as e:
            return "ERROR: Refresh failed: %s" % str(e)
    
    def test_device_loading(self, device_name="Operator"):
        """Test method that can be called directly - not via MIDI"""
        try:
            self.log_message("DeviceLoader: test_device_loading called with: %s" % device_name)
            result = self.load_device(device_name)
            self.log_message("DeviceLoader: Test result: %s" % result)
            return result
        except Exception as e:
            error_msg = "DeviceLoader: Test error: %s" % str(e)
            self.log_message(error_msg)
            return error_msg
    
    def disconnect(self):
        """Cleanup when disconnecting"""
        self.log_message("DeviceLoader: Disconnecting...")
        ControlSurface.disconnect(self)