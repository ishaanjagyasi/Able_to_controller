# -*- mode: python ; coding: utf-8 -*-

import whisper
import os

# Get whisper package location for bundling assets
whisper_path = os.path.dirname(whisper.__file__)
whisper_assets = os.path.join(whisper_path, 'assets')

block_cipher = None

a = Analysis(
    ['realtime_transcribe.py'],
    pathex=[],
    binaries=[],
    datas=[
        ('en-us', 'en-us'),
        ('dictionary.dict', '.'),
        (whisper_assets, 'whisper/assets'),  # Include Whisper assets
    ],
    hiddenimports=[
        'pocketsphinx',
        'pocketsphinx.pocketsphinx',
        '_pocketsphinx',
        'sphinxbase',
        'whisper',
        'whisper.model',
        'whisper.audio',
        'whisper.decoding',
        'whisper.tokenizer',
        'torch',
        'torchaudio',
        'numpy',
        'pyaudio',
        'pocketsphinx.model',
        'pkg_resources.py2_warn',
        'json',
        'tiktoken_ext.openai_public',
        'tiktoken_ext'
    ],
    hookspath=['./'],  # Look for hooks in current directory
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='whisper_transcriber',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)