import os
import re
import json
import uuid
import datetime
from typing import Optional, Dict, Any, List
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from data import SYLLABUS_DATA, VOICE_DEMO_SCENARIOS

# Load environment variables from .env
load_dotenv()

app = FastAPI(
    title="ShikshaSetu Backend API",
    description="Microservice endpoints for ShikshaSetu syllabus retrieval and voice processing pipeline.",
    version="1.0.0"
)

# Enable CORS for local development (Expo mobile, web, emulator)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class VoiceProcessRequest(BaseModel):
    audio_base64: Optional[str] = None
    scenario_id: Optional[int] = 1
    language_hint: Optional[str] = "hi"

class VoiceProcessResponse(BaseModel):
    recognized_text: Optional[str] = None
    translated_text: str
    audio_file: str
    script: str
    confidence: float

# Fix type annotation
class VoiceResponse(BaseModel):
    recognized_text: str
    translated_text: str
    audio_file: str
    script: str
    confidence: float

@app.get("/")
def root():
    return {
        "app": "ShikshaSetu API",
        "status": "online",
        "version": "1.0.0",
        "endpoints": [
            "GET  /syllabus",
            "GET  /syllabus/{class_id}",
            "GET  /lesson/{lesson_id}",
            "POST /voice/process",
            "GET  /voice/demo/{scenario_id}",
            "POST /teacher/corrections",
            "GET  /teacher/corrections",
            "POST /worksheets/generate",
            "GET  /worksheets"
        ]
    }

@app.get("/syllabus")
def get_all_syllabus():
    """
    Returns the complete list of classes and curriculum overview.
    """
    summary = []
    for cid, cdata in SYLLABUS_DATA.items():
        summary.append({
            "class_id": cid,
            "name": cdata["name"],
            "description": cdata["description"],
            "subjects": list(cdata["subjects"].keys())
        })
    return {"classes": summary}

@app.get("/syllabus/{class_id}")
def get_class_syllabus(class_id: int):
    """
    Returns the detailed curriculum for a specific class (1, 2, or 3).
    """
    class_data = SYLLABUS_DATA.get(class_id)
    if not class_data:
        raise HTTPException(status_code=404, detail=f"Class {class_id} not found in syllabus.")
    return class_data

@app.get("/lesson/{lesson_id}")
def get_lesson(lesson_id: str):
    """
    Searches across all classes and subjects for a specific lesson by ID.
    """
    # Search through classes
    for cid, cdata in SYLLABUS_DATA.items():
        for sname, sdata in cdata["subjects"].items():
            for chapter in sdata["chapters"]:
                for lesson in chapter["lessons"]:
                    # Match by id or suffix
                    if lesson["id"] == lesson_id or lesson_id in lesson["id"]:
                        return {
                            "class_id": cid,
                            "class_name": cdata["name"],
                            "subject": sname,
                            "chapter_id": chapter["id"],
                            "chapter_title": chapter["title"],
                            "lesson": lesson
                        }
    
    raise HTTPException(status_code=404, detail=f"Lesson with ID '{lesson_id}' not found.")

@app.post("/voice/process", response_model=VoiceResponse)
def process_voice(payload: VoiceProcessRequest):
    """
    Processes voice audio input.
    Currently returns the mirrored mock structure (recognized_text, translated_text, audio_file).
    When ready, plug in real Vosk / IndicTrans2 / VITS model inference here.
    """
    scen_id = payload.scenario_id if payload.scenario_id in VOICE_DEMO_SCENARIOS else 1
    scenario = VOICE_DEMO_SCENARIOS[scen_id]

    return VoiceResponse(
        recognized_text=scenario["recognized_text"],
        translated_text=scenario["translated_text"],
        audio_file=scenario["audio_file"],
        script=scenario["script"],
        confidence=scenario["confidence"]
    )

@app.get("/voice/demo/{scenario_id}", response_model=VoiceResponse)
def get_voice_demo_scenario(scenario_id: int):
    """
    Retrieves a specific pre-seeded demo voice scenario (1, 2, or 3).
    """
    if scenario_id not in VOICE_DEMO_SCENARIOS:
        raise HTTPException(
            status_code=404,
            detail=f"Scenario {scenario_id} not found. Available scenario IDs: {list(VOICE_DEMO_SCENARIOS.keys())}"
        )
    
    s = VOICE_DEMO_SCENARIOS[scenario_id]
    return VoiceResponse(
        recognized_text=s["recognized_text"],
        translated_text=s["translated_text"],
        audio_file=s["audio_file"],
        script=s["script"],
        confidence=s["confidence"]
    )

# In-memory storage for submitted teacher corrections
TEACHER_CORRECTIONS_STORE: List[Dict[str, Any]] = []

class TeacherCorrectionPayload(BaseModel):
    hindi_text: str
    original_santali: str
    corrected_santali: str
    created_at: Optional[str] = None

class TeacherCorrectionBatchRequest(BaseModel):
    corrections: List[TeacherCorrectionPayload]

@app.post("/teacher/corrections")
def submit_teacher_corrections(payload: TeacherCorrectionBatchRequest):
    """
    Receives pending teacher corrections from the ShikshaSetu mobile app sync service.
    """
    count = 0
    for item in payload.corrections:
        entry = item.model_dump()
        TEACHER_CORRECTIONS_STORE.append(entry)
        count += 1
    return {
        "status": "success",
        "synced_count": count,
        "total_corrections_stored": len(TEACHER_CORRECTIONS_STORE)
    }

@app.get("/teacher/corrections")
def get_teacher_corrections():
    """
    Returns all teacher corrections received so far.
    """
    return {
        "total": len(TEACHER_CORRECTIONS_STORE),
        "corrections": TEACHER_CORRECTIONS_STORE
    }

# ==========================================================
# AI Bilingual Worksheet Generation (Gemini API + FLN Curated)
# ==========================================================

WORKSHEETS_STORE: List[Dict[str, Any]] = []

class WorksheetGenerateRequest(BaseModel):
    classId: Optional[int] = None
    class_id: Optional[int] = None
    subject: str
    topic: str
    existingEnglishContent: Optional[str] = None
    existing_english_content: Optional[str] = None

class WorksheetGenerateResponse(BaseModel):
    id: str
    classId: int
    subject: str
    topic: str
    title: str
    englishContent: str
    santaliContent: str
    source: str
    createdAt: str


def generate_curated_fln_worksheet(class_id: int, subject: str, topic: str, context: Optional[str] = None) -> Dict[str, str]:
    """
    Curated educational FLN fallback generator for Classes 1-3.
    Produces authentic Ol Chiki characters and structured bilingual activities
    when GEMINI_API_KEY is not configured or during offline testing.
    """
    subject_norm = subject.lower().strip()
    topic_title = topic.strip().title()

    if "math" in subject_norm:
        title = f"Class {class_id} Math Practice: {topic_title}"
        if class_id == 1:
            english = (
                f"Topic: {topic_title}\n\n"
                "1. Count and write the total number:\n"
                "   🍎 🍎 🍎 🍎 = [   ]\n\n"
                "2. What number comes next?\n"
                "   1, 2, 3, 4, [   ]\n\n"
                "3. Draw lines to match the number with its quantity:\n"
                "   (a) 2  ----->  ⭐ ⭐ ⭐\n"
                "   (b) 3  ----->  ⭐ ⭐\n\n"
                "4. Circle the smaller number:\n"
                "   [ 2  |  5 ]"
            )
            santali = (
                f"ᱥᱟᱛᱟᱢ: {topic_title}\n\n"
                "᱑. ᱞᱮᱠᱷᱟᱭ ᱢᱮ ᱟᱨ ᱡᱚᱛᱚ ᱮᱞ ᱚᱞ ᱢᱮ:\n"
                "   🍎 🍎 🍎 🍎 = [   ]\n\n"
                "᱒. ᱤᱱᱟᱹ ᱛᱟᱭᱚᱢ ᱚᱠᱟ ᱮᱞ ᱦᱤᱡᱩᱜ-ᱟ?\n"
                "   ᱑, ᱒, ᱓, ᱔, [   ]\n\n"
                "᱓. ᱮᱞ ᱟᱨ ᱪᱤᱛᱟᱹᱨ ᱥᱟᱞᱟᱜ ᱛᱚᱞ ᱡᱚᱲᱟᱣ ᱢᱮ:\n"
                "   (ᱠ) ᱒  ----->  ⭐ ⭐ ⭐\n"
                "   (ᱠᱷ) ᱓  ----->  ⭐ ⭐\n\n"
                "᱔. ᱦᱩᱰᱤᱧ ᱮᱞ ᱜᱩᱞ ᱢᱮ:\n"
                "   [ ᱒  |  ᱕ ]"
            )
        elif class_id == 2:
            english = (
                f"Topic: {topic_title}\n\n"
                "1. Add the numbers:\n"
                "   4 + 3 = [   ]\n"
                "   6 + 2 = [   ]\n\n"
                "2. Subtract:\n"
                "   8 - 3 = [   ]\n\n"
                "3. Complete the skip-counting pattern by 2s:\n"
                "   2, 4, 6, [   ], 10\n\n"
                "4. Write the number name in words:\n"
                "   7 = ____________"
            )
            santali = (
                f"ᱥᱟᱛᱟᱢ: {topic_title}\n\n"
                "᱑. ᱮᱞ ᱠᱚ ᱡᱚᱲᱟᱣ ᱢᱮ:\n"
                "   ᱔ + ᱓ = [   ]\n"
                "   ᱖ + ᱒ = [   ]\n\n"
                "᱒. ᱜᱷᱟᱴᱟᱣ ᱢᱮ:\n"
                "   ᱘ - ᱓ = [   ]\n\n"
                "᱓. ᱵᱟᱨ-ᱵᱟᱨ ᱞᱮᱠᱷᱟ ᱯᱮᱨᱮᱡ ᱢᱮ:\n"
                "   ᱒, ᱔, ᱖, [   ], ᱑᱐\n\n"
                "᱔. ᱮᱞ ᱨᱮᱱᱟᱜ ᱧᱩᱛᱩᱢ ᱚᱞ ᱢᱮ:\n"
                "   ᱗ = ____________"
            )
        else:
            english = (
                f"Topic: {topic_title}\n\n"
                "1. Solve the addition and subtraction:\n"
                "   15 + 12 = [   ]\n"
                "   28 - 9 = [   ]\n\n"
                "2. Multiplication basics:\n"
                "   3 groups of 4 mangoes: 3 × 4 = [   ]\n\n"
                "3. Write the place value of 5 in 54:\n"
                "   Tens = [   ], Ones = [   ]\n\n"
                "4. Word Problem:\n"
                "   Raju has 6 pencils. Sita gave him 5 more. How many pencils does Raju have in total? [   ]"
            )
            santali = (
                f"ᱥᱟᱛᱟᱢ: {topic_title}\n\n"
                "᱑. ᱡᱚᱲᱟᱣ ᱟᱨ ᱜᱷᱟᱴᱟᱣ ᱯᱩᱨᱟᱹᱣ ᱢᱮ:\n"
                "   ᱑᱕ + ᱑᱒ = [   ]\n"
                "   ᱒᱘ - ᱙ = [   ]\n\n"
                "᱒. ᱜᱩᱬᱟᱹᱱ ᱞᱮᱠᱷᱟ:\n"
                "   ᱓ ᱜᱚᱴᱟᱝ ᱜᱩᱴ ᱔ ᱩᱞ ᱠᱟᱛᱮ: ᱓ × ᱔ = [   ]\n\n"
                "᱓. ᱕᱔ ᱨᱮ ᱕ ᱨᱮᱱᱟᱜ ᱴᱷᱟᱶ ᱢᱟᱹᱱ ᱚᱞ ᱢᱮ:\n"
                "   ᱜᱮᱞ = [   ], ᱢᱤᱫ = [   ]\n\n"
                "᱔. ᱞᱮᱠᱷᱟ ᱠᱩᱠᱞᱤ:\n"
                "   ᱨᱟᱡᱩ ᱴᱷᱮᱱ ᱖ ᱜᱚᱴᱟᱝ ᱯᱮᱱᱥᱤᱞ ᱛᱟᱦᱮᱸ ᱠᱟᱱᱟ᱾ ᱥᱤᱛᱟᱹ ᱟᱨᱦᱚᱸ ᱕ ᱜᱚᱴᱟᱝ ᱮᱢᱟᱫᱮᱭᱟ᱾ ᱡᱚᱛᱚᱛᱮ ᱛᱤᱱᱟᱹᱜ ᱦᱩᱭᱮᱱᱟ? [   ]"
            )
    elif "sci" in subject_norm or "evs" in subject_norm or "env" in subject_norm:
        title = f"Class {class_id} Science Exploration: {topic_title}"
        english = (
            f"Topic: {topic_title}\n\n"
            "1. Name two living things and two non-living things:\n"
            "   Living: ________________, ________________\n"
            "   Non-living: ________________, ________________\n\n"
            "2. Fill in the blanks with [Sun, Water, Roots]:\n"
            "   (a) Plants absorb water through their ____________.\n"
            "   (b) The ____________ gives us heat and daylight.\n\n"
            "3. Choose the correct domestic animal:\n"
            "   Which animal gives us milk? [ Tiger / Cow / Snake ]\n\n"
            "4. Match the sense organs to their functions:\n"
            "   Eyes   ----->   Smell\n"
            "   Nose   ----->   See\n"
            "   Ears   ----->   Hear"
        )
        santali = (
            f"ᱥᱟᱛᱟᱢ: {topic_title}\n\n"
            "᱑. ᱵᱟᱨᱭᱟ ᱡᱤᱣᱤᱭᱟᱱ ᱟᱨ ᱵᱟᱨᱭᱟ ᱵᱤᱱ-ᱡᱤᱣᱤᱭᱟᱱ ᱡᱤᱱᱤᱥ ᱨᱮᱱᱟᱜ ᱧᱩᱛᱩᱢ ᱚᱞ ᱢᱮ:\n"
            "   ᱡᱤᱣᱤᱭᱟᱱ: ________________, ________________\n"
            "   ᱵᱤᱱ-ᱡᱤᱣᱤᱭᱟᱱ: ________________, ________________\n\n"
            "᱒. ᱯᱮᱨᱮᱡ ᱢᱮ [ᱵᱮᱞᱟ, ᱫᱟᱜ, ᱨᱮᱦᱮᱫ]:\n"
            "   (ᱠ) ᱫᱟᱨᱮ ᱫᱚ ____________ ᱛᱮ ᱫᱟᱜ ᱥᱟᱵ ᱦᱟᱛᱟᱣᱟᱭ᱾\n"
            "   (ᱠᱷ) ____________ ᱫᱚ ᱟᱵᱚ ᱥᱤᱛᱩᱝ ᱟᱨ ᱢᱟᱨᱥᱟᱞ ᱮᱢᱟᱵᱚᱱᱟᱭ᱾\n\n"
            "᱓. ᱚᱲᱟᱜ ᱡᱤᱵᱽ ᱵᱟᱪᱷᱟᱣ ᱢᱮ:\n"
            "   ᱚᱠᱚᱭ ᱡᱤᱵᱽ ᱛᱳᱣᱟ ᱮᱢᱟᱵᱚᱱᱟᱭ? [ ᱛᱟᱹᱨᱩᱵ / ᱜᱟᱹᱭ / ᱵᱤᱧ ]\n\n"
            "᱔. ᱦᱚᱲᱢᱚ ᱨᱮᱱᱟᱜ ᱚᱝᱜᱚ ᱠᱚ ᱠᱟᱹᱢᱤ ᱥᱟᱞᱟᱜ ᱛᱚᱞ ᱡᱚᱲᱟᱣ ᱢᱮ:\n"
            "   ᱢᱮᱫ    ----->   ᱥᱚ\n"
            "   ᱢᱩᱸ     ----->   ᱧᱮᱞ\n"
            "   ᱞᱩᱛᱩᱨ   ----->   ᱟᱸᱡᱚᱢ"
        )
    else:
        title = f"Class {class_id} Language Worksheet: {topic_title}"
        english = (
            f"Topic: {topic_title}\n\n"
            "1. Read aloud and write the missing letters:\n"
            "   (a) B __ K  (Book)\n"
            "   (b) T R __ E  (Tree)\n"
            "   (c) S U __  (Sun)\n\n"
            "2. Write the opposite words:\n"
            "   (a) Big   ×  ____________ [Small / Long]\n"
            "   (b) Day   ×  ____________ [Night / Sun]\n"
            "   (c) Up    ×  ____________ [Down / High]\n\n"
            "3. Make a simple sentence with 'School':\n"
            "   ____________________________________________________\n\n"
            "4. Match the rhyming words:\n"
            "   Cat   ----->   Star\n"
            "   Far   ----->   Bat\n"
            "   Pen   ----->   Hen"
        )
        santali = (
            f"ᱥᱟᱛᱟᱢ: {topic_title}\n\n"
            "᱑. ᱟᱠᱷᱚᱨ ᱯᱮᱨᱮᱡ ᱢᱮ ᱟᱨ ᱯᱟᱲᱦᱟᱣ ᱢᱮ:\n"
            "   (ᱠ) ᱯ __ ᱛᱷᱤ  (ᱯᱩᱛᱷᱤ)\n"
            "   (ᱠᱷ) ᱫ __ ᱨᱮ  (ᱫᱟᱨᱮ)\n"
            "   (ᱜ) ᱵ __ ᱞᱟ  (ᱵᱮᱞᱟ)\n\n"
            "᱒. ᱩᱞᱴᱟᱹ ᱟᱹᱲᱟᱹ ᱚᱞ ᱢᱮ:\n"
            "   (ᱠ) ᱢᱟᱨᱟᱝ  ×  ____________ [ᱦᱩᱰᱤᱧ / ᱡᱤᱞᱤᱧ]\n"
            "   (ᱠᱷ) ᱥᱤᱧ    ×  ____________ [ᱧᱤᱫᱟᱹ / ᱵᱮᱞᱟ]\n"
            "   (ᱜ) ᱪᱮᱛᱟᱱ   ×  ____________ [ᱞᱟᱛᱟᱨ / ᱩᱥᱩᱞ]\n\n"
            "᱓. 'ᱟᱥᱲᱟ' ᱟᱹᱲᱟᱹ ᱛᱮ ᱢᱤᱫᱴᱟᱝ ᱟᱹᱭᱟᱹᱛ ᱵᱮᱱᱟᱣ ᱢᱮ:\n"
            "   ____________________________________________________\n\n"
            "᱔. ᱢᱤᱫ ᱟᱲᱟᱝ ᱟᱹᱲᱟᱹ ᱛᱚᱞ ᱡᱚᱲᱟᱣ ᱢᱮ:\n"
            "   ᱫᱟᱨᱮ   ----->   ᱯᱟᱨᱮ\n"
            "   ᱦᱟᱥᱟ   ----->   ᱠᱟᱥᱟ\n"
            "   ᱫᱟᱜ    ----->   ᱥᱟᱜ"
        )

    return {
        "title": title,
        "english_content": english,
        "santali_content": santali
    }


SUPPORTED_GEMINI_MODELS = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-2.0-flash-exp",
    "gemini-2.5-pro",
]


def generate_gemini_worksheet(class_id: int, subject: str, topic: str, context: Optional[str] = None) -> Optional[Dict[str, str]]:
    """
    Invokes the Google Gemini API to generate a bilingual worksheet.
    Returns parsed dictionary or None if key is absent/call fails.
    """
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        return None

    prompt = f"""You are an expert bilingual curriculum developer specializing in Indian Foundational Literacy and Numeracy (FLN) for primary school children (Classes 1 to 3) in tribal regions of India.
Create an engaging bilingual classroom practice worksheet for:
- Grade: Class {class_id}
- Subject: {subject}
- Topic: {topic}
{"- Textbook lesson context: " + context if context else ""}

Requirements:
1. Title: Provide an encouraging, child-friendly title in English and Ol Chiki.
2. English Content: Provide 3 to 4 clear, age-appropriate questions/activities (e.g. counting, fill-in-the-blanks, matching, simple sentence completion). Keep the vocabulary simple and suitable for Class {class_id}.
3. Santali Content: Provide the authentic Santali equivalent written in OL CHIKI SCRIPT (ᱚᱞ ᱪᱤᱠᱤ) matching each question and instruction in the English content. Do not use Latin or Devanagari for Santali, use ONLY Ol Chiki script.

Return ONLY a valid JSON object without markdown fences, in this exact format:
{{
  "title": "Title in English / Santali",
  "english_content": "1. ...\\n2. ...",
  "santali_content": "᱑. ...\\n᱒. ..."
}}
"""

    # 1. Primary: Official modern Google GenAI SDK (google-genai)
    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key)
        for model_name in SUPPORTED_GEMINI_MODELS:
            try:
                res = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        temperature=0.3,
                    ),
                )
                if res and res.text:
                    raw_text = res.text.strip()
                    if raw_text.startswith("```"):
                        raw_text = re.sub(r"^```(?:json)?\n?", "", raw_text)
                        raw_text = re.sub(r"\n?```$", "", raw_text)
                    data = json.loads(raw_text.strip())
                    if "title" in data and "english_content" in data and "santali_content" in data:
                        print(f"[GenAI] Successfully generated worksheet using model: {model_name}")
                        return {
                            "title": data["title"],
                            "english_content": data["english_content"],
                            "santali_content": data["santali_content"]
                        }
            except Exception as model_err:
                print(f"[GenAI] Model {model_name} failed: {model_err}")
                continue
    except ImportError as ie:
        print(f"[GenAI] google-genai SDK not present, trying legacy: {ie}")
    except Exception as e:
        print(f"[GenAI] Client error: {e}")

    # 2. Fallback: Legacy google-generativeai package if installed
    try:
        import google.generativeai as legacy_genai
        legacy_genai.configure(api_key=api_key)
        for model_name in SUPPORTED_GEMINI_MODELS:
            try:
                model = legacy_genai.GenerativeModel(model_name)
                res = model.generate_content(
                    prompt,
                    generation_config={"response_mime_type": "application/json"}
                )
                if res and res.text:
                    raw_text = res.text.strip()
                    if raw_text.startswith("```"):
                        raw_text = re.sub(r"^```(?:json)?\n?", "", raw_text)
                        raw_text = re.sub(r"\n?```$", "", raw_text)
                    data = json.loads(raw_text.strip())
                    if "title" in data and "english_content" in data and "santali_content" in data:
                        print(f"[Legacy GenAI] Successfully generated worksheet using model: {model_name}")
                        return {
                            "title": data["title"],
                            "english_content": data["english_content"],
                            "santali_content": data["santali_content"]
                        }
            except Exception as legacy_model_err:
                print(f"[Legacy GenAI] Model {model_name} failed: {legacy_model_err}")
                continue
    except Exception as e2:
        print(f"[Legacy GenAI] Fallback failed: {e2}")

    return None


@app.post("/worksheets/generate", response_model=WorksheetGenerateResponse)
def generate_worksheet(payload: WorksheetGenerateRequest):
    """
    Generates an on-demand bilingual worksheet (English + Santali in Ol Chiki).
    Uses Gemini API if configured, with automatic fallback to curated FLN content.
    """
    cid = payload.classId or payload.class_id or 1
    subj = payload.subject.strip()
    tpc = payload.topic.strip()
    ctx = payload.existingEnglishContent or payload.existing_english_content

    if not tpc:
        raise HTTPException(status_code=400, detail="Topic is required to generate a worksheet.")

    # Attempt Gemini generation
    gemini_result = generate_gemini_worksheet(cid, subj, tpc, ctx)
    if gemini_result:
        result = gemini_result
        source = "gemini"
    else:
        result = generate_curated_fln_worksheet(cid, subj, tpc, ctx)
        source = "curated_fln"

    ws_id = f"ws_{cid}_{uuid.uuid4().hex[:8]}"
    created_at = datetime.datetime.now(datetime.timezone.utc).isoformat()

    response_data = WorksheetGenerateResponse(
        id=ws_id,
        classId=cid,
        subject=subj,
        topic=tpc,
        title=result["title"],
        englishContent=result["english_content"],
        santaliContent=result["santali_content"],
        source=source,
        createdAt=created_at
    )

    WORKSHEETS_STORE.append(response_data.model_dump())
    return response_data


@app.get("/worksheets")
def get_all_worksheets():
    """
    Returns all worksheets generated on the backend during this session.
    """
    return {
        "total": len(WORKSHEETS_STORE),
        "worksheets": WORKSHEETS_STORE
    }

