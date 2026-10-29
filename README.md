# QR Code generator

QR Code generator in pure JavaScript with compact SVG output. No dependencies.

The generator analyzes your text and combines Numeric, Alphanumeric, Byte, and Kanji segments to reduce the space needed for encoding. By default, it selects the smallest QR Code version that fits the message, evaluates all eight mask patterns, and boosts error correction without increasing the QR Code size. Pass a string to get an SVG element with the default settings, or use an options object to adjust the appearance and encoding.

Explore the [live demo](https://datalog.github.io/demo/qrcode-generator/): enter your own text, adjust the colors and encoding options, and see the generated SVG.

---

_If you do not need Kanji mode, use [qrcode.light.min.js](qrcode.light.min.js), which retains optimal segmentation. For an even lighter alternative with the same API, [qrcode-svg](https://github.com/datalog/qrcode-svg) uses a single encoding mode for the entire message and omits Kanji support._

<br>

## Lightweight Alternatives

If you don't need Kanji support, these alternatives offer smaller bundles with the same API:

| File / Repository | Optimal Segmentation | Bundle Size Reduction |
| :--- | :---: | :--- |
| [qrcode.light.min.js](qrcode.light.min.js) | Yes | Omits the 14 KB Kanji lookup table |
| [qrcode-svg](https://github.com/datalog/qrcode-svg) | No | Omits Kanji support and segmentation logic |

## Quick start

Download [qrcode.js](qrcode.js), include it in your HTML page, and append the returned SVG element:

```html
<div id="qrcode"></div>
<script src="qrcode.js"></script>
<script>

    document.getElementById('qrcode')
        .appendChild( QRCode('Hello World!') );

</script>
```

`QRCode(text)` is shorthand for `QRCode({ msg: text })`. Both return a new SVG DOM element.

## Options

Pass an options object to control the appearance and encoding:

```javascript
var svgNode = QRCode({

     msg :  "Your message here"
    ,dim :   300
    ,pad :   6
    ,mtx :   7
    ,ecl :  "H"
    ,ecb :   0
    ,pal : ["#000", "#f2f4f8"]
    ,vrb :   1

});

document.getElementById('qrcode')
    .appendChild( svgNode );
```

| Option | Default | Description |
| :--- | :--- | :--- |
| `msg` | `''` | Text to encode. Byte segments use UTF-8. |
| `dim` | `256` | SVG width and height in pixels, including padding. |
| `pad` | `4` | Padding on each side, measured in QR modules. Set to `0` to remove it. |
| `mtx` | `-1` | Mask pattern: `0`–`7`, or `-1` for automatic selection. |
| `ecl` | `'M'` | Error correction level: `'L'`, `'M'`, `'Q'`, or `'H'`, from lowest to highest. |
| `ecb` | `1` | Increase error correction when the data still fits the selected QR version. Set to `0` to keep the requested level. |
| `pal` | `['#000']` | Foreground and optional background colors as `#RGB` or `#RRGGBB`. The background is transparent when omitted. |
| `vrb` | `0` | Set to `1` to generate a more verbose SVG path, describing each dark module separately. The appearance is unchanged. |

## Kanji support

Kanji mode represents each supported character with 13 bits of data, compared with 24 bits in UTF-8 for many Japanese characters. It covers kanji, hiragana, katakana, and a selection of punctuation, symbols, and other characters. Characters outside this set are handled by the other modes, with Byte mode providing UTF-8 encoding.

The Unicode-to-Kanji lookup table is embedded as a compressed Base64 string using [kanji-base64](https://github.com/datalog/kanji-base64). It is decoded on first use and cached for subsequent QR Codes.

<details>
<summary>Why include a 14 KB lookup table?</summary><br/>


The table accounts for a substantial part of this small library. It supplies the character mapping needed for Kanji mode, keeping the conversion self-contained across JavaScript environments.

### Unicode and Shift JIS

JavaScript strings use Unicode, while QR Kanji mode, defined by [ISO/IEC 18004](https://www.iso.org/standard/83389.html), represents characters using 13-bit values derived from Shift JIS. Converting a valid Shift JIS code to a QR Kanji value takes simple arithmetic, but finding that Shift JIS code from Unicode requires a character mapping. The two character sets do not follow the same numerical order.

The table covers 8192 possible QR Kanji values, including 6879 occupied positions and the unused gaps.

### Browser encoding APIs

Using the browser's encoding API might seem to remove the need for a table:

```javascript
// Looks like Shift JIS encoding, but produces UTF-8 bytes.
new TextEncoder('shift-jis').encode('日本');
```

This call still produces UTF-8 bytes: browser-native `TextEncoder` ignores the encoding argument. Treating those bytes as Shift JIS would produce incorrect QR Kanji values.

`TextDecoder` can decode Shift JIS in supporting environments, but does not provide a Unicode-to-Shift-JIS encoder. The embedded table supplies the actual character mapping, so Kanji support does not depend on an external encoding library or a runtime-provided Shift JIS codec.

### Reducing the table size

With two bytes per position, the original table takes **21,848 bytes in UTF-8** when encoded directly as Base64. The format used here describes the same table with full values, differences between values, arithmetic series, and runs of empty positions.

The resulting Base64 string takes **13,984 bytes in UTF-8**, about **36% less** than Base64 of the original table. Each Base64 character occupies one UTF-8 byte; these sizes exclude the decoder and surrounding JavaScript syntax.

The table is compressed ahead of time, then decoded into a lookup array on first use and reused for all subsequent QR Codes.

For a walkthrough of the compression format, worked examples, and size comparisons, see [kanji-base64](https://github.com/datalog/kanji-base64).

</details>


<br><br><br>

## Credits and license

- QR Code calculations are based on Project Nayuki's [QR Code generator library](https://github.com/nayuki/QR-Code-generator/).
- The Kanji lookup table is compressed using [kanji-base64](https://github.com/datalog/kanji-base64).
- Copyright © 2020–2026 Constantine. Licensed under the [MIT License](LICENSE).
