# INTELMAP

## From Multimodal Signals to Geospatial Emergency Insights

**INTELMAP** is a multimodal crisis intelligence platform that transforms unstructured emergency signals into structured, explainable, and geospatially actionable insights for disaster response teams. The system performs real-time image analysis, text understanding, sensor data fusion, crisis classification, and coordinated response planning.

---

## Architecture Overview

INTELMAP follows a modular, scalable pipeline:

```
Multimodal Inputs
   ├── Flood Image
   ├── Emergency Text
   └── Sensor Data
          ↓
AI Processing Layer
   ├── Image Analysis
   ├── Text Reasoning
   ├── Data Fusion
   ├── Severity Scoring
   └── Location Inference
          ↓
Structured Intelligence Output
   ├── Crisis Type
   ├── Severity Level
   ├── Resource Allocation
   ├── Risk Zones
   └── Confidence Score
          ↓
Action Layer
   ├── Rescue Plan (JSON)
   ├── Voice Briefing
   └── Coordination Dashboard
```

---

## Core Technologies

- **Python:** 3.9+
- **Streamlit:** Frontend UI
- **REST APIs**
- **Multimodal Reasoning:** using Google Gemini
- **Voice Briefing Generation System**
- **JSON-based Coordination Output Format**

---

## Project Structure

```
intelmap/
│
├── app.py                        # Main Streamlit application
├── services/
│   ├── gemini_service.py         # AI reasoning layer
│   ├── voice_service.py          # Voice generation logic
│
├── utils/
│   ├── scoring.py                # Severity scoring logic
│   ├── formatter.py              # Structured JSON output
│
├── assets/                       # Images / media
├── requirements.txt
├── .env.example
└── README.md
```

---

## Features

- **Multimodal Data Fusion:**
  - Image, text, and sensor signals processed together
  - Context-aware crisis reasoning
  - Single unified intelligence output

- **Crisis Classification:**
  - Automatic detection of crisis type
  - Severity scoring (Low / Moderate / High / Critical)
  - Confidence estimation

- **Explainable Intelligence:**
  - Human-readable reasoning
  - Justification for resource recommendations
  - Transparent decision pipeline

- **Resource Planning:**
  - Rescue units estimation
  - Medical support suggestion
  - Priority ranking

- **Structured Output:**
  - Example JSON response:
    ```json
    {
      "crisis_type": "Flood",
      "severity": "High",
      "estimated_stranded": 15,
      "recommended_resources": {
        "rescue_boats": 3,
        "medical_units": 1
      },
      "priority": "Elderly evacuation",
      "confidence": "92%"
    }
    ```

---

## Installation

1. **Clone Repository:**
   ```bash
   git clone https://github.com/your-username/intelmap.git
   cd intelmap
   ```

2. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure Environment Variables:**
   Create a `.env` file with the following keys:
   ```
   GEMINI_API_KEY=your_api_key_here
   VOICE_API_KEY=your_voice_key_here
   ```

---

## Running the Application

```bash
streamlit run app.py
```

Open the local server URL displayed in your terminal.

---

## Example Workflow

1. Upload a flood image
2. Enter emergency text (e.g., stranded civilians)
3. Add rainfall and river-level data
4. System performs multimodal reasoning
5. Structured rescue plan is generated
6. Voice briefing is created
7. Output is ready for coordination team

---

## Design Principles

- Real-time decision support
- Explainability-first AI
- Modular expansion
- Geospatial readiness
- Human-in-the-loop compatibility

---

## Scalability Roadmap

- Satellite imagery ingestion
- IoT sensor streaming
- Real-time GIS dashboards
- National emergency integration
- Multilingual emergency voice output

---

## Use Cases

- Flood response coordination
- Wildfire incident analysis
- Earthquake damage assessment
- Urban emergency management
- National disaster control centers

---

## Research Alignment

INTELMAP aligns with:

- Multimodal AI reasoning systems
- Explainable AI frameworks
- Decision-support systems
- Crisis informatics
- Geospatial intelligence pipelines

---
