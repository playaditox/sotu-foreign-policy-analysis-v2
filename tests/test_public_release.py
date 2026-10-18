from pathlib import Path
import importlib.util
import json
import unittest

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('public_release',ROOT/'scripts/verify_public_release.py')
public_release=importlib.util.module_from_spec(spec);spec.loader.exec_module(public_release)

class PublicReleaseTests(unittest.TestCase):
    def test_complete_public_release_obeys_the_allow_list(self):
        result=public_release.verify()
        self.assertEqual(result['documents'],100)
        self.assertEqual(result['sentences'],35345)

    def test_current_word_totals_and_benchmarks_are_preserved(self):
        data=json.loads((ROOT/'portfolio/src/data.json').read_text())['queries']
        rows=[r for r in data['annual']['rows'] if r['corpus_variant']=='inclusive']
        self.assertEqual(len(rows),100)
        self.assertEqual(len({r['year'] for r in rows}),81)
        self.assertEqual(sum(r['total_words'] for r in rows),676171)
        self.assertEqual(sum(r['fp_words'] for r in rows),246135)
        methods={r['method']:r for r in data['v2_method_comparison']['rows']}
        self.assertEqual(set(methods),{'contextual_dictionary_v1','supervised_tfidf_v1','contextual_rationale_v2'})
        self.assertEqual((methods['contextual_rationale_v2']['detected'],methods['contextual_rationale_v2']['missed'],methods['contextual_rationale_v2']['false_alarms']),(132,23,18))

if __name__=='__main__':unittest.main()
