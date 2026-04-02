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
            "dataset": ("adult.csv", d_file, "text/csv"),
            "model": ("adult_income_pipeline.pkl", m_file, "application/octet-stream")
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
        "target_column": "income", # income
        "sensitive_columns": ["gender", "race"] # using both attributes
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
    
    audit = report_data.get('sensitive_audit', {})
    print(f"   Audit: {list(audit.keys())}")
    
    # create ranking based on scores
    ranking = sorted(audit.keys(), key=lambda k: audit[k].get("bias_severity_score", 0), reverse=True)
    scores = {k: audit[k].get("bias_severity_score", 0) for k in audit.keys()}
    
    print("\n[3] Applying Iterative Mitigation (Reweighting)...")
    
    iterative_payload = {
        "sensitive_attributes": ["gender", "race"],
        "bias_ranking": ranking,
        "bias_scores": scores
    }
    print(f"Sending payload: {json.dumps(iterative_payload, indent=2)}")
    
    resp = requests.post(
        f"{BASE_URL}/mitigation/apply/reweighting/{report_id}",
        json=iterative_payload
    )
    
    if resp.status_code != 200:
        print("Mitigation Failed:", resp.text)
        return
        
    mit_data = resp.json()
    print(f"\n✅ Mitigation successful! Mitigation ID: {mit_data.get('mitigation_id')}")
    print(f"   Iterative Mode: {mit_data.get('is_iterative')}")
    print(f"   Improvement Score: {mit_data.get('improvement_score')}")
    print(f"   Rows Before/After: {mit_data.get('rows_before')} -> {mit_data.get('rows_after')}\n")
    print("Step-by-Step Mitigation Log:")
    for i, step in enumerate(mit_data.get("mitigation_log", []), 1):
        if step['applied']:
            before_sev = calculate_severity_from_metrics(step['before'])
            after_sev = calculate_severity_from_metrics(step['after'])
            print(f"   [{i}] Attribute: '{step['attribute']}' | Applied | Severity: {before_sev:.2f} -> {after_sev:.2f}")
        else:
            print(f"   [{i}] Attribute: '{step['attribute']}' | Skipped | Reason: {step.get('reason')}")

def calculate_severity_from_metrics(metrics):
    dpd = metrics.get('fairness', {}).get('dpd', 0)
    eod = metrics.get('fairness', {}).get('eod', 0)
    res_dir = metrics.get('fairness', {}).get('dir', 1)
    
    score = 0
    score += min(abs(dpd) * 10, 4)
    score += min(abs(eod) * 10, 3)
    if res_dir < 1:
        score += min((1 - res_dir) * 10, 3)
    return round(min(score, 10), 1)

if __name__ == "__main__":
    try:
        run_end_to_end()
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to server. Make sure you run `uvicorn app.main:app` first!")
