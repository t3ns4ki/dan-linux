"""Create a portable source ZIP; no git metadata, dependencies or server secrets."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import hashlib
import json

root = Path(__file__).resolve().parent.parent
out = root / 'build'
out.mkdir(exist_ok=True)
files = []
for name in ['index.html', 'app.js', 'data.js', 'style.css', 'config.js', '.nojekyll',
             '.gitignore', 'README.md', 'package.json', 'package-lock.json', 'LICENSE', 'NOTICE']:
    if (root / name).is_file():
        files.append(root / name)
for name in ['assets', 'v2', 'share', 'vendor', 'supabase', 'docs', 'scripts', 'tests']:
    files.extend(path for path in (root / name).rglob('*') if path.is_file()
                 and '__pycache__' not in path.parts and '.temp' not in path.parts and not path.name.startswith('.env'))
archive = out / 'dan-linux-2.0-source.zip'
with ZipFile(archive, 'w', ZIP_DEFLATED, compresslevel=9) as z:
    for file in sorted(files):
        z.write(file, file.relative_to(root).as_posix())
manifest = {'file': archive.name, 'sha256': hashlib.sha256(archive.read_bytes()).hexdigest(),
            'files': len(files), 'bytes': archive.stat().st_size}
(out / 'source-manifest.json').write_text(json.dumps(manifest, indent=2)+'\n')
print(json.dumps(manifest))
