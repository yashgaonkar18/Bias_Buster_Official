from imblearn.over_sampling import SMOTE
from sklearn.base import clone
from app.utils.feature_encoder import encode_features_for_inference


def apply_smote(df, target_column, model):

    X = df.drop(columns=[target_column])
    y = df[target_column]

    X_encoded = encode_features_for_inference(X)

    smote = SMOTE(random_state=42)
    X_resampled, y_resampled = smote.fit_resample(X_encoded, y)

    new_model = clone(model)
    new_model.fit(X_resampled, y_resampled)

    return new_model, len(df), len(X_resampled)