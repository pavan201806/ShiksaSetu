from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any, List

from data import SYLLABUS_DATA, VOICE_DEMO_SCENARIOS

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
    recognized_text: string = None
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
            "GET  /voice/demo/{scenario_id}"
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
