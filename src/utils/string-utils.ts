export const stringUtils = {
  tokenize: (text: string): string[] => {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 0);
  },

  normalize: (text: string): string => {
    return text
      .trim()
      .replace(/\s+/g, " ")
      .replace(/[^\w\s]/g, "");
  },

  truncate: (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + "...";
  },

  wordCount: (text: string): number => {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  },

  readingTime: (text: string): number => {
    const words = stringUtils.wordCount(text);
    const wpm = 200; // Average reading speed
    return Math.ceil(words / wpm);
  },
};
