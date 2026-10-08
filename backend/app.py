import logging
logging.basicConfig(level=logging.DEBUG)

from flask import Flask, request, jsonify, send_file, send_from_directory, after_this_request
from flask_cors import CORS
from gtts import gTTS
from pypinyin import lazy_pinyin
from hangul_romanize import Transliter
from hangul_romanize.rule import academic
from indic_transliteration import sanscript
from indic_transliteration.sanscript import transliterate
import pykakasi
#from camel_tools.transliterate import Transliterator

import cutlet
import traceback
import os
import tempfile
import uuid
import jaconv


from googletrans import Translator  # use version googletrans==4.0.0-rc1

app = Flask(__name__)
CORS(app)

FRONTEND_DIR = os.path.join(os.path.dirname(__file__), '..', 'frontend')


@app.route('/')
def home():
    return send_from_directory(FRONTEND_DIR, 'index.html')

def arabic_simple_roman(text):
    mapping = {
        "ك": "k", "ي": "y", "ف": "f", "ح": "h", "ا": "a", "ل": "l",
        "م": "m", "ن": "n", "ر": "r", "ب": "b", "ت": "t", "د": "d",
        "س": "s", "و": "w", "ه": "h", "ج": "j", "ق": "q",
        "ط": "t", "ص": "s", "ض": "d", "ع": "a", "خ": "kh",
        "غ": "gh", "ش": "sh", "ذ": "dh", "ث": "th", "ز": "z"
    }
    result = ""
    for ch in text:
        result += mapping.get(ch, ch)
    return result


def get_pronunciation(text, lang):
    try:
        # Hindi (ISL)
        if lang == "hi":
            return transliterate(text, sanscript.DEVANAGARI, sanscript.ITRANS)

        # Japanese (JSL)
        if lang == "ja":
            kks = pykakasi.kakasi()
            result = kks.convert(text)
            return " ".join([item["hepburn"] for item in result])

        # Arabic (ArSL)
        if lang == "ar":
            return arabic_simple_roman(text)

        return None
    except Exception as e:
        print("Pronunciation error:", e)
        return None




@app.route('/<path:filename>')
def serve_frontend(filename):
    return send_from_directory(FRONTEND_DIR, filename)

# ✅ TRANSLATE API
@app.route('/api/translate', methods=['POST'])
def translate_text():
    try:
        data = request.json
        text = data.get('text', '')
        target_language = data.get('target_language', 'hi')

        if not text:
            return jsonify({"error": "No text provided"}), 400

        # Normalize target language for translation compatibility
        dest_code = 'zh-CN' if target_language == 'zh' else target_language

        translator = Translator()
        result = translator.translate(text, dest=dest_code)

        translated_text = result.text
        pronunciation = ""

        # ✅ Custom pronunciation (Romanization)
        custom_pron = get_pronunciation(translated_text, target_language)

       # pronunciation = result.pronunciation or ""

        # Chinese Pronunciation → Pinyin
        if target_language == "zh":
            pronunciation = ' '.join(lazy_pinyin(translated_text))

        # Korean Pronunciation → Romanization
        if target_language == "ko":
            transliter = Transliter(academic)
            pronunciation = transliter.translit(translated_text)
        # Japanese Pronunciation → Romaji
        if target_language == "ja":
            pronunciation = jaconv.kata2alphabet(jaconv.hira2kata(translated_text))


        # Fallback if pronunciation missing
        #if not pronunciation:
            #pronunciation = translated_text

        # ✅ Use custom pronunciation if available
        if custom_pron:
           pronunciation = custom_pron
        elif not pronunciation:
           pronunciation = translated_text


        return jsonify({
            "original_text": text,
            "translated_text": translated_text,
            "pronunciation": pronunciation,
            "target_language": target_language,
            "success": True
        })

    except Exception as e:
        print("Translation Error:", str(e))
        traceback.print_exc()
        return jsonify({"error": str(e), "success": False}), 500


# ---------------------------------------------------------------
# ✅ TEXT → SPEECH (FULL MULTILINGUAL)
# ---------------------------------------------------------------

@app.route('/api/tts', methods=['POST'])
def text_to_speech():
    try:
        data = request.json
        text = data.get('text', '')
        lang = data.get('language', 'en')

        if not text:
            return jsonify({"error": "No text provided"}), 400

        # gTTS supported languages
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

        if lang not in language_map:
            return jsonify({"error": f"TTS not supported for language: {lang}"}), 400

        tts_lang = language_map[lang]

        # avoid Windows lock problem
        fd, temp_path = tempfile.mkstemp(suffix=".mp3")
        os.close(fd)

        tts = gTTS(text=text, lang=tts_lang)
        tts.save(temp_path)

        @after_this_request
        def remove_file(response):
            import threading, time
            def delete_later(path):
                time.sleep(0.2)
                if os.path.exists(path):
                    os.remove(path)
            threading.Thread(target=delete_later, args=(temp_path,)).start()
            return response

        return send_file(temp_path, mimetype="audio/mpeg")

    except Exception as e:
        return jsonify({"error": str(e), "success": False}), 500


# ---------------------------------------------------------------
# AVAILABLE LANGUAGES
# ---------------------------------------------------------------

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


# ---------------------------------------------------------------
# SERVE SIGN LANGUAGE VIDEOS
# ---------------------------------------------------------------

@app.route('/video/<filename>')
def serve_video(filename):
    video_folder = os.path.join(os.path.dirname(__file__), 'static', 'asl_videos')
    return send_from_directory(video_folder, filename)


# ---------------------------------------------------------------
# CLEANUP TEMP FILES
# ---------------------------------------------------------------

import atexit
import glob


def cleanup_temp_audio():
    temp_files = glob.glob(os.path.join(tempfile.gettempdir(), "*.mp3"))
    for f in temp_files:
        try:
            os.remove(f)
        except:
            pass


atexit.register(cleanup_temp_audio)


# ---------------------------------------------------------------
# START SERVER
# ---------------------------------------------------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)

