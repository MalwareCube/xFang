(() => {
  'use strict';

  if (globalThis.xFangApply) return;

  function deepActiveElement() {
    let el = document.activeElement;
    while (el && el.shadowRoot && el.shadowRoot.activeElement) el = el.shadowRoot.activeElement;
    return el;
  }

  function isTextField(el) {
    if (!el || !(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) return false;
    if (el.readOnly || el.disabled) return false;
    try {
      return typeof el.selectionStart === 'number';
    } catch {
      return false;
    }
  }

  function getEditableSelection() {
    const el = deepActiveElement();
    if (isTextField(el)) {
      const { selectionStart: start, selectionEnd: end } = el;
      if (start === end) return null;
      return { kind: 'field', el, start, end, text: el.value.slice(start, end) };
    }

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return null;
    const range = sel.getRangeAt(0);
    const node = range.commonAncestorContainer;
    const host = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    if (!host || !host.isContentEditable) return null;
    return { kind: 'rich', sel, range, host, text: sel.toString() };
  }

  function chooseMode(text) {
    if (Fang.hasFangable(text)) return 'defang';
    if (Fang.hasDefanged(text)) return 'refang';
    return null;
  }

  function fireInput(el) {
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function replaceInField({ el, start, end }, newText) {
    el.focus();
    el.setSelectionRange(start, end);
    const ok = document.execCommand('insertText', false, newText);
    if (!ok || el.value.slice(start, start + newText.length) !== newText) {
      el.setRangeText(newText, start, end, 'end');
      fireInput(el);
    }
    el.setSelectionRange(start, start + newText.length);
  }

  function transformRichTextNodes({ sel, range, host }, transform) {
    const root = range.commonAncestorContainer;
    const nodes = [];
    if (root.nodeType === Node.TEXT_NODE) {
      nodes.push(root);
    } else {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        if (range.intersectsNode(n)) nodes.push(n);
      }
    }
    if (!nodes.length) return;

    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    const firstStart = range.startContainer === first ? range.startOffset : 0;
    let lastEnd = 0;

    for (const node of nodes) {
      const s = node === range.startContainer ? range.startOffset : 0;
      const e = node === range.endContainer ? range.endOffset : node.data.length;
      const replaced = transform(node.data.slice(s, e));
      node.data = node.data.slice(0, s) + replaced + node.data.slice(e);
      if (node === last) lastEnd = s + replaced.length;
    }

    const newRange = document.createRange();
    newRange.setStart(first, firstStart);
    newRange.setEnd(last, lastEnd);
    sel.removeAllRanges();
    sel.addRange(newRange);
    fireInput(host);
  }

  function replaceInRich(info, newText, transform) {
    if (info.text.includes('\n')) {
      transformRichTextNodes(info, transform);
      return;
    }
    const { sel } = info;
    if (!document.execCommand('insertText', false, newText)) {
      transformRichTextNodes(info, transform);
      return;
    }
    const node = sel.focusNode;
    const end = sel.focusOffset;
    if (node && node.nodeType === Node.TEXT_NODE && end >= newText.length &&
        node.data.slice(end - newText.length, end) === newText) {
      sel.setBaseAndExtent(node, end - newText.length, node, end);
    }
  }

  globalThis.xFangApply = (requireFocus) => {
    if (requireFocus && !document.hasFocus()) return;
    const info = getEditableSelection();
    if (!info) return;
    const mode = chooseMode(info.text);
    if (!mode) return;
    const transform = mode === 'refang' ? Fang.refang : Fang.defang;
    const newText = transform(info.text);
    if (newText === info.text) return;

    if (info.kind === 'field') replaceInField(info, newText);
    else replaceInRich(info, newText, transform);
  };
})();
