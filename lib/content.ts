import { formatHotkey } from '@/lib/hotkey';
import { HotkeyConfig } from '@/lib/types';

export function isTextField(element: HTMLElement): boolean {
  return (
    element.tagName === 'INPUT' ||
    element.tagName === 'TEXTAREA' ||
    element.contentEditable === 'true' ||
    element.hasAttribute('contenteditable')
  );
}

export function insertTextIntoElement(
  element: HTMLElement,
  text: string
): void {
  if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
    const input = element as HTMLInputElement | HTMLTextAreaElement;

    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;

    const currentValue = input.value;

    input.value = currentValue.slice(0, start) + text + currentValue.slice(end);
    input.selectionStart = input.selectionEnd = start + text.length;

    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  } else if (element.contentEditable === 'true') {
    const selection = window.getSelection();

    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(text));
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      element.textContent += text;
    }

    element.dispatchEvent(new Event('input', { bubbles: true }));
  }

  element.focus();
}

export class OverlayManager {
  private overlay: HTMLElement | null = null;

  constructor() {
    this.injectStyles();
  }

  private injectStyles(): void {
    if (document.querySelector('#hush-styles')) return;

    const style = document.createElement('style');

    style.id = 'hush-styles';

    style.textContent = `
      @keyframes hush-pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }

      @keyframes hush-blink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.3; }
      }

      @keyframes hush-fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .hush-overlay-base {
        position: fixed;
        top: 20px;
        right: 20px;
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        font-family: system-ui, sans-serif;
        font-size: 14px;
        font-weight: 500;
        z-index: 10001;
        display: flex;
        align-items: center;
        gap: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      }

      .hush-overlay-recording {
        background: #ef4444;
        animation: hush-pulse 2s infinite;
      }

      .hush-overlay-transcribing {
        background: #1f2937;
        animation: hush-fadeIn 0.3s ease-out;
      }

      .hush-overlay-success {
        background: #10b981;
        animation: hush-fadeIn 0.3s ease-out;
      }

      .hush-overlay-error {
        background: #ef4444;
        animation: hush-fadeIn 0.3s ease-out;
      }

      .hush-indicator-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        animation: hush-blink 1s infinite;
      }

      .hush-indicator-white {
        background: white;
      }

      .hush-indicator-gray {
        background: #6b7280;
      }
    `;

    document.head.appendChild(style);
  }

  private createOverlay(className: string, content: string): void {
    this.remove();

    const overlay = document.createElement('div');
    overlay.className = `hush-overlay-base ${className}`;
    overlay.innerHTML = content;

    document.body.appendChild(overlay);
    this.overlay = overlay;
  }

  private createIcon(type: 'check' | 'close'): string {
    const icons = {
      check: '<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>',
      close:
        '<path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>',
    };

    return `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        ${icons[type]}
      </svg>
    `;
  }

  showRecording(hotkey: HotkeyConfig): void {
    this.createOverlay(
      'hush-overlay-recording',
      `
        <div class="hush-indicator-dot hush-indicator-white"></div>
        Recording... Press ${formatHotkey(hotkey)} to stop
      `
    );
  }

  showTranscribing(): void {
    this.createOverlay(
      'hush-overlay-transcribing',
      `
        <div class="hush-indicator-dot hush-indicator-gray"></div>
        Transcribing...
      `
    );
  }

  showSuccess(message: string): void {
    this.createOverlay(
      'hush-overlay-success',
      `
        ${this.createIcon('check')}
        ${message}
      `
    );

    setTimeout(() => this.remove(), 2000);
  }

  showError(message: string): void {
    this.createOverlay(
      'hush-overlay-error',
      `
        ${this.createIcon('close')}
        ${message}
      `
    );

    setTimeout(() => this.remove(), 3000);
  }

  remove(): void {
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.remove();
      this.overlay = null;
    }
  }
}
