import pandas as pd
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.linear_model import LogisticRegression, LinearRegression

class ModelRegistry:
    def __init__(self):
        print("Loading NLP Model (Sentence Transformers)...")
        # Load a small, fast model for Hindi & English semantic similarity
        self.sentence_model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')

        # Department names (canonical)
        self.departments = [
            "Agriculture",
            "Revenue",
            "Education",
            "Panchayat",
            "Electricity",
            "Social Welfare",
            "Health",
            "Water Supply",
        ]

        # Bilingual descriptive labels for better multilingual semantic matching
        self.department_descriptions = [
            "Agriculture farming crops farmer insurance किसान कृषि फसल बीमा खेती",
            "Revenue land records tax ration card भूमि राजस्व कर राशन कार्ड भू-अभिलेख",
            "Education school college scholarship student शिक्षा विद्यालय छात्रवृत्ति स्कूल कॉलेज",
            "Panchayat village road infrastructure drain sanitation ग्राम पंचायत सड़क नाली स्वच्छता",
            "Electricity power supply transformer disruption बिजली विद्युत ट्रांसफार्मर बिजली कटौती",
            "Social Welfare pension disability widow old age benefit पेंशन समाज कल्याण विकलांग विधवा वृद्धावस्था सामाजिक सुरक्षा",
            "Health hospital medicine doctor healthcare स्वास्थ्य अस्पताल दवाई डॉक्टर चिकित्सा",
            "Water Supply drinking water pipeline pump handpump borewell जल आपूर्ति पानी नल हैंडपंप बोरवेल कुआं",
        ]

        # Embed the descriptive labels for better matching
        self.dept_embeddings = self.sentence_model.encode(self.department_descriptions)

        # Train mock SLA Predictor (Linear Regression)
        # Input features: [Urgency (1-5), Dept Index]
        self.sla_model = LinearRegression()
        X = np.array([[1, 0], [5, 4], [3, 2], [5, 0], [2, 5], [4, 1], [3, 6], [2, 7]])
        y = np.array([7, 2, 4, 1, 5, 3, 4, 6])  # Days
        self.sla_model.fit(X, y)

        # Train a mock Logistic Regression for CSC Rejection risk
        # Features: [mismatch_count, income_diff, doc_completeness (0 or 1)]
        self.csc_risk_model = LogisticRegression()
        X_risk = np.array([[0, 0, 1], [3, 5000, 0], [1, 2000, 1], [4, 10000, 0]])
        y_risk = np.array([0, 1, 0, 1])  # 0 = approve, 1 = reject
        self.csc_risk_model.fit(X_risk, y_risk)

ml_registry = ModelRegistry()
