# PyInstaller hook for Whisper
from PyInstaller.utils.hooks import collect_data_files, collect_submodules

# Collect all whisper data files (models, assets, etc.)
datas = collect_data_files('whisper')

# Collect all whisper submodules
hiddenimports = collect_submodules('whisper')

# Add specific imports that might be missed
hiddenimports += [
    'whisper.model',
    'whisper.audio', 
    'whisper.decoding',
    'whisper.tokenizer',
    'tiktoken_ext.openai_public',
    'tiktoken_ext'
]