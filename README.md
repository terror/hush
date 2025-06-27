## ![icon](https://github.com/user-attachments/assets/47c39cd7-ced8-4c56-9df2-cfdd751ec2dd) hush

**hush** is a browser extension that lets you easily convert speech to text,
powered by [Whisper](https://github.com/openai/whisper) and
[WebGPU](https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API).

<div align="center">
  <img width="800" alt="demo" src="https://github.com/user-attachments/assets/2d4133f7-3e94-448d-9fb2-4a86a44a7ab8" />
</div>

Couldn't find a simple, easy to use speech to text extension for the browser that leverages WebGPU instead of querying some cloud based model, so I built one in an hour or so.

The main features are recording speech into text from the popup view, and spinning up a recording session from any text field on the page via a hotkey.

## Installation

```
git clone https://github.com/terror/hush
bun install
bun run build
```

The development build should be present in `.output` relative to the project
root.

**n.b.** You'll need to allow audio recording permissions to the extension before use.

## Prior Art

[**whisper-web**](https://github.com/xenova/whisper-web) - ML-powered speech
recognition directly in your browser.
