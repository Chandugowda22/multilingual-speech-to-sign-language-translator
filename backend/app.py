from flask import Flask, request, jsonify, send_file, send_from_directory, after_this_request
from flask_cors import CORS
from gtts import gTTS
from translate import Translator
import os
import tempfile
import uuid

app = Flask(__name__)
CORS(app)

FRONTEND_DIR = os.path.join(os.path.dirname(__file__), '..', 'frontend')

@app.route('/')
def home():
    return send_from_directory(FRONTEND_DIR, 'index.html')

@app.route('/<path:filename>')
def serve_frontend(filename):
    return send_from_directory(FRONTEND_DIR, filename)

@app.route('/api/translate', methods=['POST'])
def translate_text():
    try:
        data = request.json
        text = data.get('text', '')
        target_language = data.get('target_language', 'hi')
        
        if not text:
            return jsonify({"error": "No text provided"}), 400
        
        translator = Translator(to_lang=target_language)
        translated_text = translator.translate(text)
        
        return jsonify({
            "original_text": text,
            "translated_text": translated_text,
            "target_language": target_language,
            "success": True
        })
    
    except Exception as e:
        return jsonify({
            "error": str(e),
            "success": False
        }), 500

@app.route('/api/tts', methods=['POST'])
def text_to_speech():
    audio_path = None
    try:
        data = request.json
        text = data.get('text', '')
        language = data.get('language', 'en')
        
        if not text:
            return jsonify({"error": "No text provided"}), 400
        
        language_map = {
            'hi': 'hi',
            'es': 'es',
            'de': 'de',
            'ja': 'ja',
            'ko': 'ko',
            'zh': 'zh-CN',
            'fr': 'fr',
            'ar': 'ar',
            'it': 'it',
            'en': 'en'
        }
        
        tts_lang = language_map.get(language, 'en')
        
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.mp3')
        audio_path = temp_file.name
        temp_file.close()
        
        tts = gTTS(text=text, lang=tts_lang, slow=False)
        tts.save(audio_path)
        
        @after_this_request
        def cleanup(response):
            try:
                if audio_path and os.path.exists(audio_path):
                    os.remove(audio_path)
            except Exception as e:
                print(f"Error deleting temporary file: {e}")
            return response
        
        return send_file(audio_path, mimetype='audio/mpeg', as_attachment=False)
    
    except Exception as e:
        if audio_path and os.path.exists(audio_path):
            try:
                os.remove(audio_path)
            except Exception as cleanup_error:
                print(f"Error cleaning up temporary file after error: {cleanup_error}")
        
        return jsonify({
            "error": str(e),
            "success": False
        }), 500

@app.route('/api/languages', methods=['GET'])
def get_languages():
    languages = [
        {"code": "hi", "name": "Hindi", "sign": "ISL"},
        {"code": "es", "name": "Spanish", "sign": "LSE"},
        {"code": "de", "name": "German", "sign": "DGS"},
        {"code": "ja", "name": "Japanese", "sign": "JSL"},
        {"code": "ko", "name": "Korean", "sign": "KSL"},
        {"code": "zh", "name": "Chinese", "sign": "CSL"},
        {"code": "fr", "name": "French", "sign": "LSF"},
        {"code": "ar", "name": "Arabic", "sign": "ArSL"},
        {"code": "it", "name": "Italian", "sign": "LIS"}
    ]
    return jsonify({"languages": languages})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
