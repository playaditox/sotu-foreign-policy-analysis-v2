"""Frozen v2 inference; no fitting, reference labels, or development records.

Prediction functions below are copied verbatim from the frozen v2 implementation.
The public model manifest binds the exact trusted pickle and source implementation.
"""
from pathlib import Path
import hashlib
import json
import pickle
import numpy as np

ROOT=Path(__file__).resolve().parents[2]

def load_model(directory=None):
    directory=Path(directory) if directory else ROOT/'models/v2'
    manifest=json.loads((directory/'manifest.json').read_text())
    blob=(directory/'model.pkl').read_bytes()
    if hashlib.sha256(blob).hexdigest()!=manifest['model_sha256']:
        raise ValueError('Frozen model hash differs; refuse to deserialize')
    return pickle.loads(blob),manifest

def feature_text(packet, policy):
    """Explicit allowlist: no identity, dates, event tags or annotation fields."""
    target = packet['target']
    if policy == 'target':
        return target
    if policy == 'neighbors':
        before = packet.get('previous_context_not_target', '')[-600:]
        after = packet.get('following_context_not_target', '')[:600]
        return f'TARGET {target} TARGET {target} BEFORE {before} AFTER {after}'
    if policy == 'source_section':
        # Each paragraph appears once in a fixed bound. Duplication of the
        # target emphasizes the target while full paragraph context stays local.
        section = '\n'.join(p['text'][:1500] for p in packet['source_section'])
        return f'TARGET {target} TARGET {target} SECTION {section}'
    raise ValueError('Unknown feature policy')

def predict_binary(fitted, texts):
    if fitted is None:
        return np.full(len(texts), np.nan)
    return fitted['model'].predict_proba(fitted['vectorizer'].transform(texts))[:, 1]

def _logit(probabilities):
    p = np.clip(probabilities, 1e-6, 1 - 1e-6)
    return np.log(p / (1 - p)).reshape(-1, 1)

def apply_calibrator(calibrator, raw):
    result = np.array(raw, dtype=float, copy=True)
    mask = np.isfinite(result)
    if calibrator is not None and mask.any():
        result[mask] = calibrator.predict_proba(_logit(result[mask]))[:, 1]
    return result

def procedure_predictions(procedure, rows):
    if procedure is None:
        return np.full(len(rows), np.nan), np.full(len(rows), np.nan)
    raw = predict_binary(procedure['fitted'], [feature_text(r['packet'], procedure['policy']) for r in rows])
    return raw, apply_calibrator(procedure['calibrator'], raw)

def predict_packets(packets, models=None):
    models=load_model()[0] if models is None else models
    rows=[{'packet':packet} for packet in packets]
    output=[]
    predictions={task:procedure_predictions(procedure,rows)[1] for task,procedure in models.items()}
    for i in range(len(rows)):
        raw={task:None if not np.isfinite(values[i]) else int(values[i]>=models[task]['cutoff']) for task,values in predictions.items()}
        coherent=dict(raw)
        if raw['foreign_policy']==0:coherent=dict.fromkeys(raw,0)
        elif raw['foreign_policy'] is None:coherent=dict.fromkeys(raw,None)
        else:
            for tradition in ('wilsonian','hamiltonian','jacksonian','jeffersonian'):
                if raw[tradition+'_explicit']==1:coherent[tradition+'_supported']=1
        output.append({'raw':raw,'decisions':coherent})
    return output
