importScripts('fang.js');

const MENU_ID = 'fang';
const TITLES = { defang: 'Defang', refang: 'Refang' };

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: MENU_ID, title: TITLES.defang, contexts: ['editable'], visible: false });
  });
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type !== 'selection') return;
  const update = msg.mode ? { visible: true, title: TITLES[msg.mode] } : { visible: false };
  chrome.contextMenus.update(MENU_ID, update, () => void chrome.runtime.lastError);
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab?.id || info.menuItemId !== MENU_ID) return;
  chrome.tabs
    .sendMessage(tab.id, { type: 'apply' }, { frameId: info.frameId ?? 0 })
    .catch(() => {});
});

chrome.commands.onCommand.addListener(async (command, tab) => {
  if (command !== 'toggle-fang') return;
  const target = tab?.id ? tab : (await chrome.tabs.query({ active: true, currentWindow: true }))[0];
  if (!target?.id) return;
  chrome.tabs.sendMessage(target.id, { type: 'apply', requireFocus: true }).catch(() => {});
});
