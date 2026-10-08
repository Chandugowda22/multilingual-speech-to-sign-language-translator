// ✅ STEP 1: Wave Detection Code (ADD AT TOP)
let lastX = null;
let direction = null;
let waveCount = 0;

function detectWave(landmarks) {
    const currentX = landmarks[0].x; // wrist x position

    if (lastX !== null) {
        let diff = currentX - lastX;

        if (diff > 0.02) {
            if (direction === "left") waveCount++;
            direction = "right";
        } 
        else if (diff < -0.02) {
            if (direction === "right") waveCount++;
            direction = "left";
        }
    }

    lastX = currentX;

    if (waveCount >= 4) {
        waveCount = 0;
        return "HELLO 👋";
    }

    return null;
}

const signVideos = {
    "hello": "hello.mp4",
    "how are you": "how_are_you.mp4",
    "i am fine": "i_am_fine.mp4",
    "what is your name": "what_is_your_name.mp4",
    "my name is chandu": "my_name_is_chandu.mp4",
    "good morning": "good_morning.mp4",
    "good night": "good_night.mp4",
    "thank you": "thank_you.mp4",
    "sorry": "sorry.mp4",
    "i love you": "i_love_you.mp4",
    "where are you from": "where_are_you_from.mp4",
    "i am from india": "i_am_from_india.mp4",
    "goodbye": "goodbye.mp4",
    "call me": "call_me.mp4",
    "yes": "yes.mp4",
    "no": "no.mp4",
    "help me": "help_me.mp4",
    "call me": "call_me"
};
let currentVideo = "";

function playSignVideo(text, signLang = "ASL") {
    const video = document.getElementById("signVideo");
    if (!video) return;

    const cleaned = text.toLowerCase().trim();

    let folder = "/static/asl_videos/";
    if (signLang === "DGS") {
        folder = "/static/DGS_videos/";
    }

    for (let key in signVideos) {
        if (cleaned.includes(key)) {
            const videoPath = folder + signVideos[key];

            if (currentVideo === videoPath) return;
            currentVideo = videoPath;

            video.pause();
            video.src = videoPath;
            video.load();
            video.style.display = "block";

            video.oncanplay = () => {
                video.play().catch(() => {});
            };
            return;
        }
    }

    video.pause();
    video.style.display = "none";
    currentVideo = "";
}


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
        playASLAnimation(currentLanguage === "de" ? "DGS" : "ASL", transcript);

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
            button.onclick = (event) => {translateToLanguage(event, lang.code, lang.name, lang.sign);

};


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
        // Play sign video if available
        const cleaned = text.trim().toLowerCase().replace(/[^\w\s]/gi, '');
       playSignVideo(cleaned, currentLanguage === "de" ? "DGS" : "ASL");


        playASLAnimation(currentLanguage === "de" ? "DGS" : "ASL", text);

    }
}
async function playTranslatedAudio(text, language) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/tts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: text,
                language: language
            })
        });

        if (!response.ok) {
            throw new Error("TTS request failed");
        }

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);

        const audioPlayer = document.getElementById("audio-player");
        audioPlayer.src = audioUrl;
        audioPlayer.play();

        audioPlayer.onended = () => {
            URL.revokeObjectURL(audioUrl);
        };

    } catch (error) {
        console.error("TTS error:", error);
        showStatus("Audio failed, but translation worked", "info");
    }
}


 async function translateToLanguage(event, langCode, langName, signCode) {

    const btn = event.currentTarget; // ✅ define first

    // ✅ Active button highlight
    document.querySelectorAll('.language-btn')
        .forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // ✅ Button loading UI
    btn.classList.add("translating");
    btn.dataset.originalText = btn.innerHTML;
    btn.innerHTML = "⏳ Translating...";

    // ✅ GET TEXT (this was missing)
    const text = document.getElementById('text-input').value.trim();

    if (!text) {
        btn.classList.remove("translating");
        btn.innerHTML = btn.dataset.originalText;
        showStatus('Please enter or speak some text first!', 'error');
        return;
    }

    currentLanguage = langCode;
    showStatus(`Translating to ${langName}...`, 'info');

    try {
        const response = await fetch(`${API_BASE_URL}/api/translate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: text,
                target_language: langCode
            })
        });

        if (!response.ok) throw new Error('Translation failed');

        const data = await response.json();

        if (data.success) {
            const translatedBox = document.getElementById('translated-text');
            translatedBox.innerHTML = `
                <strong>Translation:</strong> ${data.translated_text}<br>
                <strong>Pronunciation:</strong> ${data.pronunciation || "N/A"}
            `;
            translatedBox.style.color = "#00ffcc";

            // 🎬 Play sign video if exists
            const signLang = (langCode === "de") ? "DGS" : "ASL";

            playSignVideo(data.translated_text, signLang);




            playSignAnimation(signCode, data.translated_text);
            await playTranslatedAudio(data.translated_text, langCode);

            showStatus(`✓ Translated to ${langName}!`, 'success');
        }

    } catch (error) {
        console.error(error);
        showStatus('Translation failed. Try again.', 'error');
    } finally {
        btn.classList.remove("translating");
        btn.innerHTML = btn.dataset.originalText;
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
// ===============================
// ===============================
// Gesture Detection + Webcam Control
// ===============================

// Global variables
// ===============================

let mpCamera = null;
let cameraStream = null;
 


const KSL_GESTURE_MAP = {
  "1,1,1,1,1": { ksl: "안녕하세요", roman: "annyeonghaseyo", meaning: "hello" },
  "1,1,1,1,0": { ksl: "안녕", roman: "annyeong", meaning: "hi" },

  "0,1,1,0,1": { ksl: "감사합니다", roman: "gamsahamnida", meaning: "thank you" },
  "1,1,0,0,1": { ksl: "사랑해", roman: "saranghae", meaning: "i love you" },

  "1,1,0,0,0": { ksl: "예", roman: "ye", meaning: "yes" },
  "0,0,1,0,0": { ksl: "아니요", roman: "aniyo", meaning: "no" },

  "1,0,1,0,0": { ksl: "도와줘", roman: "dowajwo", meaning: "help me" },
  "0,0,0,0,1": { ksl: "멈춰", roman: "meomchwo", meaning: "stop" },

  "0,0,1,1,0": { ksl: "어디", roman: "eodi", meaning: "where" },
  "0,1,0,1,0": { ksl: "뭐", roman: "mwo", meaning: "what" },
  "1,0,0,1,0": { ksl: "누구", roman: "nugu", meaning: "who" },
  "0,1,1,0,0": { ksl: "어때", roman: "eottae", meaning: "how" },

  "1,1,1,0,0": { ksl: "좋아", roman: "joa", meaning: "good" },
  "1,0,0,0,1": { ksl: "전화해", roman: "jeonhwa-hae", meaning: "call me" },

  "0,1,0,0,1": { ksl: "괜찮아", roman: "gwaenchana", meaning: "okay" },
  "1,0,0,0,0": { ksl: "좋아요", roman: "joayo", meaning: "like / thumbs up" }
};

let lastGesture = null;
let stableCount = 0;
const STABLE_THRESHOLD = 6; // frames

document.addEventListener("DOMContentLoaded", () => {
    const videoElement = document.getElementById("camera");
    const canvasElement = document.getElementById("output-canvas");
    const canvasCtx = canvasElement.getContext("2d");

    // -----------------------------
    // MediaPipe Hands Setup
    // -----------------------------
    const hands = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });

    hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.7
    });

    function getFingerStatesStable(landmarks) {
  const fingers = [];

  // Thumb (x direction – works for right hand)
  fingers.push(
    landmarks[4].x < landmarks[3].x ? 1 : 0
  );

  // Index
  fingers.push(
    landmarks[8].y < landmarks[6].y ? 1 : 0
  );

  // Middle
  fingers.push(
    landmarks[12].y < landmarks[10].y ? 1 : 0
  );

  // Ring
  fingers.push(
    landmarks[16].y < landmarks[14].y ? 1 : 0
  );

  // Pinky
  fingers.push(
    landmarks[20].y < landmarks[18].y ? 1 : 0
  );

  return fingers;
}


    // Process results from hands detection
    hands.onResults((results) => {
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  if (results.multiHandLandmarks) {
    for (const landmarks of results.multiHandLandmarks) {


        const fingerStates = getFingerStatesStable(landmarks);
const key = fingerStates.join(",");

if (key === lastGesture) {
  stableCount++;
} else {
  stableCount = 0;
  lastGesture = key;
}

if (stableCount >= STABLE_THRESHOLD && KSL_GESTURE_MAP[key]) {
  const g = KSL_GESTURE_MAP[key];

  document.getElementById("detected-sign").innerHTML =
    "KSL: " + g.ksl + "<br>" +
    "Pronunciation: " + g.roman + "<br>" +
    "Meaning: " + g.meaning;
}

      // Draw skeleton lines
      drawConnectors(
  canvasCtx,
  landmarks,
  HAND_CONNECTIONS,
  { color: "#00ff99", lineWidth: 2 }
);
      // Draw joint points
     drawLandmarks(
  canvasCtx,
  landmarks,
  { color: "#00ff99", radius: 2 }
);

    }
      

} else {
  document.getElementById("detected-sign").innerText =
    "Gesture not recognized ❌";
}


});

    // -----------------------------
    // Initialize MediaPipe Camera
    // -----------------------------
    mpCamera = new Camera(videoElement, {
    onFrame: async () => {
        // ❗ SAFETY CHECK
        if (videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
            return;
        }
        await hands.send({ image: videoElement });
    },
    width: 640,
    height: 480
});

    // ⚠️ Do NOT call mpCamera.start() here; use open webcam button
});


// ===============================
// Webcam Open / Close Button Logic
// ===============================
const videoElement = document.getElementById("camera");
const openWebcamBtn = document.getElementById("open-webcam");
const closeWebcamBtn = document.getElementById("close-webcam");
const webcamContainer = document.getElementById("webcam-container");

// Open Webcam
openWebcamBtn.addEventListener("click", async () => {
  webcamContainer.style.display = "block";

  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoElement.srcObject = cameraStream;

    videoElement.onloadedmetadata = () => {
      videoElement.play();

      if (mpCamera) {
        mpCamera.start(); // ✅ start only when video is READY
        console.log("✅ Webcam + Gesture Detection Started");
      }
    };

  } catch (error) {
    alert("Camera not accessible or permission denied!");
    console.error(error);
  }
});


// Close Webcam
closeWebcamBtn.addEventListener("click", () => {
  webcamContainer.style.display = "none";

  if (cameraStream) {
    cameraStream.getTracks().forEach((track) => track.stop());
    videoElement.srcObject = null;
  }

  if (mpCamera) mpCamera.stop(); // Stop gesture detection

   // ✅ CLEAR detected gesture text
const detectedSign = document.getElementById("detected-sign");
if (detectedSign) {
  detectedSign.innerHTML = "Ready to communicate";
}
  

  console.log("❌ Webcam + Gesture Detection Stopped");
});
