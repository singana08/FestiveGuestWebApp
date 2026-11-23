/**
 * Resizes an image to fit maxSize and re-encodes it as JPEG.
 * Re-encoding through a canvas also drops all EXIF data — including the GPS location
 * phones add to photos, which for a host's home photos would be their address.
 */
export const toJpeg = (file, maxSize = 800, quality = 0.8) => new Promise((resolve, reject) => {
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Couldn’t read that image.'))), 'image/jpeg', quality);
  };
  img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('That file isn’t a photo we can use.')); };
  img.src = url;
});

/** Uploads a JPEG straight to storage with a one-file upload link from the API. */
export const putJpeg = async (uploadUrl, blob) => {
  const res = await fetch(uploadUrl, { method: 'PUT', headers: { 'x-ms-blob-type': 'BlockBlob', 'Content-Type': 'image/jpeg' }, body: blob });
  if (!res.ok) throw new Error(`Upload failed (${res.status})`);
};
