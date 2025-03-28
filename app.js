class PromptSplitter {
    constructor() {
        this.prompts = [];
        this.currentPrompt = null;
        this.editingIndex = null;
        this.chunks = [];
        this.copiedChunks = new Set();
        this.settings = {
            chunkSize: 15000,
            wrapPrompt: true
        };
        
        this.initElements();
        this.loadPrompts();
        this.setupTheme();
        this.setupEventListeners();
    }

    setupTheme() {
        // Check for saved theme preference
        let savedTheme = localStorage.getItem('theme');
        if (!savedTheme || !['light', 'dark', 'system'].includes(savedTheme)) {
            savedTheme = 'system';
            localStorage.setItem('theme', savedTheme);
        }
        
        console.log('Initial theme:', savedTheme);
        this.applyTheme(savedTheme);
        
        // Watch for system theme changes
        const systemThemeMedia = window.matchMedia('(prefers-color-scheme: dark)');
        const handleSystemThemeChange = (e) => {
            if (localStorage.getItem('theme') === 'system') {
                console.log('System theme changed to:', e.matches ? 'dark' : 'light');
                this.applyTheme('system');
            }
        };
        
        systemThemeMedia.addEventListener('change', handleSystemThemeChange);
        
        // Force initial theme application
        document.documentElement.style.setProperty('color-scheme', '');
        this.applyTheme(savedTheme);
    }

    applyTheme(theme) {
        console.log('Applying theme:', theme);
        
        // Set theme on document and save preference
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        // Update active button state
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.remove('ring-2', 'ring-blue-500');
        });
        const activeBtn = document.getElementById(`theme-${theme}`);
        if (activeBtn) {
            activeBtn.classList.add('ring-2', 'ring-blue-500');
        }
        
        // For system theme, let CSS media queries handle it
        if (theme !== 'system') {
            document.documentElement.style.colorScheme = theme;
        }
        
        console.log('Current theme attributes:', {
            'data-theme': document.documentElement.getAttribute('data-theme'),
            'color-scheme': document.documentElement.style.colorScheme
        });
    }
    
    initElements() {
        this.elements = {
            promptNameInput: document.getElementById('prompt-name'),
            promptInput: document.getElementById('prompt-input'),
            promptSaveBtn: document.getElementById('save-prompt'),
            promptUpdateBtn: document.getElementById('update-prompt'),
            promptList: document.getElementById('prompt-list'),
            promptCounter: document.getElementById('prompt-counter'),
            textInput: document.getElementById('text-input'),
            chunkSizeInput: document.getElementById('chunk-size'),
            chunkBySelect: document.getElementById('chunk-by'),
            wrapPromptCheckbox: document.getElementById('wrap-prompt'),
            processBtn: document.getElementById('process-btn'),
            outputContainer: document.getElementById('output-container'),
            charCount: document.getElementById('char-count'),
            tokenCount: document.getElementById('token-count'),
            chunkCount: document.getElementById('chunk-count'),
            totalChars: document.getElementById('total-chars'),
            totalTokens: document.getElementById('total-tokens'),
            resetBtn: document.getElementById('reset-btn'), // Add reset button
            deleteAllPromptsBtn: document.getElementById('delete-all-prompts') // Add delete all prompts button
        };
        
        this.elements.chunkSizeInput.value = this.settings.chunkSize;
    }
    
    loadPrompts() {
        const defaultPrompts = [
            { name: "Summarize", content: "Summarize the key points of the following text:" },
            { name: "Explain ELI5", content: "Explain the following text like I'm 5 years old:" },
            { name: "Extract Key Points", content: "Extract the main key points or arguments from the following text:" }
        ];
        let loadedSuccessfully = false;

        const savedPrompts = localStorage.getItem('aiPromptSplitter_prompts');
        if (savedPrompts) {
            try {
                const parsedPrompts = JSON.parse(savedPrompts);
                // Basic validation: check if it's an array
                if (Array.isArray(parsedPrompts)) {
                    this.prompts = parsedPrompts;
                    loadedSuccessfully = true;
                    console.log("Loaded prompts from localStorage:", this.prompts.length);
                } else {
                    console.error("Invalid data format in localStorage prompts. Expected an array.");
                    localStorage.removeItem('aiPromptSplitter_prompts');
                }
            } catch (e) {
                console.error("Error parsing prompts from localStorage:", e);
                localStorage.removeItem('aiPromptSplitter_prompts');
            }
        }

        // If loading failed or localStorage was empty, use defaults
        if (!loadedSuccessfully) {
            console.log("Initializing with default prompts.");
            this.prompts = defaultPrompts;
            this.savePrompts(); // Save defaults back to localStorage
            loadedSuccessfully = true; // Mark as loaded (with defaults)
        }

        // Always render the list after attempting to load or initialize
        this.renderPromptList();
    }
    
    savePrompts() {
        localStorage.setItem('aiPromptSplitter_prompts', JSON.stringify(this.prompts));
        this.updatePromptCounter();
    }
    
    updatePromptCounter() {
        this.elements.promptCounter.textContent = `${this.prompts.length}/10`;
    }
    
    renderPromptList() {
        const promptList = this.elements.promptList;
        promptList.innerHTML = '';
        
        if (this.prompts.length === 0) {
            const li = document.createElement('li');
            li.className = 'p-3 text-center text-gray-500 dark:text-gray-400';
            li.textContent = 'No saved prompts yet';
            promptList.appendChild(li);
            this.updatePromptCounter();
            return;
        }
        
        this.prompts.forEach((prompt, index) => {
            const li = document.createElement('li');
            // Add 'group' class back
            li.className = 'flex justify-between items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 group';

            // Text content div
            const textDiv = document.createElement('div');
            // Add min-w-0 to prevent text from pushing buttons out
            textDiv.className = 'flex-grow cursor-pointer min-w-0';
            // Use innerHTML here for simplicity with nested divs and dynamic content
            textDiv.innerHTML = `
                <div class="font-medium dark:text-white">${prompt.name}</div>
                <div class="text-sm text-gray-500 dark:text-gray-400 truncate">${prompt.content.substring(0, 60)}${prompt.content.length > 60 ? '...' : ''}</div>
            `;
            li.appendChild(textDiv);

            // Button container div
            const buttonDiv = document.createElement('div');
            // Restore original hover effect classes, remove border
            buttonDiv.className = 'flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity';

            // Edit button
            const editBtn = document.createElement('button');
            editBtn.className = 'edit-prompt text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 text-sm';
            editBtn.dataset.index = index;
            editBtn.textContent = 'Edit';
            buttonDiv.appendChild(editBtn);

            // Delete button
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-prompt text-red-500 hover:text-red-700 dark:hover:text-red-400 text-sm';
            deleteBtn.dataset.index = index;
            deleteBtn.textContent = 'Delete';
            buttonDiv.appendChild(deleteBtn);

            li.appendChild(buttonDiv); // Append button container to list item
            promptList.appendChild(li); // Append list item to the list
        });
        
        this.updatePromptCounter();
    }
    
    setupEventListeners() {
        // Theme switchers
        document.getElementById('theme-light').addEventListener('click', () => {
            this.applyTheme('light');
        });
        document.getElementById('theme-dark').addEventListener('click', () => {
            this.applyTheme('dark');
        });
        document.getElementById('theme-system').addEventListener('click', () => {
            this.applyTheme('system');
        });

        // Prompt management
        this.elements.promptSaveBtn.addEventListener('click', () => {
            this.saveCurrentPrompt();
        });
        
        this.elements.promptUpdateBtn.addEventListener('click', () => {
            this.updatePrompt();
        });

        this.elements.deleteAllPromptsBtn.addEventListener('click', () => { // Add listener for delete all
            this.deleteAllPrompts();
        });
        
        this.elements.promptList.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-prompt')) {
                this.deletePrompt(parseInt(e.target.dataset.index));
            } else if (e.target.classList.contains('edit-prompt')) {
                this.editPrompt(parseInt(e.target.dataset.index));
            } else if (e.target.closest('.flex-grow')) {
                const li = e.target.closest('li');
                const index = Array.from(li.parentNode.children).indexOf(li);
                this.selectPrompt(index);
            }
        });
        
        // Chunk size preset buttons
        document.querySelectorAll('.chunk-preset-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const size = parseInt(e.target.dataset.size);
                if (!isNaN(size)) {
                    this.elements.chunkSizeInput.value = size;
                    this.settings.chunkSize = size;
                    console.log(`Chunk size set to ${size} by preset button.`);
                    // Optional: Trigger input change event if needed by other listeners
                    // this.elements.chunkSizeInput.dispatchEvent(new Event('change'));
                }
            });
        });

        // Text processing
        this.elements.resetBtn.addEventListener('click', () => { // Add listener for reset button
            this.resetProcessing();
        });

        this.elements.processBtn.addEventListener('click', () => {
            this.processText();
        });
        
        this.elements.textInput.addEventListener('input', () => {
            this.updateCounters();
        });
        
        // Update chunk size when changed
        this.elements.chunkSizeInput.addEventListener('change', (e) => {
            this.settings.chunkSize = parseInt(e.target.value) || 15000;
        });

        this.elements.chunkSizeInput.addEventListener('change', (e) => {
            this.settings.chunkSize = parseInt(e.target.value) || 15000;
        });
    }
    
    saveCurrentPrompt() {
        const promptName = this.elements.promptNameInput.value.trim();
        const promptContent = this.elements.promptInput.value.trim();
        
        if (!promptName) {
            alert('Please enter a prompt name');
            return;
        }
        
        if (!promptContent) {
            alert('Please enter prompt content');
            return;
        }
        
        // Check if we're editing an existing prompt
        if (this.editingIndex !== null) {
            this.prompts[this.editingIndex] = { name: promptName, content: promptContent };
        } else {
            // Check for duplicate names
            if (this.prompts.some(p => p.name === promptName)) {
                alert('A prompt with this name already exists');
                return;
            }
            
            if (this.prompts.length >= 10) {
                this.prompts.shift();
            }
            
            this.prompts.push({ name: promptName, content: promptContent });
        }
        
        this.savePrompts();
        this.renderPromptList();
        this.resetPromptForm();
    }
    
    editPrompt(index) {
        this.editingIndex = index;
        this.currentPrompt = this.prompts[index];
        this.elements.promptNameInput.value = this.currentPrompt.name;
        this.elements.promptInput.value = this.currentPrompt.content;
        
        this.elements.promptSaveBtn.classList.add('hidden');
        this.elements.promptUpdateBtn.classList.remove('hidden');
    }
    
    updatePrompt() {
        this.saveCurrentPrompt();
    }
    
    deletePrompt(index) {
        if (confirm('Are you sure you want to delete this prompt?')) {
            this.prompts.splice(index, 1);
            this.savePrompts();
            this.renderPromptList();
            
            if (this.currentPrompt && !this.prompts.includes(this.currentPrompt)) {
                this.currentPrompt = null;
            }
            if (this.editingIndex === index) {
                this.resetPromptForm();
            }
        }
    }

    deleteAllPrompts() {
        if (this.prompts.length === 0) {
            alert("There are no prompts to delete.");
            return;
        }
        if (confirm('Are you sure you want to delete ALL saved prompts? This cannot be undone.')) {
            this.prompts = [];
            this.savePrompts();
            this.renderPromptList();
            this.resetPromptForm(); // Also reset the form if a prompt was being edited
            console.log("All prompts deleted.");
        }
    }
    
    selectPrompt(index) {
        this.currentPrompt = this.prompts[index];
        this.elements.promptInput.value = this.currentPrompt.content;
    }
    
    resetPromptForm() {
        this.elements.promptNameInput.value = '';
        this.elements.promptInput.value = '';
        this.elements.promptSaveBtn.classList.remove('hidden');
        this.elements.promptUpdateBtn.classList.add('hidden');
        this.currentPrompt = null;
        this.editingIndex = null;
    }
    
    updateCounters() {
        const text = this.elements.textInput.value;
        this.elements.charCount.textContent = text.length;
        this.elements.tokenCount.textContent = this.countTokens(text);
    }
    
    countTokens(text) {
        if (!text.trim()) return 0;
        
        // More accurate token counting approximation
        // Based on OpenAI's approach (1 token ~= 4 characters)
        let tokenCount = 0;
        const words = text.split(/\s+/);
        
        for (const word of words) {
            // Count tokens for each word
            tokenCount += Math.ceil(word.length / 4);
            // Add 1 for the space after each word (except last)
            if (word !== words[words.length - 1]) tokenCount++;
        }

        console.log('Token count:', tokenCount, 'for text:', text.substring(0, 50) + (text.length > 50 ? '...' : ''));
        return tokenCount;
    }
    
    splitByCharacters(text, chunkSize) {
        const chunks = [];
        for (let i = 0; i < text.length; i += chunkSize) {
            chunks.push(text.substring(i, i + chunkSize));
        }
        return chunks;
    }
    
    splitByTokens(text, chunkSize) {
        console.log('Starting token split with chunk size:', chunkSize);
        const chunks = [];
        let currentChunk = '';
        let currentTokenCount = 0;
        
        // Split by paragraphs first to preserve context
        const paragraphs = text.split(/\n\s*\n/);
        console.log('Found paragraphs:', paragraphs.length);
        
        for (const paragraph of paragraphs) {
            const paragraphTokenCount = this.countTokens(paragraph);
            console.log('Paragraph token count:', paragraphTokenCount, 'current:', currentTokenCount);
            
            // If paragraph is too big for current chunk, split it further
            if (paragraphTokenCount > chunkSize) {
                if (currentChunk) {
                    chunks.push(currentChunk.trim());
                    currentChunk = '';
                    currentTokenCount = 0;
                }
                
                // Split the large paragraph into sentences
                const sentences = paragraph.split(/(?<=[.!?])\s+/);
                let sentenceChunk = '';
                let sentenceTokenCount = 0;
                
                for (const sentence of sentences) {
                    const currentSentenceTokens = this.countTokens(sentence);
                    
                    if (currentSentenceTokens > chunkSize) {
                        // If even a single sentence is too big, split by words
                        const words = sentence.split(/\s+/);
                        let wordChunk = '';
                        let currentWordTokens = 0;
                        
                        for (const word of words) {
                            const wordTokens = this.countTokens(word);
                            
                            if (currentWordTokens + wordTokens > chunkSize && wordChunk) {
                                chunks.push(wordChunk.trim());
                                wordChunk = '';
                                currentWordTokens = 0;
                            }
                            
                            wordChunk += (wordChunk ? ' ' : '') + word;
                            currentWordTokens += wordTokens;
                        }
                        
                        if (wordChunk) {
                            chunks.push(wordChunk.trim());
                        }
                    } else if (sentenceTokenCount + currentSentenceTokens > chunkSize && sentenceChunk) {
                        chunks.push(sentenceChunk.trim());
                        sentenceChunk = '';
                        sentenceTokenCount = 0;
                    }
                    
                    sentenceChunk += (sentenceChunk ? ' ' : '') + sentence;
                    sentenceTokenCount += currentSentenceTokens;
                }
                
                if (sentenceChunk) {
                    chunks.push(sentenceChunk.trim());
                }
            } else if (currentTokenCount + paragraphTokenCount > chunkSize && currentChunk) {
                console.log('Creating new chunk at', currentTokenCount, 'tokens');
                chunks.push(currentChunk.trim());
                currentChunk = '';
                currentTokenCount = 0;
            }
            
            currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
            currentTokenCount += paragraphTokenCount;
            console.log('Added paragraph. New count:', currentTokenCount);
        }
        
        if (currentChunk) {
            console.log('Adding final chunk with', currentTokenCount, 'tokens');
            chunks.push(currentChunk.trim());
        }
        
        console.log('Total chunks created:', chunks.length);
        return chunks;
    }
    
    processText() {
        try {
            console.log('Starting text processing...');
            const text = this.elements.textInput.value;
            if (!text.trim()) {
                console.log('No text to process');
                alert('Please enter some text to process');
                return;
            }

            const chunkSize = parseInt(this.elements.chunkSizeInput.value) || this.settings.chunkSize;
            if (chunkSize < 100) {
                console.log('Invalid chunk size:', chunkSize);
                alert('Chunk size must be at least 100');
                return;
            }

            const wrapPrompt = this.elements.wrapPromptCheckbox.checked;
            
            this.chunks = [];
            this.copiedChunks.clear();
            
            console.log('Splitting text...');
            // Split by characters only
            this.chunks = this.splitByCharacters(text, chunkSize);
            console.log('Initial chunks:', this.chunks.length);
            
            // Always include prompt content if prompt exists (check input field directly)
            const currentPromptContent = this.elements.promptInput.value.trim();
            if (currentPromptContent) {
                const cleanPrompt = currentPromptContent;
                this.chunks = this.chunks.map(chunk => {
                    // Remove any existing prompt content first to avoid duplicates
                    const cleanedChunk = chunk.replace(/<prompt>.*?<\/prompt>\n?/g, '');
                    // Only wrap in tags if checkbox is checked
                    return wrapPrompt
                        ? `<prompt>${cleanPrompt}</prompt>\n${cleanedChunk}`
                        : `${cleanPrompt}\n${cleanedChunk}`;
                });
            }
            
            console.log('Final chunks:', this.chunks.length);
            
            this.renderOutput();
        } catch (error) {
            console.error("Error processing text:", error);
            alert("Error processing text. Please check console for details.");
        }
    }

    resetProcessing() {
        console.log('Resetting processing area...');
        this.elements.textInput.value = '';
        this.elements.promptInput.value = ''; // Clear the prompt input field
        this.elements.outputContainer.innerHTML = '';
        this.chunks = [];
        this.copiedChunks.clear();
        
        // Reset counters
        this.elements.charCount.textContent = '0';
        this.elements.tokenCount.textContent = '0';
        this.elements.chunkCount.textContent = '0';
        this.elements.totalChars.textContent = '0';
        this.elements.totalTokens.textContent = '0';
    }
    
    renderOutput() {
        const outputContainer = this.elements.outputContainer;
        outputContainer.innerHTML = '';
        this.elements.chunkCount.textContent = this.chunks.length;
        
        const totalChars = this.chunks.reduce((sum, chunk) => sum + chunk.length, 0);
        
        // Calculate tokens accurately
        let totalTokens = 0;
        const baseText = this.elements.textInput.value;
        const promptContent = this.elements.promptInput.value.trim();
        
        // Count base text tokens
        const baseChunks = this.chunks.map(chunk =>
            chunk.replace(/<prompt>.*?<\/prompt>\n?/g, '')
        );
        const baseTextTokens = baseChunks.reduce((sum, chunk) => sum + this.countTokens(chunk), 0);
        
        // Count prompt tokens if needed
        let promptTokens = 0;
        if (promptContent && this.elements.wrapPromptCheckbox.checked) {
            promptTokens = this.countTokens(promptContent);
        }
        totalTokens = baseTextTokens + (promptTokens * this.chunks.length);
        
        console.log('Token calculation:',
                  'Base text tokens:', baseTextTokens,
                  'Prompt tokens:', promptTokens,
                  'Total tokens:', totalTokens);
                  
        this.elements.totalChars.textContent = totalChars;
        this.elements.totalTokens.textContent = totalTokens;
        
        // Create copy buttons container at the top
        const copyButtonsContainer = document.createElement('div');
        copyButtonsContainer.className = 'flex flex-wrap gap-2 mb-4';
        
        this.chunks.forEach((chunk, index) => {
            // Add copy button to top container
            const copyBtn = document.createElement('button');
            copyBtn.className = `copy-chunk-top bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm ${
                this.copiedChunks.has(index) ? 'bg-green-500 hover:bg-green-600' : ''
            }`;
            copyBtn.dataset.index = index;
            copyBtn.textContent = this.copiedChunks.has(index) 
                ? `Copied Chunk ${index + 1}` 
                : `Copy Chunk ${index + 1}`;
            copyBtn.addEventListener('click', () => this.copyChunk(index));
            copyButtonsContainer.appendChild(copyBtn);
            
            // Create chunk card
            const chunkCard = document.createElement('div');
            chunkCard.className = `bg-white dark:bg-gray-700 p-4 rounded-lg shadow chunk-card ${
                this.copiedChunks.has(index) ? 'border-2 border-green-500' : ''
            }`;
            chunkCard.dataset.index = index;
            chunkCard.innerHTML = `
                <div class="flex justify-between items-center mb-2">
                    <div class="flex items-center space-x-3">
                        <button class="toggle-chunk text-blue-500 hover:text-blue-700 dark:hover:text-blue-400" 
                                data-index="${index}" aria-label="Toggle chunk">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        <h3 class="font-medium dark:text-white">Chunk ${index + 1}</h3>
                    </div>
                    <div class="flex items-center space-x-4">
                        <span class="text-xs text-gray-500 dark:text-gray-400">
                            ${chunk.length} chars, ~${this.countTokens(chunk)} tokens
                        </span>
                        <button class="copy-chunk text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 text-sm" 
                                data-index="${index}">Copy</button>
                    </div>
                </div>
                <div class="chunk-content bg-gray-50 dark:bg-gray-800 p-3 rounded overflow-x-auto" 
                     data-index="${index}">
                    <pre class="dark:text-gray-300">${chunk}</pre>
                </div>
            `;
            outputContainer.appendChild(chunkCard);
        });
        
        // Add copy buttons container to the top of output
        outputContainer.prepend(copyButtonsContainer);
        
        // Add event listeners for toggling chunks
        document.querySelectorAll('.toggle-chunk').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = e.currentTarget.dataset.index;
                const content = document.querySelector(`.chunk-content[data-index="${index}"]`);
                content.classList.toggle('expanded');
                
                const icon = e.currentTarget.querySelector('svg');
                icon.classList.toggle('transform');
                icon.classList.toggle('rotate-180');
            });
        });
        
        // Add event listeners for top action buttons
        document.getElementById('expand-all').addEventListener('click', () => {
            document.querySelectorAll('.chunk-content').forEach(content => {
                content.classList.add('expanded');
            });
            document.querySelectorAll('.toggle-chunk svg').forEach(icon => {
                icon.classList.add('transform', 'rotate-180');
            });
        });
        
        document.getElementById('collapse-all').addEventListener('click', () => {
            document.querySelectorAll('.chunk-content').forEach(content => {
                content.classList.remove('expanded');
            });
            document.querySelectorAll('.toggle-chunk svg').forEach(icon => {
                icon.classList.remove('transform', 'rotate-180');
            });
        });
        
        document.getElementById('copy-all').addEventListener('click', () => this.copyAllChunks());
        
        // Add event listeners for copying chunks
        document.querySelectorAll('.copy-chunk, .copy-chunk-top').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.copyChunk(parseInt(e.currentTarget.dataset.index));
            });
        });
    }
    
    copyChunk(index) {
        navigator.clipboard.writeText(this.chunks[index])
            .then(() => {
                this.copiedChunks.add(index);
                
                // Update all copy buttons for this chunk
                document.querySelectorAll(`.copy-chunk[data-index="${index}"], .copy-chunk-top[data-index="${index}"]`).forEach(btn => {
                    btn.textContent = 'Copied!';
                    btn.classList.remove('bg-blue-500', 'hover:bg-blue-600');
                    btn.classList.add('bg-green-500', 'hover:bg-green-600');
                    
                    setTimeout(() => {
                        btn.textContent = `Copy Chunk ${index + 1}`;
                        btn.classList.remove('bg-green-500', 'hover:bg-green-600');
                        btn.classList.add('bg-blue-500', 'hover:bg-blue-600');
                        this.copiedChunks.delete(index);
                        
                        // Update chunk card border
                        const chunkCard = document.querySelector(`.chunk-card[data-index="${index}"]`);
                        if (chunkCard) {
                            chunkCard.classList.remove('border-2', 'border-green-500');
                        }
                    }, 600000); // 10 minutes
                });
                
                // Highlight the chunk card
                const chunkCard = document.querySelector(`.chunk-card[data-index="${index}"]`);
                if (chunkCard) {
                    chunkCard.classList.add('border-2', 'border-green-500');
                }
            })
            .catch(err => {
                console.error('Failed to copy chunk:', err);
                alert('Failed to copy chunk to clipboard');
            });
    }
    
    copyAllChunks() {
        navigator.clipboard.writeText(this.chunks.join('\n\n---\n\n'))
            .then(() => {
                const btn = document.getElementById('copy-all');
                if (btn) {
                    const originalText = btn.textContent;
                    btn.textContent = 'Copied All!';
                    btn.classList.remove('bg-blue-500', 'hover:bg-blue-600');
                    btn.classList.add('bg-green-500', 'hover:bg-green-600');
                    
                    setTimeout(() => {
                        btn.textContent = originalText;
                        btn.classList.remove('bg-green-500', 'hover:bg-green-600');
                        btn.classList.add('bg-blue-500', 'hover:bg-blue-600');
                    }, 2000);
                }
            })
            .catch(err => {
                console.error('Failed to copy all chunks:', err);
                alert('Failed to copy chunks to clipboard');
            });
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new PromptSplitter();
});