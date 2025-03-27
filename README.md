# AI Prompt Splitter

A simple web tool designed to split long pieces of text into smaller, manageable chunks, making them suitable for processing by AI models with context window limitations.

## Features

*   **Text Chunking:** Splits large text inputs into smaller segments based on a user-defined character count.
*   **Chunk Size Presets:** Quick buttons for common chunk sizes (15k, 20k, 25k, 35k, 50k characters).
*   **Prompt Wrapping:** Optionally wraps each text chunk with custom `<prompt>` tags.
*   **Prompt Management:**
    *   Save frequently used prompts with a name.
    *   Load, update, or delete saved prompts.
    *   Maximum of 10 prompts can be saved (stored in browser's local storage).
*   **Character & Token Count:** Displays character and estimated token counts for input and output. (Note: Token count is an approximation).
*   **Output Management:**
    *   View generated chunks individually.
    *   Expand/Collapse all chunks.
    *   Copy individual chunks or all chunks at once.
*   **Theme Switching:** Supports Light, Dark, and System preference themes.
*   **Responsive Design:** Built with Tailwind CSS for usability across different screen sizes.
*   **Client-Side Processing:** All processing happens directly in your browser using JavaScript. No data is sent to a server.

## How It Works

1.  **Input Text:** Paste or type the long text you want to split into the "Input Text" area.
2.  **(Optional) Manage Prompts:** Use the "Prompt Management" section to save or select a prompt if you want to wrap the chunks.
3.  **Set Chunk Size:** Enter the desired maximum character count for each chunk in the "Chunk Size" field or use one of the preset buttons.
4.  **Wrap Option:** Check/uncheck the "Wrap with prompt tags" box as needed.
5.  **Process:** Click the "Process Text" button.
6.  **Output:** The tool will display the generated chunks below, along with total counts. You can then copy the chunks for use with your AI tool.

For a more detailed explanation, see the [How This Works](how-it-works.html) page included with the tool.

## Getting Started

Simply open the `index.html` file in your web browser.

## Technologies Used

*   HTML
*   CSS (Tailwind CSS)
*   JavaScript (Vanilla)

---

© 2025 AI Prompt Splitter