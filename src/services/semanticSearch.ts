// src/services/semanticSearch.ts
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getFirestore, doc, getDoc, collection, getDocs, query, where, documentId } from 'firebase/firestore';
import { getApp } from 'firebase/app';

const EXT_INSTANCE_ID = 'firestore-semantic-search'; // <-- update
const FUNCTIONS_REGION = 'us-central1'; // update if different
const COLLECTION = 'documents'; // update to the collection where your indexed docs live

export type DocRecord = { id: string; [k: string]: any };

export async function runSearch(searchQuery: string): Promise<DocRecord[]> {
  const app = getApp();
  const functions = getFunctions(app, FUNCTIONS_REGION);
  const fnName = `ext-${EXT_INSTANCE_ID}-queryIndex`;
  const callable = httpsCallable(functions, fnName);

  // payload: most extension callables expect { query: [...] } from client SDK
  const payload = { query: [searchQuery] };
  let res: any;
  try {
    res = await callable(payload);
  } catch (err) {
    console.error('semantic search callable failed', err);
    return [];
  }
  const data = res?.data;
  if (!data || !Array.isArray(data.nearestNeighbors) || data.nearestNeighbors.length === 0) {
    return [];
  }

  // defensive: prefer US spelling 'neighbors' but allow 'neighbours'
  const neighbors = data.nearestNeighbors[0].neighbors || data.nearestNeighbors[0].neighbours || [];
  const ids = neighbors.map((n: any) => n?.datapoint?.datapointId).filter(Boolean);

  if (!ids.length) return [];

  const db = getFirestore(app);
  // Firestore 'in' queries are limited to 10 items per query — batch if necessary
  const BATCH_SIZE = 10;
  const docsMap: Record<string, DocRecord> = {};
  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const batch = ids.slice(i, i + BATCH_SIZE);
    try {
      const q = query(collection(db, COLLECTION), where(documentId(), 'in', batch));
      const snap = await getDocs(q);
      snap.forEach((d) => {
        docsMap[d.id] = { id: d.id, ...(d.data() as any) };
      });
    } catch (err) {
      console.warn('failed to load docs batch', batch, err);
    }
  }

  // preserve original neighbor order
  const ordered = ids.map((id: string) => docsMap[id]).filter(Boolean) as DocRecord[];
  return ordered;
}