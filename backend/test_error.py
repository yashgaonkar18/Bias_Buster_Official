import os
import requests
import json

BASE_URL = "http://localhost:8000/api"

dataset_path = r"C:\Users\Yash Gaonkar\Downloads\adult.csv"
model_path = r"C:\Users\Yash Gaonkar\Downloads\adult_income_pipeline.pkl"

def run_end_to_end():
    print("\n[1] Uploading Files...")
    with open(dataset_path, "rb") as d_file, open(model_path, "rb") as m_file:
        files = {
            "dataset_file": ("adult.csv", d_file, "text/csv"),
            "model_file": ("adult_income_pipeline.pkl", m_file, "application/octet-stream")
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
        "target_column": "income",
        "sensitive_columns": ["gender", "race"]
    }
    resp = requests.post(f"{BASE_URL}/bias/detect", json=detect_payload)
    if resp.status_code != 200:
        print("Detection Failed:", resp.text)
        return
        
    report_data = resp.json()
    report_id = report_data["report_id"]
    print(f"✅ Detection successful. Report ID: {report_id}")
    
    audit = report_data.get('sensitive_audit', {})
    ranking = sorted(audit.keys(), key=lambda k: audit[k].get("bias_severity_score", 0), reverse=True)
    scores = {k: audit[k].get("bias_severity_score", 0) for k in audit.keys()}
    
    print("\n[3] Applying Iterative Mitigation (smote)...")
    
    iterative_payload = {
        "sensitive_attributes": ["gender", "race"],
        "bias_ranking": ranking,
        "bias_scores": scores
    }
    
    resp = requests.post(
        f"{BASE_URL}/mitigation/apply/smote/{report_id}",
        json=iterative_payload
    )
    
    if resp.status_code != 200:
        print("Mitigation Failed (smote):", resp.text)
        return
        
    mit_data = resp.json()
    print(f"\n✅ Mitigation successful! Iterative: {mit_data.get('is_iterative')}")

if __name__ == "__main__":
    run_end_to_end()
