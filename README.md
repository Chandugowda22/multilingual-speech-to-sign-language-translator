# Multilingual Speech to Sign Language Translator with Avatar

A web-based academic project that explores accessible communication through multilingual text translation, text-to-speech, sign-language video resources, an avatar interface, and hand-gesture detection.

## About the Project

This project aims to help bridge communication gaps between spoken or written languages and sign language. It combines a Flask backend, web technologies, translation services, speech generation, sign-language video resources, and computer vision.

## Key Features

- **Text Translation:** Process user-entered text using a translation service.
- **Speech Support:** Support speech input and output where implemented.
- **Text-to-Speech:** Generate spoken audio from text.
- **Sign-Language Videos:** Display available sign-language videos for mapped content.
- **Avatar Interface:** Provide an avatar-oriented interface.
- **Hand-Gesture Detection:** Detect hand landmarks using MediaPipe Hands and a webcam.
- **Gesture Mapping:** Match detected hand patterns against configured gestures.
- **Multilingual Resources:** Organize sign-language videos and mappings for supported languages.

## Technologies Used

| Technology | Purpose |
|---|---|
| Python | Application logic |
| Flask | Backend development |
| HTML | Webpage structure |
| CSS | Styling and layout |
| JavaScript | Frontend interactions |
| MediaPipe Hands | Hand-landmark detection |
| googletrans | Text translation |
| gTTS | Text-to-speech generation |
## Sign-Language Resources

The project includes video resources or gesture mappings for selected sign languages:

- American Sign Language (ASL)
- Indian Sign Language (ISL)
- Korean Sign Language (KSL)
- Japanese Sign Language (JSL)
- Chinese Sign Language (CSL)
- German Sign Language (DGS)

Resource availability varies by language. Complete sentence-level translation may not be supported for every sign language.

## Project Structure

```text
multilingual-speech-to-sign-language-translator/
├── backend/
│   ├── app.py
│   └── static/
├── frontend/
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites

- Python
- Git
- A modern web browser
- A webcam for gesture detection
- Internet access for online translation services

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/Chandugowda22/multilingual-speech-to-sign-language-translator.git
```

**2. Open the project folder**

```bash
cd multilingual-speech-to-sign-language-translator
```

**3. Create a virtual environment**

```bash
python -m venv .venv
```

**4. Activate the environment on Windows**

```powershell
.venv\Scripts\Activate.ps1
```


### Running the Application

Start the Flask application using:

```bash
python backend/app.py
```

Open the local URL displayed in the terminal. If the frontend needs to run separately, follow the instructions for its configured development server.

## How It Works

1. The user enters text or uses a supported speech-input feature.
2. The application processes and translates the text using the configured service.
3. Text-to-speech generates audio where supported.
4. Available sign-language videos or mapped outputs are displayed.
5. MediaPipe Hands detects hand landmarks and compares them with configured gesture mappings.

## Skills Demonstrated

- Python and Flask development
- HTML, CSS, and JavaScript
- API integration
- Translation and text-to-speech integration
- Computer vision fundamentals
- Hand-landmark detection and gesture mapping
- Multimedia integration

## Future Enhancements

- Expand the supported gesture vocabulary.
- Improve gesture recognition accuracy.
- Add more sign-language video resources.
- Enhance avatar animations.
- Evaluate recognition performance using a test dataset.
- Improve accessibility through user feedback.

## Author

**Chandana A C**

GitHub: [@Chandugowda22](https://github.com/Chandugowda22)

## Disclaimer

This project is developed for academic and educational purposes. Translation quality, gesture recognition, and sign-language coverage depend on the available resources and implemented mappings. This application is not a substitute for a qualified sign-language interpreter.
