"""Máscara del árbol para las partículas de la portada.

Saca el canal alfa del símbolo (public/brand/aterna-mark.png) a 512 × 512 en
escala de grises: blanco = árbol. La lee src/lib/tree/shapes.ts para colocar
las partículas. Solo hay que volver a lanzarlo si cambia el símbolo:

    python3 scripts/tree/make-mask.py public/brand/aterna-mark.png public/tree/v1/mark-mask.webp
"""

import sys

from PIL import Image

src, dst = sys.argv[1], sys.argv[2]
alpha = Image.open(src).convert("RGBA").getchannel("A")
alpha = alpha.resize((512, 512), Image.LANCZOS)
# WebP con pérdida: es una máscara y se lee con umbral (23 KB frente a 62 KB en PNG).
alpha.save(dst, quality=90, method=6)
print(dst, alpha.size)
