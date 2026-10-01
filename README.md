# xFang

A small Chrome extension. Select text you've typed into a text box, textarea or rich-text editor, then either:

- press **Alt+Shift+D**, or
- right-click and choose **Defang / Refang**.

Either way, xFang picks the action for you:

- **Defang** if the selection contains any live indicator: a URL, domain, IPv4 address or email address.
- **Refang** if everything in it is already defanged (`[.]`, `hxxp`, `[://]`, `[@]`, `[dot]`, `(.)`, etc.).

Doing it twice flips the text back. If the selection has nothing to convert, nothing happens.

| Original | Defanged |
|---|---|
| `https://evil.example.com/a.php` | `hxxps[://]evil[.]example[.]com/a[.]php` |
| `10.0.0.1` | `10[.]0[.]0[.]1` |
| `phish@bad.com` | `phish[@]bad[.]com` |

If you select a whole sentence, only the indicators in it are changed. The edit goes through the browser's normal text insertion, so **Ctrl+Z** undoes it and form frameworks register the change.

## Install

1. Open `chrome://extensions` and turn on **Developer mode**.
2. Click **Load unpacked** and choose this folder.

To change the shortcut, go to `chrome://extensions/shortcuts`. If another extension already uses Alt+Shift+D, Chrome leaves the shortcut unset and you'll need to pick one there.

## Permissions

xFang has no access to any page until you click the menu item or press the shortcut. At that moment Chrome grants it access to the current tab only (`activeTab`), and it runs its code there (`scripting`) to rewrite the selection. It doesn't store anything or send any data anywhere.
