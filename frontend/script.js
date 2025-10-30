const API_BASE_URL = window.location.origin;

let isListening = false;
let recognition = null;
let currentLanguage = null;
let languages = [];
let animationTimeout = null;
let gestureInterval = null;

if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        document.getElementById('text-input').value = transcript;
        document.getElementById('original-text').textContent = transcript;
        showStatus('Speech recognized! Now select a language to translate.', 'success');
        playASLAnimation('ASL', transcript);
    };

    recognition.onerror = (event) => {
        showStatus('Speech recognition error: ' + event.error, 'error');
        stopListening();
    };

    recognition.onend = () => {
        stopListening();
    };
}

document.getElementById('mic-button').addEventListener('click', toggleListening);
document.getElementById('clear-button').addEventListener('click', clearAll);
document.getElementById('text-input').addEventListener('input', handleTextInput);

async function loadLanguages() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/languages`);
        const data = await response.json();
        languages = data.languages;
        
        const languageGrid = document.getElementById('language-buttons');
        languageGrid.innerHTML = '';
        
        languages.forEach(lang => {
            const button = document.createElement('button');
            button.className = 'language-btn';
            button.innerHTML = `
                <span>${lang.name}</span>
                <span class="sign-code">${lang.sign}</span>
            `;
            button.onclick = () => translateToLanguage(lang.code, lang.name, lang.sign);
            languageGrid.appendChild(button);
        });
        
        showStatus('Ready to communicate! Type or speak your message.', 'info');
    } catch (error) {
        showStatus('Error loading languages. Please check the backend server.', 'error');
        console.error('Error loading languages:', error);
    }
}

function toggleListening() {
    if (!recognition) {
        showStatus('Speech recognition is not supported in your browser.', 'error');
        return;
    }

    if (isListening) {
        stopListening();
    } else {
        startListening();
    }
}

function startListening() {
    isListening = true;
    const micButton = document.getElementById('mic-button');
    micButton.classList.add('listening');
    micButton.querySelector('.mic-icon').textContent = '🔴';
    recognition.start();
    showStatus('Listening... Speak now!', 'info');
}

function stopListening() {
    isListening = false;
    const micButton = document.getElementById('mic-button');
    micButton.classList.remove('listening');
    micButton.querySelector('.mic-icon').textContent = '🎤';
    if (recognition) {
        recognition.stop();
    }
}

function handleTextInput(event) {
    const text = event.target.value;
    if (text.trim()) {
        document.getElementById('original-text').textContent = text;
        playASLAnimation('ASL', text);
    }
}

async function translateToLanguage(langCode, langName, signCode) {
    const text = document.getElementById('text-input').value.trim();
    
    if (!text) {
        showStatus('Please enter or speak some text first!', 'error');
        return;
    }

    currentLanguage = langCode;
    showStatus(`Translating to ${langName}...`, 'info');
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/translate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: text,
                target_language: langCode
            })
        });

        if (!response.ok) {
            throw new Error('Translation request failed');
        }

        const data = await response.json();
        
        if (data.success) {
            document.getElementById('translated-text').textContent = data.translated_text;
            showStatus(`✓ Translated to ${langName}! Playing audio...`, 'success');
            
            playSignAnimation(signCode, data.translated_text);
            
            await playTranslatedAudio(data.translated_text, langCode);
        } else {
            throw new Error(data.error || 'Translation failed');
        }
        
    } catch (error) {
        showStatus('Translation failed. Please check your connection and try again.', 'error');
        console.error('Translation error:', error);
    }
}

async function playTranslatedAudio(text, language) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/tts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: text,
                language: language
            })
        });

        if (!response.ok) {
            throw new Error('TTS request failed');
        }

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audioPlayer = document.getElementById('audio-player');
        audioPlayer.src = audioUrl;
        audioPlayer.play();
        
        audioPlayer.onended = () => {
            URL.revokeObjectURL(audioUrl);
        };
        
    } catch (error) {
        console.error('TTS error:', error);
        showStatus('Audio playback failed, but translation was successful!', 'info');
    }
}

function playASLAnimation(signType, text = '') {
    const signLabel = document.getElementById('sign-label');
    signLabel.textContent = `Showing ${signType} signs`;
    
    if (animationTimeout) {
        clearTimeout(animationTimeout);
    }
    if (gestureInterval) {
        clearInterval(gestureInterval);
    }
    
    const hands = document.querySelectorAll('.hand');
    const leftHand = document.querySelector('.left-hand');
    const rightHand = document.querySelector('.right-hand');
    
    hands.forEach(hand => {
        hand.classList.add('active');
    });
    
    const words = text.split(' ').filter(w => w.length > 0);
    const animationDuration = Math.max(2000, words.length * 400);
    
    animateSignGestures(leftHand, rightHand, words.length);
    
    animationTimeout = setTimeout(() => {
        if (gestureInterval) {
            clearInterval(gestureInterval);
            gestureInterval = null;
        }
        hands.forEach(hand => {
            hand.classList.remove('active');
            hand.style.transform = '';
        });
        signLabel.textContent = 'Ready to communicate';
    }, animationDuration);
}

function playSignAnimation(signCode, text = '') {
    const signLabel = document.getElementById('sign-label');
    signLabel.textContent = `Showing ${signCode} signs`;
    
    if (animationTimeout) {
        clearTimeout(animationTimeout);
    }
    if (gestureInterval) {
        clearInterval(gestureInterval);
    }
    
    const hands = document.querySelectorAll('.hand');
    const leftHand = document.querySelector('.left-hand');
    const rightHand = document.querySelector('.right-hand');
    
    hands.forEach(hand => {
        hand.classList.add('active');
    });
    
    const words = text.split(' ').filter(w => w.length > 0);
    const animationDuration = Math.max(3000, words.length * 400);
    
    animateSignGestures(leftHand, rightHand, words.length);
    
    animationTimeout = setTimeout(() => {
        if (gestureInterval) {
            clearInterval(gestureInterval);
            gestureInterval = null;
        }
        hands.forEach(hand => {
            hand.classList.remove('active');
            hand.style.transform = '';
        });
        signLabel.textContent = 'Ready to communicate';
    }, animationDuration);
}

function animateSignGestures(leftHand, rightHand, wordCount) {
    const gestures = [
        { left: 'translateY(-30px) rotate(-20deg)', right: 'translateY(-30px) rotate(20deg)' },
        { left: 'translateY(-20px) translateX(-10px)', right: 'translateY(-20px) translateX(10px)' },
        { left: 'translateY(-25px) rotate(15deg)', right: 'translateY(-15px) rotate(-15deg)' },
        { left: 'translateX(-15px) rotate(-10deg)', right: 'translateX(15px) rotate(10deg)' },
        { left: 'translateY(-35px)', right: 'translateY(-25px)' }
    ];
    
    let currentGesture = 0;
    gestureInterval = setInterval(() => {
        if (currentGesture < Math.min(wordCount, 10)) {
            const gesture = gestures[currentGesture % gestures.length];
            leftHand.style.transform = gesture.left;
            rightHand.style.transform = gesture.right;
            currentGesture++;
        } else {
            clearInterval(gestureInterval);
            gestureInterval = null;
        }
    }, 400);
}

function showStatus(message, type) {
    const statusElement = document.getElementById('status-message');
    statusElement.textContent = message;
    statusElement.className = 'status-message ' + type;
    
    if (type === 'success' || type === 'info') {
        setTimeout(() => {
            if (statusElement.textContent === message) {
                statusElement.textContent = '';
                statusElement.className = 'status-message';
            }
        }, 5000);
    }
}

function clearAll() {
    document.getElementById('text-input').value = '';
    document.getElementById('original-text').textContent = 'Your text will appear here...';
    document.getElementById('translated-text').textContent = 'Translation will appear here...';
    document.getElementById('sign-label').textContent = 'Ready to communicate';
    showStatus('Cleared! Ready for new input.', 'info');
}

loadLanguages();
