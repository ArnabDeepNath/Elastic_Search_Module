document.addEventListener('DOMContentLoaded', function() {
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');

    chatForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const message = chatInput.value.trim();
        if (!message) return;

        // Add user message
        appendMessage('user', message);
        chatInput.value = '';

        try {
            const response = await fetch('http://localhost:5001/proxy/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ message })
            });

            const data = await response.json();
            if (data.status === 'success') {
                // Format the response
                console.log('Response before formatting:', data.response);
                let formattedResponse = formatResponse(data.response);
                console.log('Response after formatting:', formattedResponse);
                appendMessage('bot', formattedResponse);
            } else {
                appendMessage('bot', 'Sorry, I encountered an error.');
            }
        } catch (error) {
            console.error('Error:', error);
            appendMessage('bot', 'Sorry, I encountered an error.');
        }
    });

    function formatResponse(response) {
        // Remove the thinking part enclosed in <think> tags
        let cleanResponse = response.replace(/<think>[\s\S]*?<\/think>\s*/i, '');
        
        // Remove response time information
        cleanResponse = cleanResponse.replace(/\s*Response time: [\d.]+ seconds\.?$/i, '');
        
        // Convert **text** to <strong>text</strong>
        cleanResponse = cleanResponse.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        
        // Add line breaks for better readability
        cleanResponse = cleanResponse.replace(/\n/g, '<br>');
        
        // Remove any extra whitespace and trim
        return cleanResponse.trim();
    }

    function appendMessage(type, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;
        messageDiv.innerHTML = content;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
});
