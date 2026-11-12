/**
 * Lee una imagen seleccionada por el usuario, la recorta en cuadrado (centro)
 * y la redimensiona para guardarla como Data URL ligera (JPEG) en SQLite.
 */
export function resizeImageFile(
  file: File,
  maxSize = 320,
  quality = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("El archivo seleccionado no es una imagen válida."));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("No se pudo leer la imagen."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Formato de imagen no soportado."));
      img.onload = () => {
        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2;
        const sy = (img.height - side) / 2;
        const output = Math.min(maxSize, side);

        const canvas = document.createElement("canvas");
        canvas.width = output;
        canvas.height = output;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(String(reader.result));
          return;
        }
        ctx.drawImage(img, sx, sy, side, side, 0, 0, output, output);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
