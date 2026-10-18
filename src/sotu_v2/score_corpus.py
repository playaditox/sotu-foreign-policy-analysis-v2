"""Rescore the released corpus without private training or annotation records."""
import argparse
from collections import defaultdict
import csv
import gzip
import json
from pathlib import Path
from .inference import ROOT, load_model, predict_packets

def read_corpus(name):
    with gzip.open(ROOT/f'data/corpus/{name}.jsonl.gz','rt') as stream:
        return [json.loads(line) for line in stream if line.strip()]

def packets_for(sentences, paragraphs):
    grouped=defaultdict(list)
    for row in paragraphs:grouped[row['document_id']].append(row)
    locations={}
    for rows in grouped.values():
        rows.sort(key=lambda row:row['paragraph_index'])
        for i,row in enumerate(rows):locations[row['paragraph_id']]=(rows,i)
    output=[]
    for sentence in sentences:
        rows,i=locations[sentence['paragraph_id']]
        if sentence['text'] not in rows[i]['text']:raise ValueError('Target not in paragraph')
        output.append({'target':sentence['text'],'previous_context_not_target':sentence['context_before'],
                       'following_context_not_target':sentence['context_after'],
                       'source_section':[{'text':row['text']} for row in rows[max(0,i-1):i+2]]})
    return output

def score(destination,batch_size=256):
    destination=Path(destination)
    if destination.exists():raise FileExistsError('Use a new destination; preserve previous results')
    models,_=load_model()
    models={task:model for task,model in models.items() if task=='foreign_policy' or task.endswith(('_supported','_explicit'))}
    documents=read_corpus('documents');paragraphs=read_corpus('paragraphs');sentences=read_corpus('sentences')
    packets=packets_for(sentences,paragraphs);totals=defaultdict(lambda:defaultdict(int))
    destination.mkdir(parents=True)
    with (destination/'sentences.jsonl').open('x') as stream:
        for start in range(0,len(sentences),batch_size):
            scored=predict_packets(packets[start:start+batch_size],models)
            for sentence,prediction in zip(sentences[start:start+batch_size],scored):
                words=sentence['word_count'];decision=prediction['decisions']
                if words<=0:decision=dict.fromkeys(decision,0)
                values=totals[sentence['document_id']];values['total_words']+=words
                values['fp_words']+=words if decision['foreign_policy']==1 else 0
                for tradition in ('wilsonian','hamiltonian','jacksonian','jeffersonian'):
                    values[tradition+'_words']+=words if decision[tradition+'_supported']==1 else 0
                stream.write(json.dumps({'sentence_id':sentence['sentence_id'],'document_id':sentence['document_id'],**prediction},ensure_ascii=False)+'\n')
    rows=[{'document_id':d['document_id'],'date':d['date'],**totals[d['document_id']]} for d in documents]
    with (destination/'documents.csv').open('x',newline='') as stream:
        writer=csv.DictWriter(stream,fieldnames=list(rows[0]));writer.writeheader();writer.writerows(rows)
    return rows

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('destination');args=parser.parse_args();score(args.destination)
