# ClimaLens

Mappa interattiva di come è cambiata la temperatura della Terra dal **1880 al 2025**.
Scorri gli anni, cerca un luogo, guarda la sua curva — poi ribalta la mappa e
guarda chi quel riscaldamento lo ha causato.

Dati reali, nessun mock: **NASA GISTEMP v4** per le anomalie, **ERA5** (via
Open-Meteo) per le temperature assolute e i giorni sopra soglia, **Climate
Watch** per i settori, **Global Carbon Budget** per le emissioni per paese.

---

## Come funziona

Il pezzo interessante non è la mappa, è la pipeline dati.

GISTEMP pubblica le anomalie mensili su griglia 2°×2° in un NetCDF-3 da 57 MB
(1758 mesi × 90 × 180 celle, Int16). Troppo per il browser, ma non serve tutto:
`scripts/build-climate-data.mjs` lo collassa in **medie annuali** e produce un
binario Int16 piatto da 4,5 MB (~1,5 MB gzippato) più un sidecar JSON.

```bash
npm run data     # scarica, decomprime in streaming, ricampiona
```

Lo script include un lettore NetCDF-3 minimale (~90 righe, zero dipendenze):
il formato classic è abbastanza semplice da non giustificare una libreria, e
il download passa per `zlib` in streaming così i 57 MB non stanno mai due volte
in memoria.

Regole di qualità applicate in fase di build:

- una cella entra nella media annuale solo con **≥ 8 mesi** validi;
- un anno viene pubblicato solo con **≥ 25%** di copertura globale;
- gli anni parziali in coda vengono scartati (la sorgente si aggiorna a metà anno);
- la media globale è **pesata per area** (`cos(lat)`), non una media aritmetica di celle.

### Il rendering

La griglia è equirettangolare, la mappa è Web Mercator. Sovrapporre l'una all'altra
senza riproiettare è l'errore classico: le alte latitudini scivolano.

`src/lib/gridRenderer.ts` campiona **in spazio Mercatore**, riga per riga, con
interpolazione bilineare consapevole dei valori mancanti (le celle vuote non
inquinano i vicini, e la loro copertura parziale sfuma l'alfa ai bordi invece di
produrre un gradino). Le tabelle riga/colonna sono precalcolate una volta sola
perché il loop interno gira ~1M di volte per frame.

Il canvas risultante viene drappeggiato su MapLibre come `canvas` source. La
sorgente si riattiva per un solo frame dopo ogni ridisegno, invece di lasciare la
mappa in un render loop continuo.

## Chi scalda il pianeta

La mappa mostra l'effetto, i settori mostrano la causa: la ripartizione delle
emissioni globali di gas serra — Climate Watch (WRI), 2016, 49,4 Gt CO₂e —
navigabile dai quattro macro-settori giù fino al singolo sotto-settore.

Si apre dalla **barra in cima** e occupa tutta la finestra, con il totale e la
sua ripartizione in un rail fisso a sinistra e l'albero a destra. Erano 24 voci
su tre livelli più sei schede con le fonti: in una colonna da 26rem si leggevano
attraverso una feritoia. A schermo intero le barre hanno la lunghezza che serve
per confrontarle, e `esc` chiude.

Due scelte non ovvie.

**Una sola scala, una sola origine.** Ogni barra è la quota sul totale mondiale,
non sul genitore, e riparte dal bordo del pannello annullando il rientro della
gerarchia (`marginLeft: -depth * INDENT`, più la stessa quantità in `width`).
Senza la compensazione una percentuale identica disegnerebbe una barra più corta
a ogni livello, perché il `%` si risolve sulla riga rientrata: *Ferro e acciaio*
al 7,2% sembrerebbe più piccolo di quel che è solo perché sta due livelli sotto.

**Le quote sommano al genitore, e viene verificato.** In dev un controllo
ricorsivo confronta la somma dei figli con il valore del padre e il primo livello
con 100: una cifra corretta a mano senza aggiornare il resto si fa notare subito,
invece di restare un errore silenzioso in una tabella che nessuno ricontrolla.

L'anno è dichiarato invece che sottinteso. Il 2016 è l'ultimo pubblicato con
questo dettaglio per sotto-settore; le quote si muovono lentamente, il totale
assoluto no.

### La seconda lente: a cosa servono

«L'abbigliamento non c'è» è l'obiezione giusta, e la risposta non è aggiungere
una riga. Quel taglio è **per sorgente** — dove il gas esce fisicamente — e
l'abbigliamento è un **uso finale**: le sue emissioni sono già dentro, spalmate
tra petrolchimica (fibre sintetiche), altra industria (tintura e finissaggio),
agricoltura (cotone e lana), navigazione e discariche. Aggiungerla accanto a
«Energia 73,2%» la conterebbe due volte, e il controllo di somma se ne
accorgerebbe subito.

Quindi: una seconda scheda, la stessa torta tagliata per uso finale — edifici,
cibo, turismo, sanità, abbigliamento, digitale. Ha tre proprietà che la prima
non ha, tutte dichiarate invece che nascoste:

- **le voci si sovrappongono** e non sommano a 100 (un volo per una vacanza sta
  sia in *turismo* sia in *trasporti*);
- **ogni voce ha la sua fonte, il suo anno e i suoi confini** — non esiste uno
  studio unico che le calcoli tutte allo stesso modo, quindi la fonte sta sulla
  riga, non nel footer, e il denominatore diverso è segnalato in giallo;
- **dove la stima è contesa si disegna l'intervallo.** L'abbigliamento sta tra
  il 2 e il 4%: il «10% delle emissioni globali» che gira ovunque non ha una
  fonte rintracciabile. La barra è piena fino alla stima minima e velata fino
  alla massima — la parte velata è l'incertezza, non un valore in più.

Ogni voce ha un rimando *dove sono già contate*, che apre l'altra lente sui
settori corrispondenti e mette in secondo piano il resto. È lì che si vede la
differenza tra le due domande.

## Chi lo causa (il layer per paese)

La mappa delle anomalie mostra chi il riscaldamento lo **subisce**. Il selettore
in basso a sinistra la ribalta: le emissioni per paese, cioè chi lo **causa**.
Che le due mappe non si somiglino affatto è l'argomento più forte che questa app
può fare.

Tre metriche, ognuna con la sua domanda:

| | |
|---|---|
| **Pro capite** | quanto pesa una persona di qui, uso del suolo incluso |
| **Storiche** | quota di tutta la CO₂ emessa dal 1750 — quella che è ancora lassù |
| **Import/export** | consumi meno produzione: chi compra una maglietta fatta altrove ne compra anche le emissioni |

Le prime due sono **quantità** e prendono una rampa sequenziale rossa a tinta
unica, **dal chiaro allo scuro**: più scuro = più emissioni, la convenzione che
chiunque abbia visto una mappa si aspetta. La terza ha due versi opposti attorno
allo zero ed è l'unica **divergente**, rosso↔verde-azzurro; lì "peggio" non
esiste, esiste "più lontano da zero", e vale la stessa regola su entrambe le
braccia, con il grigio del centro che arretra perché *in pari* non è una notizia.
Il rosso sta dalla parte di chi importa: è il paese la cui impronta vera è più
grande del suo numero territoriale.

Su una basemap scura la convenzione ha un costo — il valore alto è anche il meno
luminoso. Due cose lo pagano: il passo più scuro si ferma dove il contrasto sul
fondo regge ancora (2,3:1, misurato) e ogni paese ha il suo contorno chiaro, così
un riempimento scuro legge come pieno e non come buco. L'alfa resta **costante**
su tutte le classi: farla crescere col valore, come fa la rampa delle anomalie,
annullerebbe esattamente la rampa di luminosità che qui porta l'informazione.

Le rampe sono validate sulla basemap vera, non a occhio: monotonia di luminosità,
distacco fra classi adiacenti, contrasto sul fondo, separazione per daltonismo.

`scripts/build-emissions-data.mjs` unisce i dati Global Carbon Budget (via Our
World in Data, CSV da 14 MB) alle forme Natural Earth 1:110m e ne fa un GeoJSON
da 210 KB per paese. Il file si scarica **su richiesta**: quando si accende il
layer, o quando si apre il pannello di un luogo — che dalle stesse forme ricava
a quale paese attribuire il punto, e le usa come maschera terra/mare. Chi guarda
solo la mappa delle anomalie non lo scarica.

Dentro ci sono tre proprietà per colorare la mappa (`pc`, `cum`, `net`) e una
decina che servono a rispondere **perché** quel colore è quel colore, nel
pannello di un luogo: la ripartizione per combustibile, l'energia consumata a
testa, i gas diversi dalla CO₂ e i gradi di riscaldamento attribuibili al paese.
Ogni gruppo di numeri che viene letto insieme arriva **dalla stessa riga** del
CSV: la ripartizione deve sommare al totale di cui è ripartizione, e l'energia
deve dividere le emissioni del suo stesso anno, o l'intensità che ne esce è
inventata.

Due dettagli che il join si porta dietro:

- `Number('')` è `0`, non `NaN`. Senza un controllo esplicito ogni cella vuota
  del CSV sarebbe diventata uno zero convinto: Taiwan e l'Antartide come paesi a
  emissioni nulle. Adesso una cella vuota resta «nessun dato» e il paese si
  disegna grigio.
- Ogni metrica prende **il suo anno di riferimento**, e chi non ce l'ha non
  viene colorato. Tenere il dato 2019 di un paese accanto al 2024 di tutti gli
  altri produrrebbe una mappa i cui colori non si possono confrontare fra loro —
  che è l'unica cosa per cui esiste una mappa coropletica.

## Perché qui si scalda così

Il pannello di un luogo diceva **quanto**. Adesso dice anche **perché proprio
tanto**, e lo dice con numeri misurati invece che con una frase scritta a mano
posto per posto.

È una scala di confronti annidati, tutti letti dalla stessa griglia GISTEMP:

| | | |
|---|---|---|
| Il mondo | +1,29 °C | |
| Fascia 40°–50° N | +1,82 °C | +0,53 |
| La terra di questa fascia | +2,33 °C | +0,50 |
| Questo punto | +2,64 °C | +0,31 |

Ogni riga è la media — pesata per `cos(lat)`, che a 60° una cella copre metà
della superficie di una all'equatore — di un insieme più stretto di quello sopra.
Lo scarto fra due righe è **quanto pesa quel passaggio**, non una causa isolata
dalle altre: a queste scale non esistono cause indipendenti, e la nota sotto la
scala lo scrive. Accanto a ogni riga c'è il meccanismo: l'amplificazione polare
dove il ghiaccio che si ritira scopre roccia e mare scuri, la capacità termica
dell'acqua dove il punto cade in mare, la continentalità dove intorno c'è solo
terra.

Tre regole tengono onesta la scala.

**Il testo non contraddice mai il numero.** La continentalità spiega il residuo
solo se il residuo ha il verso giusto. A Delhi il punto sta *sotto* la media
della terraferma della sua fascia — foschia industriale, irrigazione — e lì
«lontano dal mare ci si scalda di più» sarebbe una frase sbagliata detta con
sicurezza. Quando il verso non torna, la riga dice che quello che resta non si
legge da qui, ed elenca cosa una cella di 2° non separa.

**Una riga che non si può misurare non si stampa.** La fascia 70°–80° S ha dati
ottocenteschi sul 2% delle sue celle: sotto il 60% di copertura la media della
fascia sparisce, e al suo posto compare il motivo per cui non c'è.

**Terra e mare li decide il centro della cella**, e quando il punto e la sua cella
non sono d'accordo la spiegazione è quella, prima di ogni altra: nel golfo di
Napoli il punto è in mare, ma la cella che lo misura è per il 56% terraferma, e
il valore che ne esce sta dalla parte della terra.

## Quanta CO₂ causa questa zona

La mappa delle anomalie risponde a «chi lo subisce», il layer per paese a «chi lo
causa», e le due risposte stavano in due schermate diverse. Ora il pannello di un
luogo le tiene insieme sullo stesso punto.

Il numero grosso è **quanti gradi del riscaldamento globale sono attribuibili ai
gas serra emessi in quel paese** dal 1851 — Italia +0,015 °C, Brasile +0,088,
Stati Uniti +0,296 — accanto alla quota di popolazione, che è il metro con cui va
letto: il Brasile ha il 5,3% del riscaldamento attribuito e il 2,6% delle persone.

E soprattutto: **quel contributo scalda il mondo intero, non chi lo emette.** La
CO₂ si mescola in atmosfera in pochi mesi. Questo punto ha subito +2,64 °C, quasi
tutti causati da altri — che è la tesi dell'app detta su un punto solo invece che
su due mappe.

Il totale mondiale di questa attribuzione (+1,68 °C) è più alto del riscaldamento
osservato (+1,29 °C), e il pannello dice perché invece di lasciar sospettare un
errore: conta il solo effetto serra, senza il raffreddamento degli aerosol che ne
maschera una parte.

### Il perché delle emissioni

Tre pezzi, in ordine di quanto spiegano.

**Da dove esce.** La ripartizione per sorgente dell'anno: carbone, petrolio, gas,
cemento, gas bruciato ai pozzi, foreste e uso del suolo. È la prima cosa perché
in mezzo mondo è già la risposta: in Brasile il 77% non esce da un motore ma da
una foresta tagliata, in Qatar l'82% è gas. Le quote sono sul totale ricostruito
dalle sue parti — non su quello pubblicato, che l'arrotondamento del file rende
diverso fino al 2% sui paesi da mezza megatonnellata: una torta le cui fette non
fanno cento è una torta sbagliata. Dove l'uso del suolo è un **pozzo** invece che
una sorgente non diventa una fetta negativa: esce dalla torta e viene detto a
parte.

**Perché proprio tanto.** L'identità che sta sotto quasi tutta la differenza fra
un paese e l'altro:

```
CO₂ a testa  =  energia a testa  ×  CO₂ per unità di energia
```

cioè *quanta* energia consuma una persona di qui e *quanto è sporca*. Sono due
leve diverse e si tirano in modi diversi, e un solo numero pro capite le
appiattisce in una: la Norvegia sta 4,6× la media mondiale sulla prima e 0,31×
sulla seconda; il Qatar sta sopra su tutte e due (9,9× e 0,88×); l'India sta
sotto sull'energia (0,36×) e sopra sull'intensità (1,3×). I due rapporti sono
scritti accanto ai valori assoluti e **si moltiplicano nel terzo**, che è quello
che li rende leggibili invece che due numeri in fila.

**E non è tutta CO₂.** La quota di metano e protossido d'azoto sul totale dei gas
serra del paese, quando supera il 5%: in Kenya è tre quarti, e senza quella riga
il paese sembrerebbe non emettere niente.

Un dettaglio che il calcolo si porta dietro: la CO₂ fossile e l'uso del suolo
arrivano dal Global Carbon Budget, il totale dei gas serra da Climate Watch, che
stima l'uso del suolo in un altro modo. Sottrarre l'uno dall'altro darebbe numeri
che non tornano — per il Congo un totale più piccolo della somma delle sue parti
— quindi la quota non-CO₂ si calcola **solo con i termini che vengono dalla
stessa fonte**.

### A chi appartiene un punto

Le emissioni si contano per paese: più fine di così non esiste, e il pannello lo
dichiara invece di far credere che quei numeri siano del chilometro quadrato che
è stato cliccato. L'attribuzione ha quattro esiti, tutti scritti sull'etichetta:

| | |
|---|---|
| **paese del luogo cercato** | il codice ISO arriva dal geocoder: è esatto, e non soffre della semplificazione dei confini |
| **punto dentro il confine** | point-in-polygon sulle forme 1:110m, per i punti cliccati sulla mappa |
| **costa più vicina · N km** | il punto è in mare entro 300 km: a quella distanza il paese più vicino è la risposta meno sbagliata, e il numero di chilometri è lì per giudicarlo |
| **nessuno** | mare aperto oltre i 300 km, o Antartide: non c'è un paese, e la cosa da dire è quella |

Il quinto caso è quello che rende utile il codice ISO: Singapore, Malta, Monaco e
gli altri micro-stati non hanno una forma a 1:110m, e le loro coordinate cadono
dentro il vicino. Lì il pannello dice che quel paese in questo file non c'è —
mostrare i numeri della Malaysia sotto il nome «Singapore» sarebbe la risposta
sbagliata detta con sicurezza.

## Ricerca progetti (opzionale)

Il pannello di un luogo può cercare sul web progetti ambientali a cui
partecipare, tramite **OpenRouter** con il plugin di ricerca web.

**Ogni URL viene verificato contro i risultati di ricerca reali.** Un modello
può scrivere l'URL plausibile di una pulizia spiaggia che non esiste; non può
farlo comparire tra le citazioni. `discoverProjects.ts` legge gli URL dalle
annotazioni `url_citation` della risposta e scarta tutto ciò che non combacia,
riportando quanti ne ha scartati. Il pannello distingue *pagina trovata* (URL
esatto tra le citazioni) da *solo dominio* (il sito dell'organizzazione è reale,
la pagina specifica no).

Config allineata a `startup-buddy`: routing EU di default
(`eu.openrouter.ai` + `data_collection: "deny"`, `zdr: true`), plugin `web` con
`max_results` esplicito invece del suffisso `:online`, e `response-healing`.

`provider.require_parameters: true` non è un dettaglio: senza, il router può
scegliere un endpoint che ignora `response_format` e lo schema JSON decade
silenziosamente a suggerimento.

È la differenza tra "un'AI dice che c'è una pulizia" e "esiste una pagina che
dice che c'è una pulizia". La seconda è ancora da verificare — l'interfaccia lo
dichiara invece di nasconderlo.

Controllo dei costi: la ricerca parte **solo su click**, i risultati sono in
cache per cella geografica da 0,5° (6 ore), e l'endpoint ha un tetto per IP e
uno globale giornaliero.

```bash
cp .env.example .env    # poi inserisci OPENROUTER_API_KEY
```

Il modello è configurabile via `OPENROUTER_MODEL` senza toccare il codice, e
compare nella riga di provenienza sotto i risultati.

Senza chiave il resto dell'app funziona normalmente: il pannello progetti
mostra un errore, tutto il resto no.

## Stack

React 18 · TypeScript · Vite · Tailwind · MapLibre GL · Recharts

Nessuna API key per il nucleo dell'app: il basemap è CARTO Dark Matter, il
geocoding e ERA5 sono Open-Meteo, tutti keyless. Serve una chiave OpenRouter
solo per la ricerca progetti — e nessun SDK: è una `fetch` a un endpoint
OpenAI-compatibile.

## Avvio

```bash
npm install
npm run data
npm run dev
```

`npm run data` va eseguito una volta: `public/data/` non è versionato.

In dev l'endpoint `/api/discover-projects` è servito da un middleware Vite che
carica lo **stesso** handler della function Vercel, così locale e produzione non
possono divergere. La chiave resta nel processo Node: non ha prefisso `VITE_`,
quindi Vite non la inserisce nel bundle.

## Comandi

| | |
|---|---|
| `npm run dev` | dev server |
| `npm run data` | rigenera tutti i dati (griglia + paesi) |
| `npm run data:climate` | solo la griglia GISTEMP |
| `npm run data:emissions` | solo il layer per paese |
| `npm run data:pollution` | solo le metriche non-CO₂ (aria, acqua, plastica, azoto) |
| `npm run data:progress` | solo le curve di quello che sta funzionando |
| `npm run build` | build di produzione |
| `npm run lint` | typecheck |

## Giorni che si sentono

`+1,8 °C` è un'astrazione. «38 notti sopra i 20 gradi invece di 4» no.

Il pannello di un luogo conta, sulla serie giornaliera ERA5, i giorni sopra i
30 °C, le notti sopra i 20 e i giorni di gelo, mediati sulle stesse due finestre
trentennali delle temperature assolute. Massime e minime triplicano il JSON ma
non la banda — sono ~190 KB gzippati per 86 anni, perché una colonna di numeri
simili si comprime bene.

Due regole tengono onesto il conteggio:

- un anno con buchi conterebbe meno giorni sopra soglia **solo perché ne ha meno
  in tutto**, quindi sotto la soglia di completezza non entra in nessuna media;
- una riga compare solo se in quel posto significa qualcosa. Le gelate a
  Singapore e i 30 °C a Tromsø sarebbero due righe di zeri, e uno zero che non
  cambia non racconta niente.

Il colore del delta segue **il verso del riscaldamento, non il segno del
numero**: più notti tropicali e meno gelate dicono la stessa cosa.

## Link condivisibili

Anno, punto aperto, pannello e layer stanno nella query string, in inglese e snake_case
(la lingua dell'interfaccia invece resta locale al browser e non passa dall'URL):

```
?year=2003&lat=41.903&lon=12.496&place=Roma&country=Italia&country_code=IT&layer=pc&panel=sectors
```

Si scrive con `replaceState` e con 250 ms di ritardo: scorrere gli anni non deve
riempire la cronologia di 146 voci da cui il tasto "indietro" non esce più, né
martellare l'API di history durante l'animazione.

## Scorciatoie

`spazio` play/pausa · `←` `→` anno precedente/successivo · click sulla mappa per
interrogare un punto qualsiasi.

## Note di lettura

Le anomalie sono riferite alla **baseline 1951-1980**, la convenzione GISTEMP —
non al periodo preindustriale. Il dato "riscaldamento" nel pannello di dettaglio
confronta invece `1880-1909` con l'ultimo decennio, che è la lettura più
intuitiva per un luogo specifico.

La risoluzione è di 2°, quindi una città eredita la curva della sua cella: Napoli
e Salerno condividono lo stesso valore. È la risoluzione della scienza
disponibile, non un limite dell'app — ma va detto invece che lasciato intendere
il contrario.

Le aree trasparenti sui primi decenni non sono zeri: sono **assenza di copertura
strumentale**. Nel 1880 la griglia è coperta al 68%, nel 2025 al 99%.

Il layer per paese **non dipende dall'anno scelto** sulla linea del tempo: è una
fotografia dell'ultimo anno disponibile, e la legenda lo scrive. Kosovo, Cipro
del Nord, Somaliland e Sahara Occidentale non si colorano: non hanno un codice
ISO nella tabella delle emissioni.

I confini sono Natural Earth **1:110m**, e a quella scala i micro-stati non hanno
una forma propria: le coordinate di Singapore cadono dentro la Malaysia. Per un
luogo cercato l'attribuzione la fa il **codice del paese** che arriva dal
geocoder, che non ha questo problema; per un punto cliccato la fa la geometria, e
per i paesi che nel file non ci sono il pannello dice che non ci sono invece di
mostrare i numeri del vicino. Anche l'Antartide manca — non ha popolazione,
quindi non ha una riga nelle emissioni, quindi non ha una forma — ed è il motivo
per cui sotto i 60° S il confronto terra/mare non compare.

## Oltre la CO₂

La CO₂ scalda, ma non si respira — e non è quello che uccide adesso. Tre
sezioni portano l'inquinamento che non è carbonio.

### Che aria si respira (nel pannello di un luogo)

Il PM2.5 del punto aperto, da **Open-Meteo Air Quality**: stesso fornitore
keyless dell'archivio ERA5, dietro c'è il modello CAMS. Una richiesta sola
(~32 KB gzippati) porta il valore di adesso e l'anno solare completo appena
chiuso.

Il numero grosso non è il valore assoluto ma il **rapporto sulla linea guida
OMS** — 5 µg/m³ di media annua — perché "2,4 volte la soglia" si capisce senza
sapere cosa sia un microgrammo per metro cubo. Sotto, i giorni sopra la soglia
giornaliera (15 µg/m³). Roma: 12,2 µg/m³, 94 giorni su 365. Delhi: 80,3 µg/m³,
**365 giorni su 365**. Reykjavík: 3,1, zero giorni.

Due regole tengono onesto il conteggio, le stesse dei giorni sopra i 30 °C: un
giorno entra solo con almeno 18 ore misurate, e un anno solo con almeno 300
giorni. E la soglia giornaliera si applica alla **media del giorno**, non ai
picchi orari: contare le ore darebbe un numero più grande e senza significato.

Il gancio con il resto dell'app c'era già: il pannello di un paese spiega che
l'attribuzione in °C supera il riscaldamento osservato *perché gli aerosol ne
mascherano una parte*. Quegli aerosol sono questo PM2.5. Lo stesso fumo tiene
il pianeta un po' più fresco e riempie i polmoni — l'app scriveva metà della
frase.

### Cinque metriche in più sulla mappa

Una terza scheda nel selettore, accanto a «chi lo subisce» e «chi lo causa»:

| | |
|---|---|
| **Aria (PM2.5)** | esposizione media della popolazione, µg/m³ |
| **Morti** | decessi attribuibili all'inquinamento dell'aria, per 100.000 |
| **Acqua** | prelievi sulle risorse rinnovabili, % |
| **Plastica** | plastica mal gestita pro capite, kg/anno |
| **Azoto** | fertilizzante azotato per ettaro coltivato, kg/ha |

Scheda separata e non altri cinque chip in fondo a quella del carbonio: il
PM2.5 non è un tipo di CO₂, e accanto a «pro capite» si sarebbe letto come una
variante dello stesso conto.

**Le classi non sono numeri tondi.** Dove esiste una soglia concordata è quella
a fare da confine: il PM2.5 usa la linea guida OMS 2021 e i suoi quattro
obiettivi intermedi (5, 10, 15, 25, 35), lo stress idrico le classi dell'obiettivo
ONU 6.4.2 — e sopra il 100% un paese preleva più di quanto si rigeneri, che
succede a diciassette paesi. Inventare una scala avrebbe reso i colori arbitrari
proprio dove esiste un accordo internazionale su dove sta il limite.

`scripts/build-pollution-data.mjs` unisce l'API della **Banca Mondiale** (che
ridistribuisce OMS e FAO) e due dataset **Our World in Data**, e ne fa una
tabella per ISO3 di 16 KB **senza geometrie**: le forme le ha già il file delle
emissioni, e il client unisce i due al volo. Vale la stessa regola di sempre —
un anno di riferimento per metrica, e chi non ce l'ha resta grigio — con una
differenza: l'anno scelto è quello che **copre più paesi**, non il più recente,
perché l'ultimo pubblicato è quasi sempre mezzo vuoto.

Una trappola trovata per strada: gli aggregati della Banca Mondiale (`WLD`,
`EUU`, `ARB`) hanno un ISO3 dall'aria legittima e passano qualunque controllo
sul formato. L'endpoint degli indicatori non dice quali siano — il campo
`region` torna `null` per tutti — quindi l'elenco dei paesi veri va chiesto a
`/country`, dove un aggregato ha `region.id === 'NA'`. Senza, il mondo intero
finiva in classifica come se fosse un paese.

### I confini del pianeta

La sezione che rimette il clima in scala. Nove limiti, **sette superati**: il
clima è uno dei nove ed è il quinto per distanza dal limite. Azoto e fosforo
stanno a tre volte il confine, la biosfera a più di dieci.

Le barre misurano **quante volte il limite**, non il valore assoluto: ppm,
teragrammi di azoto e unità Dobson non starebbero sulla stessa scala in nessun
altro modo. Metà traccia è il confine; il numero vero resta scritto accanto a
ogni riga. Due righe hanno il verso invertito — foresta rimasta e saturazione di
aragonite si superano **scendendo** — e senza dichiararlo nei dati avrebbero
avuto la barra dalla parte sbagliata.

Valori da Richardson et al., *Science Advances* 2023: una valutazione sola,
internamente coerente, invece di nove numeri presi da nove posti. Lo stato è
quello del **Planetary Health Check 2025**, che ha dichiarato superata anche
l'acidificazione degli oceani — la settima. È l'unica riga dove le due fonti si
sovrappongono, e porta i numeri del 2025: dichiarato, invece che mescolato in
silenzio.

E l'ozono, entro il limite e in recupero, resta lì a ricordare che un problema
ambientale globale, una volta, si è chiuso.

## Chi le estrae, e cosa posso fare

Le ultime due sezioni chiudono il cerchio: da una parte le imprese, dall'altra
la persona che guarda. Vanno lette insieme, ed è il motivo per cui sono state
scritte insieme.

### La terza lente: chi le estrae

Accanto a «da dove escono» e «a cosa servono», il taglio **a monte**: chi tira
il carbonio fuori dal terreno. [Carbon Majors](https://carbonmajors.org/briefing/Carbon-Majors-2024-Data-Update-35466)
traccia **34,7 Gt CO₂e nel 2024 a 166 soggetti**, e il 70% di tutta la CO₂
fossile dell'era industriale a 178. Ne bastano 32 per superare metà delle
emissioni mondiali.

Non è un doppio conteggio delle altre due schede: la CO₂ del petrolio la emette
chi lo brucia, questa lente dice chi l'ha estratto — la stessa quantità
guardata dall'altro capo della filiera, esattamente come la lente dei consumi.

Nella stessa scheda, **chi la confeziona**: i marchi ritrovati nei rifiuti
raccolti dai volontari del [Global Brand Audit](https://www.breakfreefromplastic.org/2024/02/07/bffp-movement-unveils-2023-global-brand-audit-results/)
— 8.804 volontari in 41 paesi, 537.719 pezzi contati. È l'altra faccia della
metrica «plastica mal gestita» sulla mappa: lì i paesi, qui le aziende. E la
classifica **non è per numero di pezzi** ma per quanti paesi diversi ritrovano
quel marchio: nel 2023 il secondo ne ha lasciati di più, ma in 30 paesi contro
40. Contare i pezzi premierebbe i posti dove si raccoglie meglio, non i marchi
più diffusi — e siccome la differenza non è ovvia, il pannello la scrive.

**Queste sono le uniche cifre del progetto copiate a mano.** Il CSV di Carbon
Majors è gratuito ma dietro un download interattivo che uno script non
attraversa (l'ho provato: torna la pagina HTML), e i brand audit escono solo in
PDF annuali. Quindi niente pipeline che finge di aggiornarsi da sola: ci sono i
numeri dei comunicati, con anno e link accanto a ciascuno, e il pannello dice
che sono trascritti.

### Cosa posso fare

Il contrasto che regge la sezione, da [Wynes & Nicholas 2017](https://iopscience.iop.org/article/10.1088/1748-9326/aa7541):
vivere senza auto vale **2,4 t/anno**, cambiare le lampadine **0,10**. Le due
azioni che tutte le campagne citano — riciclare e le lampadine — stanno in
fondo, e nel pannello sono marcate come «raccomandate» proprio per rendere
visibile lo scarto fra quello che ci dicono di fare e quello che pesa.

Le barre non sono in scala fra loro: la traccia è lunga quanto **una persona
media del mondo** (5,29 t, dal riferimento mondiale del dataset dell'app), con
un segno alla quota compatibile con 1,5 °C. Così si vede a occhio che nemmeno
la scelta più grossa copre metà di quello che emette una persona media — e che
vivere senza auto risparmia più dell'intera quota equa annuale di una persona.

**Una voce è esclusa apposta.** Lo stesso studio mette in cima «un figlio in
meno» a 58,6 t/anno: è la cifra più contestata del lavoro, perché attribuisce a
chi genera una quota delle emissioni future di tutti i discendenti, con una
convenzione contabile che non si applica a nient'altro qui dentro. Il pannello
dice che esiste e perché non c'è, invece di toglierla in silenzio.

E poi la parte che tiene insieme le due sezioni. Se «cosa posso fare» sta
accanto a «178 soggetti hanno estratto il 70% di tutto» senza un ponte, l'app si
contraddice da sola. Il ponte è storico e documentato: l'idea di *impronta di
carbonio personale* come misura di responsabilità individuale è stata resa
popolare da una campagna pubblicitaria di **BP del 2004**. Dirlo non serve a
togliersi la responsabilità, serve a vedere dove sta la leva — e infatti la
sezione finisce con le leve che **non si misurano in tonnellate**: voto, dove
stanno i soldi, parlarne, fare cose che si vedono. Lì non ci sono numeri, ed è
deliberato: dare un valore in tonnellate al voto vorrebbe dire inventarlo.
L'unico numero che gira in quel campo — «spostare la pensione è 21 volte più
efficace» — è di campagna, non di letteratura, e il pannello lo dice.

Ultimo passo: il rimando al pannello progetti che l'app ha già, dove «fai
qualcosa» smette di essere un luogo comune perché sotto c'è un elenco di
iniziative vere, con gli URL verificati contro le citazioni reali.

## Renderlo personale, e non lasciarlo senza uscita

Le ultime aggiunte non portano dati nuovi sul tavolo per il gusto di portarli:
rispondono ai due modi in cui un'app così perde le persone. O resta astratta —
e allora non riguarda nessuno — o schiaccia, e allora chi legge smette di
guardare.

### Da quando ci sei tu

Nel pannello di un luogo si scrive l'anno di nascita e la stessa serie che
disegna il grafico viene riletta con un'altra origine: quanto si è scaldato
**questo punto** da allora, e quanti dei dieci anni più caldi mai misurati lì
cadono dentro una vita sola.

Zero richieste in più — è la cella di griglia già caricata. Il confronto è fra
il **decennio attorno** alla nascita e l'ultimo decennio, non fra due anni
singoli: un anno secco è rumore meteorologico e il confronto sarebbe col caso.
L'anno resta in `localStorage` e non entra mai nell'URL: è l'unico dato
personale che l'app tocca, e un link condiviso non se lo deve portare dietro.

### Quanto tempo resta

Nel pannello delle azioni, accanto alle leve e mai da solo — un conto alla
rovescia senza una leva vicino produce fatalismo, che è l'opposto di quello che
quella schermata sta cercando di fare.

Il bilancio viene da [Indicators of Global Climate Change 2024](https://essd.copernicus.org/articles/17/2641/2025/)
(130 Gt CO₂ dall'inizio del 2025, 50% di probabilità di restare sotto 1,5 °C);
il **ritmo di consumo no**: sono i 43,2 Gt che escono dal riferimento mondiale
di `co2-countries.json`, fossili più uso del suolo. Le due cifre restano così
coerenti fra loro e il conto si può rifare a mano.

Il numero mostrato è **già al netto di quanto è stato emesso dal 2025** — e la
didascalia lo dice, perché "130 Gt residue dall'inizio del 2025" accanto a
"1,4 anni" senza quella riga sembra una contraddizione invece che una
sottrazione.

### Quasi tutti sono d'accordo, e quasi nessuno lo sa

Su 130.000 persone in 125 paesi ([Andre et al., *Nature Climate Change* 2024](https://www.uni-bonn.de/en/news/weltweite-befragung-zeigt-breite-mehrheit-der-weltbevoelkerung-fuer-den-klimaschutz)):
il 69% è disposto a versare l'1% del proprio reddito, l'86% condivide le norme
pro-clima, l'89% chiede più azione politica — **e tutti sottostimano gli
altri**.

È il risultato meglio documentato della letteratura sul comportamento
climatico, e spiega perché «parlarne» sta fra le leve e non fra i modi di dire:
le persone agiscono in modo condizionale, quindi credere di essere in minoranza
quando si è nell'89% è già di per sé un freno.

Le cifre per paese non sono in nessun dataset aperto che sia riuscito a
trovare: qui ci sono quelle globali, trascritte come i produttori.

### Il bivio, e quello che sta già funzionando

Un pannello nuovo, e l'ordine delle due sezioni conta. Prima **dove porta questa
strada**: i cinque scenari SSP dell'IPCC a fine secolo, da 1,4 a 4,4 °C. Poi
**quello che è già cambiato** — al contrario, la seconda sembrerebbe una
consolazione dopo la brutta notizia; così com'è, è la risposta alla domanda che
il bivio lascia aperta.

Sugli scenari c'è una trappola che ho evitato di proposito: l'IPCC misura sul
**1850-1900**, la mappa di quest'app sul **1951-1980**. Sono due zeri diversi, e
attaccare le proiezioni in coda alla linea del tempo avrebbe sommato un quarto
di grado facendo finta di niente. Per questo gli scenari vivono in un grafico
separato con la base scritta accanto. E siccome l'IPCC pubblica tre finestre
ventennali e non un valore per anno, le bande sono l'intervallo *molto
probabile* e i segmenti fra i punti sono dichiarati come collegamento, non dati.

Poi i numeri che quasi nessuno conosce, tutti da `npm run data:progress` in
2,2 KB:

| | |
|---|---|
| Fotovoltaico | **−99,8%** dal 1975: da 128,27 a 0,26 dollari per watt |
| Solare installato | da 1,2 GW nel 2000 a **1.866 GW** nel 2024 |
| Costo del kWh solare | −90% dal 2010; eolico a terra −91% dal 1984 |
| Elettricità rinnovabile | 33,8% del mondo nel 2025 |

Con un dettaglio che tengo apposta: **idroelettrico e geotermico sono
rincarati**. La storia non è «tutto è diventato economico», è che due
tecnologie nuove sono crollate mentre le vecchie no — ed è una storia più utile,
perché dice dove ha funzionato la curva di apprendimento e dove no.

## Fonti

- [NASA GISTEMP v4](https://data.giss.nasa.gov/gistemp/) — GHCNv4 + ERSSTv5, smoothing 1200 km
- [Open-Meteo](https://open-meteo.com/) — archivio ERA5 e geocoding
- [Climate Watch / WRI](https://ourworldindata.org/emissions-by-sector) — emissioni per settore, 2016
- [Our World in Data · Global Carbon Budget](https://ourworldindata.org/co2-dataset-sources) — emissioni per paese, combustibili, energia pro capite
- [Jones et al. (2024), via OWID](https://ourworldindata.org/contributed-most-global-warming) — gradi di riscaldamento attribuibili a ogni paese
- [Natural Earth](https://www.naturalearthdata.com/) — confini 1:110m
- [Open-Meteo Air Quality](https://open-meteo.com/en/docs/air-quality-api) — PM2.5 orario, modello CAMS
- [Banca Mondiale · WDI](https://data.worldbank.org/) — PM2.5, mortalità da inquinamento dell'aria, stress idrico (dati OMS e FAO)
- [Our World in Data](https://ourworldindata.org/plastic-pollution) — plastica mal gestita (Meijer et al. 2021) e azoto (FAO)
- [Richardson et al., Science Advances 2023](https://www.science.org/doi/10.1126/sciadv.adh2458) — i nove confini planetari
- [Planetary Health Check 2025](https://www.planetaryhealthcheck.org/) — stato dei confini (PIK)
- [Carbon Majors](https://carbonmajors.org/) — emissioni per produttore di fossili e cemento (InfluenceMap)
- [Break Free From Plastic](https://www.breakfreefromplastic.org/) — brand audit globale della plastica
- [IPCC AR6 WGI](https://www.ipcc.ch/report/ar6/wg1/) — scenari SSP, tabella SPM.1
- [Forster et al. · Indicators of Global Climate Change 2024](https://essd.copernicus.org/articles/17/2641/2025/) — bilancio di carbonio residuo
- [Andre et al. · Nature Climate Change 2024](https://www.uni-bonn.de/en/news/weltweite-befragung-zeigt-breite-mehrheit-der-weltbevoelkerung-fuer-den-klimaschutz) — sostegno reale e percepito all'azione climatica
- [Our World in Data · energia](https://ourworldindata.org/energy) — prezzi e capacità delle rinnovabili (IRENA, Ember)
- [Wynes & Nicholas 2017](https://iopscience.iop.org/article/10.1088/1748-9326/aa7541) e [Ivanova et al. 2020](https://iopscience.iop.org/article/10.1088/1748-9326/ab8589) — efficacia delle azioni individuali
- Fonti per uso finale: [UNEP](https://www.unep.org/resources/publication/2022-global-status-report-buildings-and-construction) (edifici) · [Poore & Nemecek](https://www.science.org/doi/10.1126/science.aaq0216) (cibo) · [Lenzen et al.](https://www.nature.com/articles/s41558-018-0141-x) (turismo) · [HCWH](https://noharm-global.org/documents/health-care-climate-footprint-report) (sanità) · [McKinsey & GFA](https://www.mckinsey.com/industries/retail/our-insights/fashion-on-climate) (moda) · [Freitag et al.](https://www.cell.com/patterns/fulltext/S2666-3899(21)00188-4) (digitale)
- [CARTO](https://carto.com/basemaps/) — basemap
