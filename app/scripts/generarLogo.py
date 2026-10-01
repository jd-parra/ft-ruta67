"""Genera el logo de Ruta67 en todos los tamaños (app y panel).

    python3 scripts/generarLogo.py

Diseño: cuadro morado (#6D28D9) con un autobús blanco de frente y «67» debajo.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

RAIZ = Path(__file__).resolve().parent.parent
FUENTE = Path.home() / ".local/share/fonts/Inter-VariableFont_slnt,wght.1cccc37b.ttf"
MORADO = (109, 40, 217, 255)
MORADO_CLARO = (124, 58, 237, 255)
BLANCO = (255, 255, 255, 255)
LADO = 1024
SUPER = 4  # se dibuja 4x más grande y se reduce: bordes suaves


def fuente(tamano):
    f = ImageFont.truetype(str(FUENTE), tamano)
    f.set_variation_by_name("ExtraBold")
    return f


def dibujar_marca(d, cx, cy, escala, color_detalle):
    """Autobús + «67» centrados en (cx, cy). escala 1 = alto total ~600 px en un lienzo de 1024."""
    s = lambda v: v * escala * SUPER
    top = cy - s(318)
    # Ruedas (asoman bajo la carrocería)
    for x0 in (-170, 100):
        d.rounded_rectangle([cx + s(x0), top + s(300), cx + s(x0 + 70), top + s(372)], s(18), fill=BLANCO)
    # Carrocería
    d.rounded_rectangle([cx - s(215), top, cx + s(215), top + s(340)], s(64), fill=BLANCO)
    # Parabrisas
    d.rounded_rectangle([cx - s(170), top + s(48), cx + s(170), top + s(196)], s(26), fill=color_detalle)
    # Faros
    for x in (-130, 130):
        d.ellipse([cx + s(x) - s(26), top + s(240) - s(26), cx + s(x) + s(26), top + s(240) + s(26)], fill=color_detalle)
    # Rejilla
    d.rounded_rectangle([cx - s(60), top + s(228), cx + s(60), top + s(252)], s(12), fill=color_detalle)
    # «67»
    f = fuente(int(s(250)))
    d.text((cx, top + s(405)), "67", font=f, fill=BLANCO, anchor="mt")


def lienzo(fondo):
    img = Image.new("RGBA", (LADO * SUPER, LADO * SUPER), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if fondo:
        n = LADO * SUPER
        mascara = Image.new("L", (n, n), 0)
        ImageDraw.Draw(mascara).rounded_rectangle([0, 0, n - 1, n - 1], 224 * SUPER, fill=255)
        capa = Image.new("RGBA", (n, n), MORADO)
        # Círculo decorativo, como en la tarjeta de saldo; la máscara lo recorta al cuadro redondeado
        ImageDraw.Draw(capa).ellipse([n * 0.55, -n * 0.25, n * 1.25, n * 0.45], fill=MORADO_CLARO)
        img.paste(capa, (0, 0), mascara)
    return img, d


def guardar(img, ruta, lado=LADO):
    ruta.parent.mkdir(parents=True, exist_ok=True)
    img.resize((lado, lado), Image.LANCZOS).save(ruta)
    print(ruta.relative_to(RAIZ.parent.parent) if RAIZ.parent.parent in ruta.parents else ruta)


def main():
    c = LADO * SUPER / 2
    # Ícono completo (Android antiguo, panel, logo dentro de la app)
    img, d = lienzo(fondo=True)
    dibujar_marca(d, c, c, 1.0, MORADO)
    guardar(img, RAIZ / "assets/icono.png")
    guardar(img, RAIZ / "assets/logo.png", 256)
    # Ícono adaptable: solo el dibujo, dentro de la zona segura (círculo de 66 %); el fondo morado lo pone Android
    img, d = lienzo(fondo=False)
    dibujar_marca(d, c, c, 0.72, MORADO)
    guardar(img, RAIZ / "assets/icono-adaptable.png")
    # Pantalla de inicio: dibujo blanco sobre fondo morado (lo pone el plugin)
    img, d = lienzo(fondo=False)
    dibujar_marca(d, c, c, 0.9, MORADO)
    guardar(img, RAIZ / "assets/splash.png")
    # Panel web
    panel = RAIZ.parent.parent / "panel-ruta67"
    if panel.exists():
        img, d = lienzo(fondo=True)
        dibujar_marca(d, c, c, 1.0, MORADO)
        guardar(img, panel / "public/logo.png", 256)
        guardar(img, panel / "public/favicon.png", 64)


main()
