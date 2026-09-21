# 🧠 Mental Health Signal

### Student Wellness Analytics powered by Machine Learning

**Mental Health Signal** is an AI-powered student wellness analytics application that uses machine learning to analyze academic habits, digital behavior, lifestyle patterns, sleep, physical activity, and stress levels to generate a predicted mental health score.

## 🚀 Live Demo

### [Try Mental Health Signal →](https://mansik-health-1.onrender.com/)

---

## ✨ What It Does

Mental Health Signal takes a set of student behavioral and lifestyle inputs and sends them to a **FastAPI-powered machine learning backend**.

The trained ML model processes the information and returns a predicted mental health score, which is presented through an interactive web interface.

```text
Student Information
        ↓
Academic & Lifestyle Data
        ↓
Digital Behavior
        ↓
Stress & Sleep Information
        ↓
FastAPI Backend
        ↓
Machine Learning Model
        ↓
Predicted Mental Health Score
        ↓
Student Wellness Dashboard
```

---

## 🧩 Key Features

* 🧠 Machine-learning-based mental health score prediction
* 📊 Student wellness analytics
* 📚 Academic behavior analysis
* 📱 Social-media and digital-usage analysis
* 😴 Sleep pattern analysis
* 🏃 Physical activity analysis
* 😟 Stress-level assessment
* ⚡ FastAPI REST API
* 🌐 Interactive web frontend
* 📱 Responsive design
* ✅ Input validation with Pydantic
* ☁️ Deployed with Render

---

## 🛠️ Tech Stack

| Layer               | Technologies            |
| ------------------- | ----------------------- |
| Frontend            | HTML5, CSS3, JavaScript |
| Backend             | Python, FastAPI         |
| Data Processing     | Pandas, NumPy           |
| Machine Learning    | Scikit-learn            |
| Model Serialization | Joblib                  |
| Server              | Uvicorn                 |
| Deployment          | Render                  |

---

## 🔬 Assessment Factors

The application considers multiple aspects of student life.

### 👤 Personal

* Age
* Gender
* Country
* Academic level

### 📱 Digital Behavior

* Most-used social platform
* Purpose of social-media usage
* Average daily usage
* Daily device unlocks

### 📚 Academic

* Study hours

### 🏃 Lifestyle

* Physical activity
* Sleep duration

### 😟 Stress

* Low
* Medium
* High
* Very High

---

## 🏗️ Architecture

```text
                 ┌─────────────────────┐
                 │       Student       │
                 │       Browser       │
                 └──────────┬──────────┘
                            │
                            ▼
                 ┌─────────────────────┐
                 │   HTML / CSS / JS   │
                 │      Frontend       │
                 └──────────┬──────────┘
                            │
                       POST /predict
                            │
                            ▼
                 ┌─────────────────────┐
                 │       FastAPI       │
                 │       Backend       │
                 └──────────┬──────────┘
                            │
                            ▼
                 ┌─────────────────────┐
                 │  Data Preparation   │
                 │   Pandas / NumPy    │
                 └──────────┬──────────┘
                            │
                            ▼
                 ┌─────────────────────┐
                 │    ML Prediction    │
                 │ Mental_Health_Model │
                 └──────────┬──────────┘
                            │
                            ▼
                 ┌─────────────────────┐
                 │ Predicted Wellness  │
                 │       Score         │
                 └─────────────────────┘
```

---

## 🔌 API

### `POST /predict`

Example request:

```json
{
  "age": 20,
  "gender": "Male",
  "country": "India",
  "academic_level": "Undergraduate",
  "most_used_platform": "YouTube",
  "purpose_of_use": "Education",
  "avg_daily_usage_hours": 5.5,
  "daily_unlocks": 40,
  "study_hours": 7,
  "physical_activity_hours": 1.5,
  "sleep_hours_per_night": 7,
  "stress_level": "Medium"
}
```

Example response:

```json
{
  "predicted_mental_health_score": 72.35
}
```

---

## 📂 Project Structure

```text
Mansik-Health/
│
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── script.js
│
├── main.py
├── Mental_Health_Model.pkl
├── requirements.txt
└── README.md
```

---

## 🚀 Run Locally

Clone the repository:

```bash
git clone https://github.com/V-Madara/Mansik-Health.git
cd Mansik-Health
```

Create a virtual environment:

```bash
python -m venv .venv
```

Activate it on Windows:

```powershell
.venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start the backend:

```bash
uvicorn main:app --reload
```

Open the application:

```text
http://127.0.0.1:8000
```

FastAPI documentation:

```text
http://127.0.0.1:8000/docs
```

---

## 🔮 Future Improvements

* 📈 Historical wellness tracking
* 📊 Advanced analytics dashboard
* 📑 PDF assessment reports
* 👤 User authentication
* 📱 Mobile/PWA support
* 🤖 Model comparison
* 📉 Model performance dashboard
* 🔐 Production-level API security
* ☁️ Improved cloud deployment
* 🧠 Additional wellness indicators

---

## ⚠️ Disclaimer

Mental Health Signal is an **educational machine-learning project**.

The generated score represents a model prediction based on the supplied input data. It is **not a medical diagnosis**, psychological assessment, or substitute for professional healthcare.

---

## 👨‍💻 Author

### Vishal Kumar

Built to explore the complete workflow of an ML-powered web application:

**Data → Machine Learning → FastAPI → Frontend → Deployment**

---

## ⭐ Support

If you find **Mental Health Signal** interesting, consider giving the repository a ⭐.

> 🧠 **Mental Health Signal — Turning student behavioral data into machine-learning-powered wellness insights.**
