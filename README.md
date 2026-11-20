# DD-500 Editor

> ⚠️ **Experimental.** This is an early, community-built project. It has not yet been verified on real hardware, and it sends data directly to your pedal. See [Disclaimer](#disclaimer) before using it.

An installable web app (PWA) for editing the Boss DD-500 delay pedal over USB using Web MIDI + SysEx. Built with Vite, React and TypeScript.

## Disclaimer

- **Unofficial.** This project is not affiliated with, endorsed by, or supported by Roland Corporation or BOSS. "BOSS", "Roland" and "DD-500" are trademarks of their respective owners and are used here only to describe compatibility.
- **Use at your own risk.** The app reads and writes your pedal's settings. Bugs could change patch data in ways you don't expect. Back up anything you care about with BOSS's official tools before experimenting, and try "Write to bank slot" on a spare bank first.
- **Protocol source.** Parameter addresses come from Roland's published DD-500 MIDI Implementation document. Some behaviour (patch switching, slot writes) has not been confirmed against a real pedal, and the EQ curve is an approximation.
- **Provided as-is,** under the MIT license, with no warranty.

## For users

Open the hosted URL in **Chrome or Edge**, then click the install icon in the address bar (or the in-app "Install app" button). It opens in its own window, works offline, and keeps saved presets in the browser. Firefox and Safari do not support the Web MIDI SysEx features this needs.

1. Connect the DD-500 by USB and power it on.
2. Click **Connect pedal** and allow MIDI + SysEx access.
3. On the pedal, match its MIDI channel to the channel dropdown in the app and enable program change reception, so patch switching works.

## For developers

    npm install
    npm run dev        # http://localhost:5173 (localhost counts as secure for Web MIDI)
    npm test           # SysEx, parameter, EQ and state unit tests
    npm run build      # type-check + production build into dist/
    npm run preview    # serve dist/ to test the PWA / service worker

In VS Code: Run > Start Debugging launches the dev server and Chrome together.

### Deploy

`dist/` is static. Drop it on Netlify (build command `npm run build`, publish dir `dist`) or any HTTPS host. The service worker only registers in the production build.

### Layout

- `src/params.ts`: typed parameter table, value encode/decode (add parameters here)
- `src/midi/sysex.ts`: addresses, checksum, RQ1/DT1 builders and parser
- `src/pedal.ts`: patch buffers + MIDI connection (`usePedal()` hook)
- `src/eq.ts`: EQ response maths; `src/presets.ts`: starters, library, import/export
- `src/components/`: Control, EqGraph, panels

### Add a parameter

Find its offset in Roland's DD-500 MIDI Implementation, then add one line in `src/params.ts`:

    add('main', 'key', 'Label', o(hi, lo), maxValue, { opts: [...], d: v => `${v} ms` })

Groups: `'main'`, `'eq'`, `'oth'`, or a delay-mode number (`'4'` = Shimmer) for that mode's panel.

## Status

**Experimental, untested on hardware.** Known gaps:

- Pattern step editor, ASSIGN, system and control-pedal pages are not built yet.
- "Write to bank slot" is unverified.
- The EQ curve assumes shelf corner frequencies and filter slopes; it is not read from the pedal.
- Patch switching depends on the pedal's MIDI receive channel and program-change settings.

Bug reports are welcome, especially from anyone with a pedal: please include the browser, OS, and what the status line showed.

## License

[MIT](LICENSE)
