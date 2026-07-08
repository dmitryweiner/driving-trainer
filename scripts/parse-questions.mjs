import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = new URL('./batches', import.meta.url).pathname;
const byId = new Map();
const decode = (s) => s
  .replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&quot;', '"')
  .replaceAll('&#39;', "'").replaceAll('&amp;', '&');

for (const f of readdirSync(dir).sort()) {
  const xml = readFileSync(join(dir, f), 'utf8');
  const quesRe = /<ques n="(\d+)" r="(\d+)"[^>]*>([\s\S]*?)<\/ques>/g;
  let m;
  while ((m = quesRe.exec(xml))) {
    const [, id, right, body] = m;
    if (byId.has(id)) continue;
    const q = decode((body.match(/<q>([\s\S]*?)<\/q>/) ?? [])[1] ?? '');
    const answers = [...body.matchAll(/<a v="(\d)">([\s\S]*?)<\/a>/g)]
      .map(([, v, t]) => ({ v: Number(v), text: decode(t) }))
      .sort((a, b) => a.v - b.v);
    const pic = (body.match(/<pic>([\s\S]*?)<\/pic>/) ?? [])[1] ?? null;
    byId.set(id, {
      id,
      question: q.replace(/^\d+\.\s*/, ''),
      answers: answers.map((a) => a.text),
      correct: Number(right), // 1-based
      pic,
    });
  }
}

const all = [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
writeFileSync(new URL('./questions.json', import.meta.url).pathname, JSON.stringify(all, null, 1));
console.log('total:', all.length, 'with pic:', all.filter((q) => q.pic).length);
