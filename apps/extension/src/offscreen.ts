import { ImageEngine } from '@mediaforge/image-engine';
import { sanitizeFilename } from '@mediaforge/validators';

chrome.runtime.onMessage.addListener(async (message) => {
  if (message.action === 'PROCESS_IMAGE_URL' && message.url) {
    try {
      const response = await fetch(message.url);
      const blob = await response.blob();

      const result = await ImageEngine.processImage(blob, message.options);
      const base64Url = await ImageEngine.blobToBase64(result.blob);

      const cleanFilename = sanitizeFilename(`mediaforge_${Date.now()}.${result.format}`);

      chrome.runtime.sendMessage({
        action: 'TRIGGER_DOWNLOAD',
        url: base64Url,
        filename: cleanFilename,
      });
    } catch (err: any) {
      console.error('Offscreen conversion error:', err);
    }
  } else if (message.action === 'COPY_BASE64' && message.url) {
    try {
      const response = await fetch(message.url);
      const blob = await response.blob();
      const base64 = await ImageEngine.blobToBase64(blob);

      await navigator.clipboard.writeText(base64);
    } catch (err) {
      console.error('Copy base64 error:', err);
    }
  }
});
