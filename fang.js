(function (root) {
  'use strict';

  const OCTET = '(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)';
  const IPV4 = `(?:${OCTET}\\.){3}${OCTET}`;
  const LABEL = '[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?';
  const DOMAIN = `(?:${LABEL}\\.)+[A-Za-z]{2,63}`;
  const PORT_PATH = '(?::\\d{1,5})?(?:[/?#][^\\s<>"\'`]*)?';

  const IOC_SOURCE = [
    '\\b(?:https?|ftp)://[^\\s<>"\'`]+',
    "\\b[A-Za-z0-9._%+-]+@" + DOMAIN + '\\b',
    `\\b${IPV4}\\b${PORT_PATH}`,
    `\\b${DOMAIN}\\b${PORT_PATH}`,
  ].join('|');

  const DEFANGED_MARKERS =
    /\[\.\]|\(\.\)|\{\.\}|[[({]\s?dot\s?[\])}]|\bh[x*]{2}ps?\b|\bfxp\b|\[:\/\/\]|\[:\]|\[@\]|[[(]at[\])]/i;

  const TRAILING_PUNCT = /[.,;:!?'")\]}>]+$/;

  function iocRegex(flags) {
    return new RegExp(IOC_SOURCE, flags + 'i');
  }

  function defangIndicator(s) {
    return s
      .replace(/^http/i, (m) => (m[0] === 'H' ? 'HXXP' : 'hxxp'))
      .replace(/^ftp(?=:\/\/)/i, 'fxp')
      .replace('://', '[://]')
      .replace(/\./g, '[.]')
      .replace(/@/g, '[@]');
  }

  function defang(text) {
    return text.replace(iocRegex('g'), (match) => {
      const trail = (match.match(TRAILING_PUNCT) || [''])[0];
      const core = match.slice(0, match.length - trail.length);
      return core ? defangIndicator(core) + trail : match;
    });
  }

  function refang(text) {
    return text
      .replace(/\bh[x*]{2}p(s?)\b/gi, (m, s) => (m[0] === 'H' ? 'HTTP' : 'http') + s)
      .replace(/\bfxp(?=\[:\/\/\]|\[:\]\/\/|:\/\/)/gi, 'ftp')
      .replace(/\[:\/\/\]/g, '://')
      .replace(/\[:\]/g, ':')
      .replace(/ ?[[({] ?(?:\.|dot) ?[\])}] ?/gi, '.')
      .replace(/ ?(?:\[@\]|[[(]at[\])]) ?/gi, '@');
  }

  function hasFangable(text) {
    return !!text && iocRegex('').test(text);
  }

  function hasDefanged(text) {
    return !!text && DEFANGED_MARKERS.test(text);
  }

  const Fang = { defang, refang, hasFangable, hasDefanged };
  root.Fang = Fang;
})(globalThis);
