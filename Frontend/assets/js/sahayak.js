function typeText(element, text, speed = 30) {
    let index = 0;
    element.innerHTML = '';
    
    function type() {
        if (index < text.length) {
            element.innerHTML += text.charAt(index);
            index++;
            setTimeout(type, speed);
        }
    }
    
    type();
}

function handleKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

function sendMessage() {
    const inputField = document.getElementById("chat-input");
    const chatBox = document.getElementById("chat-box");
    const modelSelector = document.getElementById("model-selector");
    const message = inputField.value.trim();
    let apiVersion = "v1";

    // Map model selection to correct API version
    switch(modelSelector.value) {
        case "v2": // Elaborate
            apiVersion = "v1";
            break;
        case "v1": // Brief
            apiVersion = "v2";
            break;
        case "v3": // Translate
            apiVersion = "translate";
            break;
        case "v4": // Translate
            apiVersion = "v4";
            break;
        case "v5": // Translate
            apiVersion = "v5";
            break;
        case "v6": // Translate
            apiVersion = "v6";
            break;
    }

    if (message) {
        // Display user message
        const userMessage = document.createElement("div");
        userMessage.innerHTML = message;
        userMessage.classList.add("message", "user-message");
        chatBox.appendChild(userMessage);
        chatBox.scrollTop = chatBox.scrollHeight;
        inputField.value = "";

        // Show progress bar
        const progressContainer = document.createElement("div");
        progressContainer.classList.add("progress-container", "message", "bot-message");
        
        const progressBar = document.createElement("div");
        progressBar.classList.add("progress-bar");
        
        const progressText = document.createElement("div");
        progressText.classList.add("progress-text");
        progressText.textContent = "Generating response...";
        
        progressBar.appendChild(progressText);
        progressContainer.appendChild(progressBar);
        chatBox.appendChild(progressContainer);

        // Animate progress bar
        let progress = 0;
        const duration = 50000; // 75 seconds average
        const interval = 500; // Update every 0.5 seconds
        const steps = duration / interval;
        const increment = 100 / steps;
        
        const progressInterval = setInterval(() => {
            progress = Math.min(progress + increment, 99); // Cap at 99%
            progressBar.style.width = progress + "%";
            progressText.textContent = `Generating response... ${Math.round(progress)}%`;
        }, interval);

        // Call backend API with selected model version
        fetch(`https://api.sewasetu.assam.statedatacenter.in/sahayak/api/chat/${apiVersion}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ message: message })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Server responded with status: ${response.status}`);
            }
            return response.json();
        })
        // Replace this portion in your JavaScript
        .then(data => {
            // Clear progress bar animation
            clearInterval(progressInterval);
            chatBox.removeChild(progressContainer);
            
            // Format bot response
            const botMessage = document.createElement("div");
            botMessage.classList.add("message", "bot-message");
            chatBox.appendChild(botMessage);

            let formattedResponse = data.response;
            // Remove thinking section
            formattedResponse = formattedResponse.replace(/<think>[\s\S]*?<\/think>\s*/i, '');
            // Remove response time information
            formattedResponse = formattedResponse.replace(/\s*Response time: [\d.]+ seconds\.?$/i, '');
            // Convert **text** to <strong>text</strong>
            formattedResponse = formattedResponse.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
            
            // Extract and format sources section
            const sourcesMatch = formattedResponse.match(/Sources:[\s\S]*$/i);
            if (sourcesMatch) {
                const mainText = formattedResponse.replace(/Sources:[\s\S]*$/i, '').trim();
                const sources = sourcesMatch[0].replace(/^Sources:/i, '').trim().split('\n- ').filter(s => s);
                
                let formattedSources = '<div class="main-response">' + mainText.replace(/\n/g, '<br>') + '</div>';
                formattedSources += '<div class="sources-title"><strong>Sources:</strong></div>';
                formattedSources += '<div class="sources-container">';
                
                sources.forEach(source => {
                    const urlMatch = source.match(/URL: (https:\/\/[^\s]+)/);
                    const sourceText = source.replace(/URL: https:\/\/[^\s]+/, '').trim();
                    const applyButton = urlMatch ? 
                        `<button class="btn btn-primary" onclick="window.open('${urlMatch[1]}', '_blank')">Apply Now</button>` : '';
                    
                    formattedSources += `
                        <div class="source-card">
                            <div class="source-content">${sourceText}</div>
                            ${applyButton}
                        </div>`;
                });
                
                formattedSources += '</div>';
                formattedResponse = formattedSources;
            } else {
                formattedResponse = formattedResponse.replace(/\n/g, '<br>');
            }
            
            // Apply typing effect while preserving HTML formatting
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = formattedResponse.trim();
            const textContent = tempDiv.textContent;
            let index = 0;
            let htmlContent = '';
            let htmlStack = [];
            
            function typeWithHTML() {
                if (index < textContent.length) {
                    // Find the next position in the original HTML
                    let currentPos = 0;
                    let textPos = 0;
                    let inTag = false;
                    let currentHTML = '';

                    while (textPos <= index && currentPos < formattedResponse.length) {
                        const char = formattedResponse[currentPos];
                        if (char === '<') {
                            inTag = true;
                        }
                        currentHTML += char;
                        if (!inTag && char !== '>') {
                            textPos++;
                        }
                        if (char === '>') {
                            inTag = false;
                        }
                        currentPos++;
                    }

                    botMessage.innerHTML = currentHTML;
                    index++;
                    setTimeout(typeWithHTML, 30);
                }
            }
            
            typeWithHTML();
            chatBox.scrollTop = chatBox.scrollHeight;
        })
        .catch(error => {
            // Clear progress bar animation
            clearInterval(progressInterval);
            chatBox.removeChild(progressContainer);
            
            // Display error message
            const errorMessage = document.createElement("div");
            errorMessage.innerHTML = "Sorry, I encountered an error. Please try again.";
            errorMessage.classList.add("message", "bot-message", "error");
            chatBox.appendChild(errorMessage);
            chatBox.scrollTop = chatBox.scrollHeight;
        });
    }
}

function handleKeyPress(event) {
    if (event.key === "Enter") {
        sendMessage();
    }
}
