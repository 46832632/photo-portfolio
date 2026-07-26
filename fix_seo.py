import os

base = r'D:\摄影网站项目'

# === 1. index.html: footer text + SEO ===
with open(os.path.join(base, 'index.html'), 'r', encoding='utf-8') as f:
    html = f.read()

# Footer text change
html = html.replace(
    '用镜头捕捉静谧中的诗意，在光影间寻找内心的宁静。',
    'Photo By Liscn@21cn.com'
)

# SEO: add missing meta tags after og:locale
old_head_end = '<link rel="manifest" href="manifest.json">'
new_meta = '''<!-- SEO -->
<meta name="author" content="Liscn">
<meta name="keywords" content="桂落春山,摄影作品集,摄影 portfolio,Liscn,风光摄影,人文摄影,街拍,建筑摄影,自然摄影,旅行摄影,摄影艺术">
<link rel="canonical" href="https://46832632.github.io/photo-portfolio/">

<!-- JSON-LD Structured Data -->
<script type="application/ld+json">{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Liscn",
  "url": "https://46832632.github.io/photo-portfolio/",
  "jobTitle": "Photographer",
  "description": "一个关于光影与时间的摄影手记",
  "image": "https://46832632.github.io/photo-portfolio/",
  "knowsAbout": ["Photography", "Portrait Photography", "Landscape Photography", "Street Photography", "Architecture Photography"]
}</script>
<script type="application/ld+json">{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "桂落春山 · 摄影作品集",
  "url": "https://46832632.github.io/photo-portfolio/",
  "description": "人闲桂花落，夜静春山空 — 一个关于光影与时间的摄影手记",
  "publisher": {
    "@type": "Person",
    "name": "Liscn"
  },
  "inLanguage": ["zh-CN", "en"],
  "potentialAction": {
    "@type": "SearchAction",
    "target": "{search_term_string}",
    "query-input": "required name=search_term_string"
  }
}</script>'''

html = html.replace(old_head_end, new_meta + '\n    ' + old_head_end.split('\n')[0].split('<!-- SEO -->')[1].strip() if False else new_meta + '\n    ')

# Better title
html = html.replace('<title>桂落春山 · 摄影作品集</title>', '<title>桂落春山 · Liscn摄影作品集</title>')

# Better description
html = html.replace(
    '<meta name="description" content="人闲桂花落，夜静春山空 — 一个关于光影与时间的摄影手记">',
    '<meta name="description" content="桂落春山 Liscn摄影作品集 — 风光、人文、街拍、建筑、自然、旅行题材摄影作品。人闲桂花落，夜静春山空。">'
)

# OG description update
html = html.replace(
    '<meta property="og:description" content="人闲桂花落，夜静春山空 — 一个关于光影与时间的摄影手记">',
    '<meta property="og:description" content="桂落春山 Liscn摄影作品集 — 风光、人文、街拍、建筑、自然、旅行题材摄影作品">'
)

# OG URL
if '<meta property="og:url"' not in html:
    html = html.replace(
        '<meta property="og:locale"',
        '<meta property="og:url" content="https://46832632.github.io/photo-portfolio/">\n    <meta property="og:locale"'
    )

# Twitter card
if '<meta name="twitter:card"' not in html:
    html = html.replace(
        '<meta property="og:type"',
        '<meta name="twitter:card" content="summary_large_image">\n    <meta name="twitter:title" content="桂落春山 · Liscn摄影作品集">\n    <meta name="twitter:description" content="风光、人文、街拍、建筑、自然、旅行题材摄影作品集">\n    <meta property="og:type"'
    )

with open(os.path.join(base, 'index.html'), 'w', encoding='utf-8') as f:
    f.write(html)
print('OK index.html')

# === 2. Clean duplicate getImageUrl in main.js ===
with open(os.path.join(base, 'js/main.js'), 'r', encoding='utf-8') as f:
    js = f.read()

# Remove the duplicate at line 22: "function getImageUrl(work) { return CONFIG.R2_DOMAIN + "/" + work.filename; }"
old = '\n    function getImageUrl(work) { return CONFIG.R2_DOMAIN + "/" + work.filename; }\n'
if old in js:
    js = js.replace(old, '')
    print('OK removed duplicate getImageUrl from top')
else:
    print('WARN: duplicate getImageUrl pattern not found')

with open(os.path.join(base, 'js/main.js'), 'w', encoding='utf-8') as f:
    f.write(js)

# === 3. robots.txt ===
with open(os.path.join(base, 'robots.txt'), 'w', encoding='utf-8') as f:
    f.write('User-agent: *\nAllow: /\nDisallow: /admin.html\nSitemap: https://46832632.github.io/photo-portfolio/sitemap.xml\n')
print('OK robots.txt')

# === 4. manifest.json SEO fields ===
import json
with open(os.path.join(base, 'manifest.json'), 'r', encoding='utf-8') as f:
    manifest = json.load(f)
manifest['short_name'] = 'Liscn Photography'
manifest['name'] = '桂落春山 · Liscn摄影作品集'
manifest['description'] = '一个关于光影与时间的摄影手记'
with open(os.path.join(base, 'manifest.json'), 'w', encoding='utf-8') as f:
    json.dump(manifest, f, ensure_ascii=False, indent=4)
print('OK manifest.json')

# === 5. Clean .git/index.lock if present ===
lock_path = os.path.join(base, '.git', 'index.lock')
if os.path.exists(lock_path):
    os.remove(lock_path)
    print('OK removed stale git lock')

print('ALL DONE')