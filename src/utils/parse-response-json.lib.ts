export const parseResponseJson = <T>(json: string): T => {
  try {
    json = json.trim();
    json = json.replace(/^\u200B/, ""); // Remove zero-width space if present
    json = json.replace(/^\u00A0/, ""); // Remove non-breaking space if present
    // replace ``` and ```json
    json = json
      .replace(/```json/, "")
      .replace(/```/, "")
      .trim();
    return JSON.parse(json);
  } catch (error) {
    console.error("Failed to parse JSON response:", error);
    throw new Error("Invalid JSON format");
  }
};
