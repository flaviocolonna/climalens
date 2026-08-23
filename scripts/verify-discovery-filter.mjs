/**
 * Exercises the URL-verification filter end to end with a stubbed OpenRouter
 * response. Loads the real module through Vite's SSR loader — the same path
 * the dev middleware uses — so this tests the shipped code, not a copy.
 */
import { createServer } from 'vite';

process.env.OPENROUTER_API_KEY = 'test-key';
process.env.OPENROUTER_MODEL = 'test/model';

// Three projects. Only the first two are backed by a citation.
const CITED = [
  'https://www.legambiente.it/eventi/puliamo-il-mondo-2026/',
  'https://plasticfreeonlus.it/appuntamenti/',
];

const MODEL_OUTPUT = {
  projects: [
    {
      name: 'Puliamo il Mondo',
      organization: 'Legambiente',
      category: 'pulizia',
      description: 'Giornata nazionale di pulizia di spazi pubblici.',
      location: 'Napoli',
      howToParticipate: 'Iscrizione dal sito del circolo locale.',
      // exact match on a cited URL (trailing slash differs — must still match)
      sourceUrl: 'https://legambiente.it/eventi/puliamo-il-mondo-2026',
      sourceDate: 'settembre 2026',
    },
    {
      name: 'Raccolta rifiuti costiera',
      organization: 'Plastic Free',
      category: 'pulizia',
      description: 'Raccolte periodiche lungo il litorale.',
      location: 'Golfo di Napoli',
      howToParticipate: 'Calendario appuntamenti sul sito.',
      // same host as a citation, different page -> "domain" evidence
      sourceUrl: 'https://plasticfreeonlus.it/napoli/gennaio',
      sourceDate: '',
    },
    {
      name: 'Riforestazione Vesuvio',
      organization: 'Ente Parco Vesuvio',
      category: 'riforestazione',
      description: 'Piantumazione volontaria sulle pendici.',
      location: 'Parco Nazionale del Vesuvio',
      howToParticipate: 'Modulo online.',
      // never appeared in any citation -> must be dropped
      sourceUrl: 'https://parconazionaledelvesuvio.it/volontariato-2026',
      sourceDate: '',
    },
  ],
};

let capturedBody = null;

globalThis.fetch = async (_url, init) => {
  capturedBody = JSON.parse(init.body);
  return {
    ok: true,
    status: 200,
    json: async () => ({
      choices: [
        {
          finish_reason: 'stop',
          message: {
            content: JSON.stringify(MODEL_OUTPUT),
            annotations: CITED.map((url) => ({
              type: 'url_citation',
              url_citation: { url, title: 'x', content: 'y' },
            })),
          },
        },
      ],
    }),
  };
};

const server = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'error',
});

const mod = await server.ssrLoadModule('/api/_lib/discoverProjects.ts');
const result = await mod.discoverProjects({
  place: 'Napoli',
  country: 'Italia',
  latitude: 40.85,
  longitude: 14.27,
  language: 'it',
});

const evidence = Object.fromEntries(result.projects.map((p) => [p.name, p.evidence]));

console.log('--- richiesta inviata a OpenRouter ---');
console.log('model            :', capturedBody.model);
console.log('plugins          :', JSON.stringify(capturedBody.plugins));
console.log('response_format  :', capturedBody.response_format.type, '/ strict:', capturedBody.response_format.json_schema.strict);
console.log('provider         :', JSON.stringify(capturedBody.provider));

console.log('\n--- filtro di verifica ---');
console.log('citazioni ricevute :', result.sourcesConsulted);
console.log('progetti tenuti    :', result.projects.length, JSON.stringify(evidence));
console.log('scartati           :', result.droppedUnverified);
console.log('sourceDate vuota -> null :', result.projects.find((p) => p.name.startsWith('Raccolta'))?.sourceDate);

const checks = [
  ['3 progetti in input, 1 fabbricato scartato', result.droppedUnverified === 1],
  ['2 progetti superstiti', result.projects.length === 2],
  ['URL citato esatto -> evidence "exact"', evidence['Puliamo il Mondo'] === 'exact'],
  ['stesso host, altra pagina -> evidence "domain"', evidence['Raccolta rifiuti costiera'] === 'domain'],
  ['URL mai citato -> assente', !('Riforestazione Vesuvio' in evidence)],
  ['stringa vuota normalizzata a null', result.projects[1].sourceDate === null],
  ['require_parameters attivo', capturedBody.provider.require_parameters === true],
  ['plugin web con max_results', capturedBody.plugins.some((p) => p.id === 'web' && p.max_results > 0)],
];

console.log('\n--- asserzioni ---');
let failed = 0;
for (const [label, ok] of checks) {
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}`);
  if (!ok) failed++;
}

await server.close();
process.exit(failed === 0 ? 0 : 1);
