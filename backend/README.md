# ShikshaSetu FastAPI Backend

A lightweight, asynchronous backend microservice for **ShikshaSetu** providing syllabus distribution and voice processing endpoints.

---

## 📌 Architecture Note

> [!NOTE]
> **Mobile App Independence**:
> The React Native mobile app is **NOT required to call this backend yet**. The mobile app currently runs the exact same mock pipeline and syllabus data locally on-device via `src/services/voicePipeline/` and `expo-sqlite`.
> 
> This backend exists so you can test network endpoints independently and seamlessly point the mobile app's API client to this backend once you transition from local mocks to heavy on-server or hybrid AI inference models (e.g. Vosk STT, IndicTrans2, and VITS TTS).

---

## 🚀 Quickstart: Running Locally

### 1. Create and Activate a Python Virtual Environment
```bash
cd backend
python -m venv venv

# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1

# On Windows (cmd):
venv\Scripts\activate.bat

# On Linux / macOS:
source venv/bin/activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Start the FastAPI Server
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Once running:
- **API Root**: [http://localhost:8000/](http://localhost:8000/)
- **Interactive Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc Documentation**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 📡 Available Endpoints

| Method | Endpoint | Description | Sample Response / Body |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | API Health & status check | `{"app": "ShikshaSetu API", "status": "online"}` |
| `GET` | `/syllabus` | Overview of all classes and available subjects | List of classes (Class 1, 2, 3) |
| `GET` | `/syllabus/{class_id}` | Detailed curriculum, chapters, and lessons for a class | JSON object containing subjects & chapters |
| `GET` | `/lesson/{lesson_id}` | Lookup a specific lesson by ID | Lesson content and chapter metadata |
| `POST` | `/voice/process` | Processes voice audio input | Request: `{"scenario_id": 1}`<br>Returns: `{ recognized_text, translated_text, audio_file, script, confidence }` |
| `GET` | `/voice/demo/{scenario_id}` | Returns a pre-seeded demo voice scenario (1, 2, or 3) | Same schema as `/voice/process` |

---

## 🧪 Testing with cURL / PowerShell

### 1. Test Syllabus by Class:
```bash
curl http://localhost:8000/syllabus/1
```

### 2. Test Voice Processing Endpoint:
```bash
curl -X POST http://localhost:8000/voice/process \
  -H "Content-Type: application/json" \
  -d '{"scenario_id": 1}'
```

### 3. Test Voice Demo Scenario:
```bash
curl http://localhost:8000/voice/demo/2
```

---

## 🔄 Moving from Local Mocks to Real Model Inference Later

When ready to connect real AI/ML models:
1. In `backend/main.py`, replace the mock scenario lookup in `process_voice()` with your model inference calls (e.g. Vosk speech recognizer, IndicTrans2 tokenizer/model, and TTS vocoder).
2. In the React Native app, update `src/services/voiceService.ts` to fetch from `http://<your-server-ip>:8000/voice/process`.
