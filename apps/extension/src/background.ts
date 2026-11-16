/**
 * MediaForge Extension — Background Service Worker (Manifest V3)
 */

chrome.runtime.onInstalled.addListener(() => {
  // Setup Right-Click Context Menus for images
  chrome.contextMenus.create({
    id: 'mediaforge-root',
    title: 'MediaForge',
    contexts: ['image'],
  });

  chrome.contextMenus.create({
    parentId: 'mediaforge-root',
    id: 'convert-webp',
    title: 'Convert to WebP',
    contexts: ['image'],
  });

  chrome.contextMenus.create({
    parentId: 'mediaforge-root',
    id: 'convert-png',
    title: 'Convert to PNG',
    contexts: ['image'],
  });

  chrome.contextMenus.create({
    parentId: 'mediaforge-root',
    id: 'convert-jpeg',
    title: 'Convert to JPEG',
    contexts: ['image'],
  });

  chrome.contextMenus.create({
    parentId: 'mediaforge-root',
    id: 'compress-image',
    title: 'Compress (Balanced)',
    contexts: ['image'],
  });

  chrome.contextMenus.create({
    parentId: 'mediaforge-root',
    id: 'copy-base64',
    title: 'Copy as Base64 Data URL',
    contexts: ['image'],
  });
});

async function ensureOffscreenDocument() {
  const existing = await chrome.runtime.getContexts({
    contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
  });

  if (existing.length === 0) {
    await chrome.offscreen.createDocument({
      url: 'offscreen.html',
      reasons: [chrome.offscreen.Reason.BLOBS, chrome.offscreen.Reason.DOM_PARSER],
      justification: 'Media processing using Canvas 2D and WebAssembly outside service worker limits',
    });
  }
}

chrome.contextMenus.onClicked.addListener(async (info, _tab) => {
  if (!info.srcUrl) return;

  await ensureOffscreenDocument();

  if (info.menuItemId === 'convert-webp') {
    chrome.runtime.sendMessage({
      action: 'PROCESS_IMAGE_URL',
      url: info.srcUrl,
      options: { outputFormat: 'webp', quality: 80 },
    });
  } else if (info.menuItemId === 'convert-png') {
    chrome.runtime.sendMessage({
      action: 'PROCESS_IMAGE_URL',
      url: info.srcUrl,
      options: { outputFormat: 'png', lossless: true },
    });
  } else if (info.menuItemId === 'convert-jpeg') {
    chrome.runtime.sendMessage({
      action: 'PROCESS_IMAGE_URL',
      url: info.srcUrl,
      options: { outputFormat: 'jpeg', quality: 85 },
    });
  } else if (info.menuItemId === 'compress-image') {
    chrome.runtime.sendMessage({
      action: 'PROCESS_IMAGE_URL',
      url: info.srcUrl,
      options: { outputFormat: 'webp', quality: 65, stripMetadata: true },
    });
  } else if (info.menuItemId === 'copy-base64') {
    chrome.runtime.sendMessage({
      action: 'COPY_BASE64',
      url: info.srcUrl,
    });
  }
});

// Listen for download requests from offscreen document
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'TRIGGER_DOWNLOAD' && message.url) {
    chrome.downloads.download({
      url: message.url,
      filename: message.filename || 'mediaforge_output.webp',
      saveAs: false,
    });
    sendResponse({ success: true });
  }
});
