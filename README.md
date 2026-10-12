# Metronom de trupă

Metronom sincronizat pentru repetiții. Toată trupa deschide același link, scrie același cod de cameră, iar liderul setează tempoul pentru toți. Nu e nevoie de cont.

## Ce e în arhivă

- `server.js` – serverul. Servește pagina și ține camerele și tempoul.
- `public/index.html` – pagina metronomului.
- `package.json` – îi spune hostului cum pornește serverul.

## Pasul 1 – Pune codul pe GitHub (aprox. 3 minute)

1. Fă-ți cont gratuit pe https://github.com și loghează-te.
2. Apasă **+** (dreapta sus) → **New repository**.
3. La nume scrie `metronom-trupa`. Poate fi Public sau Private. Apasă **Create repository**.
4. Pe pagina nouă apasă linkul **uploading an existing file**.
5. Dezarhivează arhiva primită și trage în fereastră fișierele `server.js`, `package.json`, `README.md` **și folderul `public`** (cu tot cu el).
6. Jos apasă **Commit changes**.

Verifică: în repo trebuie să vezi `server.js`, `package.json` și folderul `public` cu `index.html` înăuntru.

## Pasul 2 – Pornește serverul pe Render (aprox. 5 minute)

1. Intră pe https://render.com și alege **Get Started**. Cel mai simplu e să te loghezi direct cu contul de GitHub.
2. Apasă **New +** → **Web Service**.
3. Alege repo-ul `metronom-trupa`. Dacă nu apare, apasă **Configure account** și dă-i lui Render acces la el.
4. Completează:
   - **Name:** `metronom-trupa` (din el se face adresa)
   - **Region:** Frankfurt (EU Central), cel mai aproape de România
   - **Runtime / Language:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free
5. Apasă **Create Web Service** și așteaptă 1–3 minute, până apare **Live**.
6. Sus vezi adresa, de forma `https://metronom-trupa.onrender.com`. Acesta e linkul pentru trupă.

## Pasul 3 – Folosirea

- Liderul deschide linkul, scrie numele și un cod de cameră (de ex. `repetitie-joi`), opțional un PIN, și apasă **Creez camera și conduc eu**.
- Cu **Copiază linkul**, codul camerei intră direct în link. Trimite-l pe grupul trupei.
- Ceilalți deschid linkul, scriu numele, lasă PIN-ul gol și apasă **Intru în cameră**.
- Fiecare apasă o dată **Activează sunetul**.
- În lista „În cameră”, fiecare membru are afișată precizia sincronizării. Verde înseamnă bine.

## De știut

- **Planul Free de la Render adoarme** după o perioadă fără vizitatori. La prima deschidere după pauză, pagina poate porni greu, uneori până la un minut. Deschide linkul cu un minut înainte de repetiție. Detaliile planului gratuit se pot schimba, așa că verifică-le pe render.com.
- **PIN-ul** protejează doar rolul de lider. Fără PIN, oricine din cameră poate prelua tempoul. Cu PIN, poate prelua doar cine îl știe.
- Dacă un telefon a stat blocat, se resincronizează singur când îl deschizi.
- Pe iPhone, butonul fizic de silențios poate opri sunetul.
- **Actualizări:** dacă modifici fișierele pe GitHub, Render repornește singur serverul cu versiunea nouă.

## Rulare pe calculatorul tău (opțional)

Cu Node.js 18+ instalat:

```
npm install
npm start
```

Apoi deschide http://localhost:3000. Telefoanele din aceeași rețea Wi-Fi pot intra pe `http://IP-ul-calculatorului:3000`. Sunetul poate cere HTTPS pe unele telefoane, de aceea varianta Render e mai sigură.
