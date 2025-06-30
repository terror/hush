import { beforeEach, describe, expect, it, jest } from 'bun:test';

import { insertTextIntoElement, isTextField } from '../lib/content';

const mockDocument = {
  createElement: jest.fn(),
  createTextNode: jest.fn(),
  querySelector: jest.fn(),
  head: {
    appendChild: jest.fn(),
  },
  body: {
    appendChild: jest.fn(),
  },
};

const mockWindow = {
  getSelection: jest.fn(),
};

global.document = mockDocument as any;
global.window = mockWindow as any;

describe('isTextField', () => {
  it('should return true for INPUT elements', () => {
    const input = { tagName: 'INPUT' } as HTMLElement;
    expect(isTextField(input)).toBe(true);
  });

  it('should return true for TEXTAREA elements', () => {
    const textarea = { tagName: 'TEXTAREA' } as HTMLElement;
    expect(isTextField(textarea)).toBe(true);
  });

  it('should return true for contentEditable elements', () => {
    const div = {
      tagName: 'DIV',
      contentEditable: 'true',
      hasAttribute: jest.fn().mockReturnValue(false),
    } as any;

    expect(isTextField(div)).toBe(true);
  });

  it('should return true for elements with contenteditable attribute', () => {
    const div = {
      tagName: 'DIV',
      contentEditable: 'false',
      hasAttribute: jest.fn().mockReturnValue(true),
    } as any;

    expect(isTextField(div)).toBe(true);
  });

  it('should return false for regular elements', () => {
    const div = {
      tagName: 'DIV',
      contentEditable: 'false',
      hasAttribute: jest.fn().mockReturnValue(false),
    } as any;

    expect(isTextField(div)).toBe(false);
  });

  it('should return false for button elements', () => {
    const button = {
      tagName: 'BUTTON',
      contentEditable: 'false',
      hasAttribute: jest.fn().mockReturnValue(false),
    } as any;

    expect(isTextField(button)).toBe(false);
  });
});

describe('insertTextIntoElement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should insert text into INPUT element at cursor position', () => {
    const input = {
      tagName: 'INPUT',
      value: 'Hello world',
      selectionStart: 5,
      selectionEnd: 5,
      dispatchEvent: jest.fn(),
      focus: jest.fn(),
    } as any;

    insertTextIntoElement(input, ' beautiful');

    expect(input.value).toBe('Hello beautiful world');
    expect(input.selectionStart).toBe(15);
    expect(input.selectionEnd).toBe(15);
    expect(input.dispatchEvent).toHaveBeenCalledTimes(2);
    expect(input.focus).toHaveBeenCalled();
  });

  it('should replace selected text in INPUT element', () => {
    const input = {
      tagName: 'INPUT',
      value: 'Hello world',
      selectionStart: 6,
      selectionEnd: 11,
      dispatchEvent: jest.fn(),
      focus: jest.fn(),
    } as any;

    insertTextIntoElement(input, 'universe');

    expect(input.value).toBe('Hello universe');
    expect(input.selectionStart).toBe(14);
    expect(input.selectionEnd).toBe(14);
  });

  it('should insert text into TEXTAREA element', () => {
    const textarea = {
      tagName: 'TEXTAREA',
      value: 'Line 1\nLine 2',
      selectionStart: 7,
      selectionEnd: 7,
      dispatchEvent: jest.fn(),
      focus: jest.fn(),
    } as any;

    insertTextIntoElement(textarea, 'New ');

    expect(textarea.value).toBe('Line 1\nNew Line 2');
    expect(textarea.selectionStart).toBe(11);
    expect(textarea.selectionEnd).toBe(11);
  });

  it('should handle null selection positions in input elements', () => {
    const input = {
      tagName: 'INPUT',
      value: 'Hello',
      selectionStart: null,
      selectionEnd: null,
      dispatchEvent: jest.fn(),
      focus: jest.fn(),
    } as any;

    insertTextIntoElement(input, ' world');

    expect(input.value).toBe(' worldHello');
    expect(input.selectionStart).toBe(6);
    expect(input.selectionEnd).toBe(6);
  });

  it('should insert text into contentEditable element with selection', () => {
    const mockRange = {
      deleteContents: jest.fn(),
      insertNode: jest.fn(),
      collapse: jest.fn(),
    };

    const mockSelection = {
      rangeCount: 1,
      getRangeAt: jest.fn().mockReturnValue(mockRange),
      removeAllRanges: jest.fn(),
      addRange: jest.fn(),
    };

    const mockTextNode = {};
    mockDocument.createTextNode.mockReturnValue(mockTextNode);
    mockWindow.getSelection.mockReturnValue(mockSelection);

    const div = {
      contentEditable: 'true',
      dispatchEvent: jest.fn(),
      focus: jest.fn(),
    } as any;

    insertTextIntoElement(div, 'inserted text');

    expect(mockDocument.createTextNode).toHaveBeenCalledWith('inserted text');
    expect(mockRange.deleteContents).toHaveBeenCalled();
    expect(mockRange.insertNode).toHaveBeenCalledWith(mockTextNode);
    expect(mockRange.collapse).toHaveBeenCalledWith(false);
    expect(mockSelection.removeAllRanges).toHaveBeenCalled();
    expect(mockSelection.addRange).toHaveBeenCalledWith(mockRange);
    expect(div.dispatchEvent).toHaveBeenCalled();
    expect(div.focus).toHaveBeenCalled();
  });

  it('should append text to contentEditable element without selection', () => {
    mockWindow.getSelection.mockReturnValue(null);

    const div = {
      contentEditable: 'true',
      textContent: 'existing text',
      dispatchEvent: jest.fn(),
      focus: jest.fn(),
    } as any;

    insertTextIntoElement(div, ' appended');

    expect(div.textContent).toBe('existing text appended');
    expect(div.dispatchEvent).toHaveBeenCalled();
    expect(div.focus).toHaveBeenCalled();
  });

  it('should handle contentEditable element with selection but no ranges', () => {
    const mockSelection = {
      rangeCount: 0,
    };
    mockWindow.getSelection.mockReturnValue(mockSelection);

    const div = {
      contentEditable: 'true',
      textContent: 'existing text',
      dispatchEvent: jest.fn(),
      focus: jest.fn(),
    } as any;

    insertTextIntoElement(div, ' appended');

    expect(div.textContent).toBe('existing text appended');
  });
});
