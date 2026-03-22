# 🏛 NagarikAI – Multimodal Governance Intelligence Engine

## 📌 Project Description

NagarikAI is an AI-powered governance intelligence platform designed to enhance the Chhattisgarh e-District ecosystem. It integrates multimodal AI capabilities including text, voice, and video processing to improve beneficiary identification, grievance resolution, and citizen service delivery. 

The system connects fragmented government datasets, automatically identifies eligible citizens for welfare schemes, classifies and routes complaints using NLP, and assists CSC operators with intelligent validation. By introducing an AI intelligence layer over existing systems, NagarikAI enables faster decision-making, reduces delays, improves transparency, and ensures inclusive access to government services, especially for rural and digitally less-literate populations.

---

# 🚀 Features

* Proactive Beneficiary Discovery Engine
* AI-based Grievance Classification & Routing
* Voice & Video Complaint Processing (Speech-to-Text)
* CSC Operator AI Copilot (Validation + Prediction)
* Real-time Governance Dashboard
* Multilingual Complaint Understanding
* Fraud Detection & Risk Analysis

---

# 🧠 System Architecture (Prototype)

```
Citizen / CSC Portal
        ↓
Frontend (Next.js / React)
        ↓
Backend API (FastAPI)
        ↓
=====================================
        AI Intelligence Layer
-------------------------------------
 Speech-to-Text (Whisper)
 NLP Complaint Analysis
 Department Classification
 Risk Prediction Engine
=====================================
        ↓
MongoDB Database
        ↓
Officer Assignment System
        ↓
District Dashboard → State Dashboard
```

---

# 👥 User Roles

## 🏛 Super Admin

* System control & governance monitoring
* Policy enforcement
* Officer assignment

## 🏢 District Officer

* Complaint handling & escalation
* Monitor district performance

## 🖥 CSC Operator

* Application submission
* Document verification
* Citizen assistance

## 📊 Analyst

* Data insights & reporting

## 👤 Citizen

* Submit complaints (text/voice/video)
* Apply for schemes
* Track status

---

# ⚙️ Tech Stack

## Frontend

```
Next.js
React.js
Tailwind CSS
```

## Backend

```
FastAPI
Python
Uvicorn
```

## Database

```
MongoDB
```

## AI / ML

```
OpenAI Whisper (Speech-to-Text)
Sentence Transformers
Scikit-learn
RapidFuzz
```

## Data Processing

```
Pandas
NumPy
```

---

# 🔄 Workflow

```
1. Citizen submits complaint (Text / Voice / Video)
2. Audio extracted from video
3. Speech → Text conversion (Whisper)
4. NLP analyzes complaint
5. Department classified
6. Stored in MongoDB
7. Assigned to Officer
8. Dashboard updated in real-time
```

---

# 📦 Installation & Setup

## 1. Clone Repository

```
git clone https://github.com/your-repo/nagarikai.git
cd nagarikai
```

## 2. Backend Setup

```
cd backend
python -m venv venv
venv\Scripts\activate   # Windows
pip install -r requirements.txt
uvicorn main:app --reload
```

## 3. Frontend Setup

```
cd frontend
npm install
npm run dev
```

---

# 📊 Impact

## Citizens

* Faster grievance resolution
* Voice-based accessibility
* Real-time updates

## CSC Operators

* Reduced rejection rates
* Smart validation

## Government

* Increased scheme coverage
* Data-driven decisions
* Improved transparency

---

# 🔐 Security

* Role-based access control
* Secure API endpoints
* Fraud detection mechanisms

---

# 🚀 Prototype Status

```
✔ Working backend (FastAPI)
✔ AI Speech-to-Text integration
✔ NLP classification system
✔ MongoDB connected
✔ Role-based dashboards
```

---

# 🔮 Future Scope

* Mobile app development
* Integration with real government APIs
* Regional language expansion
* Blockchain for transparency

---

# 👨‍💻 Team

Team TechNagrik
* Mandeep Kumar
* Srishti Anand
* Shyamali Samant
* Roshan Sahu

---

# ⭐ Final Note

NagarikAI is not just a portal — it is a next-generation AI governance engine designed to make public service delivery smarter, faster, and more inclusive.
