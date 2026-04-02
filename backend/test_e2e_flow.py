import os
import requests
import pandas as pd
import numpy as np
import joblib
from sklearn.ensemble import RandomForestClassifier

BASE_URL = "http://localhost:8000/api"

def generate_dummy_data():
    print("Generating dummy dataset and model...")
    np.random.seed(42)
    # 500 rows of dummy data
    n = 500
    df = pd.DataFrame({
        "age": np.random.randint(18, 70, n),
        "income": np.random.randint(20000, 150000, n),
        "gender": np.random.choice(["Male", "Female"], n),
        "approved": np.random.choice([0, 1], n, p=[0.7, 0.3]) # Target
    })
    
    # Let's add structural bias where Female getting approved is unlikely
    df.loc[df["gender"] == "Female", "approved"] = np.random.choice([0, 1], len(df[df["gender"] == "Female"]), p=[0.9, 0.1])
    
    df.to_csv("dummy_dataset.csv", index=False)
    
    # Train naive model
    X = pd.get_dummies(df.drop(columns=["approved"]))
    y = df["approved"]
    
    model = RandomForestClassifier(n_estimators=10, random_state=42)
    model.fit(X, y)
    
    # Save the model
    # We must save the model knowing it expects the OHE features (age, income, gender_Female, gender_Male)
    joblib.dump(model, "dummy_model.pkl")
    return "dummy_dataset.csv", "dummy_model.pkl"

def run_end_to_end():
    dataset_path, model_path = generate_dummy_data()

    print("\n[1] Uploading Files...")
    with open(dataset_path, "rb") as d_file, open(model_path, "rb") as m_file:
        files = {
            "dataset": ("dummy_dataset.csv", d_file, "text/csv"),
            "model": ("dummy_model.pkl", m_file, "application/octet-stream")
        }
        resp = requests.post(f"{BASE_URL}/upload/", files=files)
        
    if resp.status_code != 200:
        print("Upload Failed:", resp.text)
        return
        
    upload_data = resp.json()
    upload_id = upload_data["upload_id"]
    print(f"✅ Upload successful. Upload ID: {upload_id}")

    print("\n[2] Running Bias Detection...")
    detect_payload = {
        "upload_id": upload_id,
        "target_column": "approved",
        "sensitive_columns": ["gender"]
    }
    resp = requests.post(f"{BASE_URL}/bias/detect", json=detect_payload)
    if resp.status_code != 200:
        print("Detection Failed:", resp.text)
        return
        
    report_data = resp.json()
    report_id = report_data["report_id"]
    print(f"✅ Detection successful. Report ID: {report_id}")
    print(f"   Bias Present: {report_data['bias_present']}")
    print(f"   Severity Score: {report_data['bias_severity_score']}")

    print("\n[3] Getting Mitigation Recommendation...")
    resp = requests.post(f"{BASE_URL}/mitigation/recommend/{report_id}")
    if resp.status_code != 200:
        print("Recommendation Failed:", resp.text)
    else:
        rec_data = resp.json()
        print(f"✅ Recommendation successful.")
        print(f"   Recommended Strategy: {rec_data.get('recommended_strategy')}")
        print(f"   Explanation: {rec_data.get('explanation')}")

    print("\n[4] Applying Mitigation (Reweighting)...")
    # We choose reweighting as an example strategy test
    resp = requests.post(f"{BASE_URL}/mitigation/apply/reweighting/{report_id}")
    if resp.status_code != 200:
        print("Mitigation Failed:", resp.text)
        return
        
    mit_data = resp.json()
    print(f"✅ Mitigation successful! Mitigation ID: {mit_data.get('mitigation_id')}")
    print(f"   Improvement Score: {mit_data.get('improvement_score')}")
    print(f"   Rows Before/After: {mit_data.get('rows_before')} -> {mit_data.get('rows_after')}")

if __name__ == "__main__":
    try:
        run_end_to_end()
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to server. Make sure you run `uvicorn app.main:app` first!")
