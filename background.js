const MENU_ID = 'fang';

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: MENU_ID, title: 'Defang / Refang', contexts: ['selection'] });
  });
});

async function run(target, requireFocus) {
  try {
    await chrome.scripting.executeScript({ target, files: ['fang.js', 'content.js'] });
    await chrome.scripting.executeScript({
      target,
      func: (focusOnly) => globalThis.xFangApply?.(focusOnly),
      args: [requireFocus],
    });
  } catch {}
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab?.id || info.menuItemId !== MENU_ID) return;
  run({ tabId: tab.id, frameIds: [info.frameId ?? 0] }, false);
});

chrome.commands.onCommand.addListener((command, tab) => {
  if (command !== 'toggle-fang' || !tab?.id) return;
  run({ tabId: tab.id, allFrames: true }, true);
});
