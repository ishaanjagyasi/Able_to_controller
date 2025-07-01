import sys
import os
import pyaudio
import pocketsphinx
from pocketsphinx import Decoder, Config

# --- Get paths for PyInstaller ---
def get_resource_path(relative_path):
    """ Get absolute path to resource, works for dev and for PyInstaller """
    if getattr(sys, 'frozen', False):
        base_path = sys._MEIPASS
    else:
        base_path = os.path.abspath(".")
    return os.path.join(base_path, relative_path)

print("=== Testing Keyphrase Detection ===")

# Test keyphrase detection (simpler than keywords file)
try:
    print("Creating keyphrase config...")
    config = Config(
        hmm=get_resource_path('en-us'),
        dict=get_resource_path('dictionary.dict'),
        keyphrase='hey max',
        kws_threshold=1e-1  # Very relaxed threshold
    )
    
    decoder = Decoder(config)
    print("✓ Keyphrase config worked!")
    
    # Test with audio
    p = pyaudio.PyAudio()
    stream = p.open(
        format=pyaudio.paInt16,
        channels=1,
        rate=16000,
        input=True,
        frames_per_buffer=1024
    )
    
    print("\n🎤 Say 'Hey Max' - testing for 10 seconds...")
    print("Will show ANY detections...")
    
    decoder.start_utt()
    
    for i in range(160):  # ~10 seconds
        buf = stream.read(1024, exception_on_overflow=False)
        decoder.process_raw(buf, False, False)
        
        # Check every few chunks
        if i % 8 == 0:
            hyp = decoder.hyp()
            if hyp:
                print(f"\n🎯 DETECTED: '{hyp.hypstr}' (confidence: {hyp.prob})")
                decoder.end_utt()
                decoder.start_utt()
            else:
                print(".", end="", flush=True)
    
    decoder.end_utt()
    stream.close()
    p.terminate()
    
    print("\n✓ Keyphrase test completed")

except Exception as e:
    print(f"Keyphrase test failed: {e}")
    import traceback
    traceback.print_exc()

print("\n=== Testing with relaxed keywords file ===")

# Test with the relaxed keywords file
try:
    print("Creating relaxed keywords config...")
    config2 = Config(
        hmm=get_resource_path('en-us'),
        dict=get_resource_path('dictionary.dict'),
        kws=get_resource_path('keywords.kws')
    )
    
    decoder2 = Decoder(config2)
    print("✓ Keywords config worked!")
    
    # Quick test
    p = pyaudio.PyAudio()
    stream = p.open(
        format=pyaudio.paInt16,
        channels=1,
        rate=16000,
        input=True,
        frames_per_buffer=1024
    )
    
    print("\n🎤 Say 'Hey Max' with keywords file - testing for 5 seconds...")
    
    decoder2.start_utt()
    
    for i in range(80):  # ~5 seconds
        buf = stream.read(1024, exception_on_overflow=False)
        decoder2.process_raw(buf, False, False)
        
        if i % 8 == 0:
            hyp = decoder2.hyp()
            if hyp:
                print(f"\n🎯 KEYWORDS DETECTED: '{hyp.hypstr}' (confidence: {hyp.prob})")
                decoder2.end_utt()
                decoder2.start_utt()
            else:
                print(".", end="", flush=True)
    
    decoder2.end_utt()
    stream.close()
    p.terminate()
    
    print("\n✓ Keywords test completed")

except Exception as e:
    print(f"Keywords test failed: {e}")
    import traceback
    traceback.print_exc()