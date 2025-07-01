import sys
import os
import pyaudio
import numpy as np
import pocketsphinx
from pocketsphinx import Decoder, Config
import json
import argparse

# Import whisper at module level but handle import errors gracefully
try:
    import whisper
    WHISPER_AVAILABLE = True
except ImportError:
    WHISPER_AVAILABLE = False
    whisper = None

# --- USER CONFIGURATION ---
RECORD_SECONDS = 3
SAMPLE_RATE = 16000
CHUNK_SIZE = 1024
# --- END CONFIGURATION ---

# --- Get paths for PyInstaller ---
def get_resource_path(relative_path):
    """ Get absolute path to resource, works for dev and for PyInstaller """
    if getattr(sys, 'frozen', False):
        base_path = sys._MEIPASS
    else:
        base_path = os.path.abspath(".")
    return os.path.join(base_path, relative_path)

def list_audio_devices():
    """List all available audio input devices - lightweight, no Whisper needed"""
    try:
        p = pyaudio.PyAudio()
        devices = []
        
        print("AVAILABLE AUDIO DEVICES:")
        for i in range(p.get_device_count()):
            info = p.get_device_info_by_index(i)
            if info['maxInputChannels'] > 0:  # Only input devices
                device_info = {
                    'index': i,
                    'name': info['name'],
                    'channels': info['maxInputChannels'],
                    'sample_rate': int(info['defaultSampleRate'])
                }
                devices.append(device_info)
                print(f"  {i}: {info['name']} ({info['maxInputChannels']} channels)")
        
        p.terminate()
        print(f"DEVICES_JSON:{json.dumps(devices)}")
        return devices
        
    except Exception as e:
        print(f"ERROR: Failed to list audio devices: {e}", file=sys.stderr)
        return []

def run_transcription(device_index=None):
    """Main transcription function"""
    
    # Load Whisper Model
    try:
        print("STATUS: Loading Whisper model...", file=sys.stderr)
        whisper_model = whisper.load_model("base")  # Better accuracy than tiny
        print("STATUS: Whisper model loaded", file=sys.stderr)
    except Exception as e:
        print(f"ERROR: Failed to load Whisper model: {e}", file=sys.stderr)
        return False

    # PocketSphinx Configuration
    try:
        print("STATUS: Creating PocketSphinx configuration...", file=sys.stderr)
        config = Config(
            hmm=get_resource_path('en-us'),
            dict=get_resource_path('dictionary.dict'),
            keyphrase='hey max',
            kws_threshold=1e-1
        )
        decoder = Decoder(config)
        print("STATUS: PocketSphinx initialized", file=sys.stderr)
    except Exception as e:
        print(f"ERROR: Failed to initialize PocketSphinx: {e}", file=sys.stderr)
        return False

    # Initialize PyAudio
    try:
        p = pyaudio.PyAudio()
        
        # Use specified device or default
        stream_kwargs = {
            'format': pyaudio.paInt16,
            'channels': 1,
            'rate': SAMPLE_RATE,
            'input': True,
            'frames_per_buffer': CHUNK_SIZE
        }
        
        if device_index is not None:
            stream_kwargs['input_device_index'] = device_index
            # Get device info for confirmation
            device_info = p.get_device_info_by_index(device_index)
            print(f"STATUS: Using audio device: {device_info['name']}", file=sys.stderr)
        
        stream = p.open(**stream_kwargs)
        print("STATUS: Audio stream opened", file=sys.stderr)
        
    except Exception as e:
        print(f"ERROR: Failed to open audio stream: {e}", file=sys.stderr)
        return False

    # Main listening loop
    try:
        print("STATUS: Listening for 'Hey Max'...")
        sys.stdout.flush()
        
        decoder.start_utt()
        chunk_count = 0

        while True:
            try:
                buf = stream.read(CHUNK_SIZE, exception_on_overflow=False)
                if buf:
                    decoder.process_raw(buf, False, False)
                    chunk_count += 1
                    
                    # Check for detection every 8 chunks
                    if chunk_count % 8 == 0:
                        hyp = decoder.hyp()
                        if hyp is not None:
                            detected_text = hyp.hypstr.lower().strip()
                            
                            if 'hey max' in detected_text:
                                print("STATUS: Wake word detected! Recording...")
                                sys.stdout.flush()
                                
                                decoder.end_utt()
                                
                                # Record audio for transcription
                                frames = []
                                for _ in range(0, int(SAMPLE_RATE / CHUNK_SIZE * RECORD_SECONDS)):
                                    data = stream.read(CHUNK_SIZE, exception_on_overflow=False)
                                    frames.append(data)
                                
                                # Transcribe with Whisper
                                audio_data = np.frombuffer(b''.join(frames), dtype=np.int16)
                                audio_float = audio_data.astype(np.float32) / 32768.0
                                
                                print("STATUS: Transcribing...")
                                sys.stdout.flush()
                                
                                result = whisper_model.transcribe(
                                    audio_float,
                                    fp16=False,
                                    language='en',
                                    condition_on_previous_text=False,
                                    temperature=0,
                                    best_of=1,
                                    beam_size=1,
                                    word_timestamps=False
                                )
                                
                                transcription = result['text'].strip()
                                if transcription:
                                    print(f"TRANSCRIPTION:{transcription}")
                                    sys.stdout.flush()
                                
                                print("STATUS: Listening for 'Hey Max'...")
                                sys.stdout.flush()
                                decoder.start_utt()
                                chunk_count = 0
                            else:
                                # Reset decoder after detection
                                decoder.end_utt()
                                decoder.start_utt()
                        else:
                            # Show activity
                            if chunk_count % 64 == 0:
                                print(".", end="", flush=True, file=sys.stderr)
            
            except KeyboardInterrupt:
                break
            except Exception as e:
                print(f"ERROR: Audio processing error: {e}", file=sys.stderr)
                try:
                    decoder.end_utt()
                    decoder.start_utt()
                except:
                    pass
        
        decoder.end_utt()
        
    except Exception as e:
        print(f"ERROR: Main loop error: {e}", file=sys.stderr)
        return False
    
    finally:
        try:
            if 'stream' in locals():
                stream.close()
            if 'p' in locals():
                p.terminate()
        except:
            pass
    
    return True

def main():
    parser = argparse.ArgumentParser(description='Voice transcription with wake word detection')
    parser.add_argument('--list-devices', action='store_true', help='List available audio devices')
    parser.add_argument('--device', type=int, help='Audio device index to use')
    
    args = parser.parse_args()
    
    if args.list_devices:
        # Only list devices - don't load Whisper/heavy components
        list_audio_devices()
        return
    else:
        print("STATUS: Voice transcription system starting...")
        run_transcription(args.device)

if __name__ == "__main__":
    main()