import sys
mode = sys.argv[1] if len(sys.argv)>1 else 'prod'
shell=open('src/shell.html').read()
base = 'https://cdn.jsdelivr.net/npm/three@0.170.0/' if mode=='prod' else '/node_modules/three/'
im = '<script type="importmap">{"imports":{"three":"%sbuild/three.module.js","three/addons/":"%sexamples/jsm/"}}</script>' % (base, base)
hdr = "import * as THREE from 'three';\nimport { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';\nimport { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';\nimport { OrbitControls } from 'three/addons/controls/OrbitControls.js';\n"
import base64
glb = base64.b64encode(open('src/hand-right.glb','rb').read()).decode()
hdr += "// 3D hand model: WebXR generic-hand from @webxr-input-profiles/assets, MIT License, Copyright (c) 2019 Amazon\nconst HAND_GLB_B64 = '" + glb + "';\n"
app = hdr + open('src/content.js').read() + '\n' + open('src/engine.js').read() + '\n' + open('src/ui.js').read()
out = shell.replace('<!--IMPORTMAP-->', im).replace('/*APP*/', app)
open('index.html' if mode=='prod' else 'dev/index.html','w').write(out)
print(mode, len(out))
