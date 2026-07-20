# BiasBuster

An end-to-end fairness auditing and mitigation platform for detecting, analyzing, mitigating, and reporting bias in machine-learning classification models.

BiasBuster provides a structured environment where data scientists and engineers can upload trained models alongside their datasets to evaluate fairness across different demographic groups. It automates the detection of disparities, recommends empirically tested mitigation strategies, and generates interpretable fairness reports.

**Workflow:** Upload Dataset & Model → Detect Bias → Analyze Fairness → Recommend Mitigation → Mitigate → Compare Models → Optimize → Generate Report

## Why BiasBuster

Machine-learning models can produce different outcomes across demographic groups, while standard performance metrics such as accuracy may not expose those disparities.

BiasBuster provides a workflow for evaluating both model performance and group fairness, applying mitigation strategies, comparing resulting models, and generating interpretable reports. It ensures that evaluating fairness is as rigorous and accessible as evaluating standard predictive performance.

## Key Features

- **Model and Dataset Fairness Auditing:** Automatically compute fairness metrics across selected sensitive attributes.
- **Multiple Sensitive Attribute Analysis:** Support for analyzing intersections and multiple demographic groups.
- **Fairness-Aware Mitigation Strategies:** Apply algorithms like Reweighting and SMOTE to reduce bias.
- **Strategy Recommendation & Comparison:** Empirically evaluate and compare baseline, mitigated, and optimized models side-by-side.
- **Model Optimization:** Fine-tune models using Grid Search/Optuna to find the optimal trade-off between performance and fairness.
- **Persistent Workspaces and Experiments:** Organize your work logically and return to previous analyses without re-running computations.
- **Model and Artifact Persistence:** Safely store and manage uploaded datasets, original models, and generated fair models.
- **Comprehensive PDF Reports:** Generate detailed, interpretable fairness and mitigation reports for stakeholders.
- **Authentication:** Secure access using local credentials or OAuth (Google, GitHub).

## Fairness Evaluation

BiasBuster implements several standard fairness metrics to evaluate model behavior across groups:

- **Demographic Parity Difference (DPD):** Measures the difference in the rate of positive predictions between demographic groups, regardless of the true label.
- **Equal Opportunity / Equalized Odds Difference (EOD):** Evaluates whether the model is equally accurate in predicting positive outcomes across different groups (focusing on true positive rates).
- **Disparate Impact Ratio (DIR):** The ratio of positive prediction rates between the unprivileged and privileged groups.

_Note: Fairness metrics should be interpreted in context. No single metric universally determines whether a model is "fair," and mitigation often involves a trade-off with overall accuracy._

## Mitigation and Model Improvement

BiasBuster does not assume a single fix for bias. Instead, it provides tools to explore mitigation strategies and evaluate their impact:

- **Reweighting:** Assigns different weights to training examples based on their sensitive attributes and target labels to balance the representation during training.
- **SMOTE (Synthetic Minority Over-sampling Technique):** Generates synthetic examples for minority/unprivileged classes to address dataset imbalances.
- **Hyperparameter Optimization:** Utilizes optimization techniques to fine-tune model parameters, searching for configurations that maximize both performance and fairness.

The platform emphasizes evaluating fairness/performance trade-offs rather than assuming mitigation automatically makes a model perfectly fair.

## How It Works

```mermaid
graph TD
    A[Dataset + Trained Model] --> B[Validation & Upload]
    B --> C[Bias Detection]
    C --> D[Fairness Analysis]
    D --> E[Strategy Recommendation]
    E --> F[Mitigation]
    F --> G[Model Comparison]
    G --> H[Optimization]
    H --> I[Fairness Report]
```

## Architecture

```mermaid
graph TD
    Client[Next.js Frontend] --> |REST API| API[FastAPI Backend]

    subgraph Backend Core
        API --> Auth[Authentication Service]
        API --> Workspace[Workspace/Experiment Management]
        API --> ML[ML Pipeline: Detection & Mitigation]
        API --> Reporting[PDF Report Generation]
    end

    ML --> |Scikit-learn, Fairlearn| Analysis[Fairness Evaluation]

    Auth --> DB[(PostgreSQL)]
    Workspace --> DB

    ML --> Storage[Local Artifact Storage]
    Reporting --> Storage
```

The system uses a decoupled architecture. The Next.js frontend provides a responsive, dynamic UI. The FastAPI backend handles all business logic, orchestrating machine learning tasks asynchronously to prevent blocking the web server. Relational data (Workspaces, Experiments, Users) is persisted in PostgreSQL, while large binary artifacts (datasets, pickled models) are stored securely on the local filesystem.

## Screenshots

_(Placeholders for future screenshots. Add images to `docs/images/` and uncomment below)_

### Workspace & Experiments

![Workspace Management](assets/images/workspace.png)

### Dataset and Model Upload

![Upload Interface](assets/images/upload.png)

### Bias Detection Results

![Bias Results](assets/images/detection.png)

### Strategy Recommendation & Mitigation

![Mitigation Comparison](assets/images/mitigation.png)

### Fairness Report

![Report Output](assets/images/report.png)

## Tech Stack

**Backend**

- Python
- FastAPI
- SQLAlchemy + asyncpg
- PostgreSQL
- Alembic (Migrations)

**AI / ML**

- scikit-learn
- Fairlearn
- AIF360
- Optuna
- imbalanced-learn
- pandas / numpy

**Frontend**

- Next.js (React)
- Tailwind CSS
- Chart.js
- Lucide React

**Infrastructure / Supporting Tools**

- ReportLab (PDF Generation)
- Resend (Email Notifications)

## Project Structure

```text
BiasBuster/
├── backend/
│   ├── alembic/              # Database migrations
│   ├── app/
│   │   ├── auth/             # Authentication logic & dependencies
│   │   ├── models/           # SQLAlchemy database models
│   │   ├── routers/          # FastAPI route definitions
│   │   ├── services/         # Core business and ML logic
│   │   └── utils/            # Helper utilities (e.g., column normalization)
│   ├── artifacts/            # Local storage for datasets and models
│   └── requirements.txt      # Python dependencies
│
├── biasbuster/               # Next.js Frontend
│   ├── app/                  # Next.js App Router pages
│   ├── components/           # Reusable React components
│   ├── lib/                  # Frontend utilities and API clients
│   └── package.json          # Node dependencies
│
└── README.md
```

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/BiasBuster.git
cd BiasBuster
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate
pip install -r requirements.txt
```

Set up your environment variables (see [Environment Variables](#environment-variables)):

```bash
cp .env.example .env
```

_Edit `.env` to include your actual PostgreSQL database URL and configure a secure secret key._

Run database migrations:

```bash
alembic upgrade head
```

Start the backend server:

```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`.
API Documentation (Swagger UI) is available at `http://localhost:8000/docs`.

### 3. Frontend Setup

Open a new terminal and navigate to the frontend directory:

```bash
cd biasbuster
npm install
npm run dev
```

The application will be available at `http://localhost:3000`.

## Environment Variables

The backend requires certain environment variables to function correctly. A template is provided in `backend/.env.example`.

**Required Variables:**

- `DATABASE_URL`: Connection string for PostgreSQL (e.g., `postgresql+asyncpg://user:password@localhost:5432/biasbuster`)
- `SECRET_KEY`: A strong, random string for session signing and JWT creation.

**Optional Variables (OAuth & Email):**

- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: For Google login.
- `GITHUB_CLIENT_ID` & `GITHUB_CLIENT_SECRET`: For GitHub login.
- `RESEND_API_KEY`: To enable transactional emails (welcome emails, reports).

_Never commit your actual `.env` file to version control._

## Quick Start / Example Workflow

1. **Create an Account:** Register or log in via OAuth.
2. **Create a Workspace & Experiment:** Organize your task (e.g., "Loan Approval Audit").
3. **Upload Artifacts:** Upload your CSV dataset and a pre-trained scikit-learn model (`.pkl` or `.joblib`).
4. **Configure Analysis:** Select the target variable and the sensitive attribute(s) (e.g., "Gender", "Race").
5. **Run Bias Detection:** Review the baseline fairness metrics (DPD, EOD, DIR).
6. **Evaluate Mitigation:** View the recommended mitigation strategies based on empirical simulations.
7. **Mitigate and Compare:** Apply a strategy (like Reweighting) and visually compare the performance vs. fairness trade-off against the baseline.
8. **Optimize:** (Optional) Run hyperparameter optimization on the mitigated model.
9. **Generate Report:** Export a comprehensive PDF detailing the findings and actions taken.

## Input Requirements

To use BiasBuster, users must provide:

- **Dataset:** A well-structured CSV file containing numerical and categorical features, including the target column and sensitive attribute(s).
- **Model:** A trained scikit-learn estimator or pipeline, serialized using `joblib` or `pickle`. The model's expected feature names must align with the dataset columns (or be automatically resolvable via internal normalization).

_Note: BiasBuster currently supports classification models._

## Persistent Experiment Workflow

BiasBuster uses a hierarchical system to manage your ML fairness audits:

- **Workspaces** act as high-level projects or teams.
- **Experiments** track individual auditing sessions within a Workspace.

When you upload a dataset and model, run detection, or generate a mitigated model, all these artifacts and results are securely persisted and associated with the active Experiment. This allows you to close the application and return to previous experiments without losing your progress or having to re-run expensive calculations.

## API Documentation

BiasBuster provides a fully documented REST API. Key endpoints include:

- `/auth/*`: Registration, login, and OAuth flows.
- `/workspaces/*`: CRUD operations for Workspaces and Experiments.
- `/upload/*`: Handling dataset and model ingestion.
- `/bias/*`: Fairness evaluation and metric calculation.
- `/mitigation/*`: Applying bias reduction algorithms.
- `/report/*`: PDF report generation.

Once the backend is running, visit `http://localhost:8000/docs` to explore the OpenAPI documentation and test endpoints directly.

## Limitations

- **Classification Only:** BiasBuster is primarily designed for classification tasks. Regression and generation models are not currently supported.
- **Context-Dependent Fairness:** Fairness metrics depend heavily on the selected sensitive attributes and the dataset's context.
- **Performance Trade-offs:** Mitigation strategies typically trade some overall model predictive performance (e.g., accuracy) for improved group fairness.
- **Not a Silver Bullet:** Passing a statistical fairness threshold within BiasBuster does not guarantee that a model is ethical, harmless, or legally compliant in production deployment. BiasBuster is a tool to support human review and ethical ML practices, not replace them.

## Team

- Sidhant Naik
- Yash Gaonkar
- Sairaj Vast
- Tanmay Gawas
