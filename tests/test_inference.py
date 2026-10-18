from pathlib import Path
import json
import tempfile
import unittest
import numpy as np
from sotu_v2.inference import ROOT, load_model, procedure_predictions, predict_packets, feature_text
from sotu_v2.score_corpus import read_corpus, packets_for

class FrozenInferenceTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.models,_=load_model()
        cls.sentences=read_corpus('sentences');cls.paragraphs=read_corpus('paragraphs')
        cls.fixtures=json.loads((ROOT/'tests/fixtures/v2_predictions.json').read_text())
        by_id={row['sentence_id']:row for row in cls.sentences}
        cls.targets=[by_id[row['sentence_id']] for row in cls.fixtures]
        cls.packets=packets_for(cls.targets,cls.paragraphs)

    def test_predictions_match_frozen_outputs_across_dates_and_context_policies(self):
        for task in self.fixtures[0]['probabilities']:
            actual=procedure_predictions(self.models[task],[{'packet':p} for p in self.packets])[1]
            expected=np.array([row['probabilities'][task] if row['probabilities'][task] is not None else np.nan for row in self.fixtures])
            np.testing.assert_allclose(actual,expected,rtol=0,atol=1e-12,equal_nan=True,err_msg=task)

    def test_relevance_and_explicitness_rules_match_the_frozen_release(self):
        predictions=predict_packets(self.packets,self.models)
        for expected,actual in zip(self.fixtures,predictions):
            for task,value in expected['decisions'].items():self.assertEqual(actual['decisions'][task],value,(expected['sentence_id'],task))

    def test_model_tampering_is_rejected_before_deserialization(self):
        with tempfile.TemporaryDirectory() as temp:
            directory=Path(temp);(directory/'manifest.json').write_bytes((ROOT/'models/v2/manifest.json').read_bytes())
            (directory/'model.pkl').write_bytes(b'not a model')
            with self.assertRaisesRegex(ValueError,'refuse to deserialize'):load_model(directory)

    def test_identity_and_annotations_do_not_become_features(self):
        packet=self.packets[0]
        poisoned={**packet,'party':'not_a_feature','president':'not_a_feature','reference_answer':'not_a_feature'}
        for policy in ['target','neighbors','source_section']:
            self.assertEqual(feature_text(packet,policy),feature_text(poisoned,policy))

if __name__=='__main__':unittest.main()
