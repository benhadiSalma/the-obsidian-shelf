# The Obsidian Shelf

> **Een fictieve romantasy-boekhandel met een eigen REST API en een interactieve website.**  
> Project voor *Application Architecture*.

**Backend:** PHP 8.3+ · Laravel 13 · SQLite · Sanctum  
**Frontend:** HTML5 · CSS3 · JavaScript · Fetch API  
**Testing:** PHPUnit · Node.js Test Runner

---

## Inhoud

1. [Over het project](#over-het-project)
2. [Functionaliteiten](#functionaliteiten)
3. [Architectuur en projectstructuur](#architectuur-en-projectstructuur)
4. [Installatie en lokaal uitvoeren](#installatie-en-lokaal-uitvoeren)
5. [API-overzicht](#api-overzicht)
6. [Testing](#testing)
7. [Deployment](#deployment)
8. [Projectdocumentatie](#projectdocumentatie)
9. [Bronnen en AI-gebruik](#bronnen-en-ai-gebruik)
10. [Beperkingen](#beperkingen)

---

## Over het project

**The Obsidian Shelf** is een fictieve boekwinkel voor fantasy- en romantasyboeken, met een visuele stijl geïnspireerd op *dark academia*, oude manuscripten en een koninklijke bibliotheek.

Bezoekers kunnen boeken ontdekken en details en reviews bekijken. Na registratie of login kunnen gebruikers boeken reserveren, een wishlist beheren, hun profiel aanpassen en reviews plaatsen volgens de toegangsregels.

De applicatie bestaat bewust uit **twee afzonderlijke deelprojecten**:

- Een **Laravel-backend** die de gegevens, bedrijfsregels en REST API beheert.
- Een **HTML/CSS/JavaScript-frontend** die met de backend communiceert via HTTP-verzoeken en JSON.

Dit is een **schoolproject**. De winkel is fictief en demonstratiereviews worden aangeduid met `[Demo review]`.

## Functionaliteiten

| Onderdeel | Wat kan de gebruiker doen? |
| --- | --- |
| **Catalogus** | Boeken bekijken en zoeken op titel, auteur, ISBN en tropes. |
| **Boekdetails** | Omschrijving, prijs, voorraad en reviews bekijken. |
| **Account** | Registreren, inloggen, uitloggen en profiel wijzigen. |
| **Reserveren** | Een boek reserveren zolang er voorraad is; de stock daalt met één. |
| **Afhaling** | Bevestiging ontvangen met een afhaaltermijn van zeven dagen; betaling bij afhaling. |
| **Annuleren** | Een bevestigde reservering binnen 24 uur annuleren; de stock stijgt opnieuw. |
| **Wishlist** | Boeken toevoegen aan en verwijderen uit een persoonlijke lijst. |
| **Reviews** | Een score van 1–5 en tekst plaatsen na een geldige reservering, maximaal één review per gebruiker per boek. |

### Belangrijke bedrijfsregels

- Een ISBN is uniek.
- Een boek met **stock = 0** kan niet worden gereserveerd.
- Het aanmaken en annuleren van een reservering gebeurt binnen een **databasetransactie**.
- Alleen de ingelogde eigenaar mag zijn reservering binnen **24 uur** annuleren.
- Bij een succesvolle annulering krijgt de reservering de status `cancelled` en wordt de stock één keer teruggegeven.
- De opdracht vereenvoudigt de aankoopflow: gereserveerde boeken worden verondersteld te worden afgehaald en betaald.

## Architectuur en projectstructuur

```text
the-obsidian-shelf/
│
├── README.md
├── docs/
│   ├── API.md
│   ├── ARCHITECTURE.md
│   ├── PLANNING.md
│   └── TESTING.md
│
├── backend/
│   ├── app/
│   │   ├── Http/Controllers/Api/
│   │   ├── Models/
│   │   └── Services/ReservationService.php
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/
│   ├── routes/api.php
│   └── tests/Feature/
│
└── frontend/
    ├── index.html
    ├── style.css
    ├── config.js
    ├── script.js
    └── tests/api.test.cjs
```

### Design patterns en verantwoordelijkheden

| Patroon / onderdeel | Toepassing |
| --- | --- |
| **MVC** | Laravel-controllers verwerken verzoeken; Eloquent-models beheren de data. |
| **DAO** | `BookstoreDAO` in `frontend/script.js` centraliseert de HTTP-communicatie. |
| **Service Layer** | `ReservationService` bevat de bedrijfsregels voor reserveren en annuleren. |
| **Dependency Injection** | Laravel injecteert `ReservationService` in `ReservationController`. |
| **ORM** | Eloquent beheert relaties tussen boeken, gebruikers, reserveringen en reviews. |
| **Transaction** | Voorraadwijzigingen en reserveringen worden samen verwerkt. |

De frontend communiceert **uitsluitend via de REST API** met de backend. De SQLite-database is niet rechtstreeks bereikbaar vanuit de browser.

Voor een uitgebreider schema: [Architectuurdocumentatie](docs/ARCHITECTURE.md).

## Installatie en lokaal uitvoeren

### Vereisten

- PHP **8.3 of nieuwer**, met SQLite-ondersteuning
- Composer
- Node.js (voor de frontendtests)
- Git
- Een browser

### Stap 1 — Backend installeren

Open **Windows CMD** in de hoofdmap van het project.

```cmd
cd backend
composer install
```

**Alleen bij een eerste installatie**, wanneer `.env` nog niet bestaat:

```cmd
copy .env.example .env
php artisan key:generate
```

Controleer dat in `backend/.env` een SQLite-verbinding ingesteld is. Maak indien nodig een leeg bestand `backend/database/database.sqlite` aan.

Voer vervolgens uit:

```cmd
php artisan migrate
php artisan db:seed
```

> **Let op:** gebruik geen `php artisan migrate:fresh` op een bestaande database, want deze opdracht verwijdert gegevens.

### Stap 2 — Laravel starten

Voer vanuit `backend/` uit:

```cmd
php artisan serve --host=127.0.0.1 --port=8000
```

Laat dit terminalvenster open.

**Test de API:** <http://127.0.0.1:8000/api/books>

### Stap 3 — Frontend starten

De frontend en backend zijn twee afzonderlijke applicaties. Om alle functionaliteiten te gebruiken, moet de Laravel-backend actief zijn.

**Eerst de backend starten**

Open een terminal in de map `backend/`:

```cmd
php artisan serve --host=127.0.0.1 --port=8000
```

Laat deze terminal open.

Controleer of de API werkt via:

http://127.0.0.1:8000/api/books

Als de boeken als JSON worden weergegeven, werkt de verbinding met de backend.

#### Optie 1 — Via Live Server (aanbevolen)

1. Open het project in Visual Studio Code.
2. Installeer indien nodig de extensie **Live Server** van Ritwick Dey.
3. Open `frontend/index.html`.
4. Klik met de rechtermuisknop en kies **Open with Live Server**.
5. De website opent automatisch in de browser, meestal op poort 5500.

#### Optie 2 — Via de ingebouwde PHP-server

Als alternatief kan de frontend zonder VS Code-extensie gestart worden.

Open een tweede terminal in de **hoofdmap van het project** en voer uit:

```cmd
php -S 127.0.0.1:5500 -t frontend
```

Open daarna:

http://127.0.0.1:5500/

Let op: voer deze opdracht uit vanuit `the-obsidian-shelf/` en niet vanuit `backend/`.

#### Mogelijke problemen oplossen

**De boeken of reviews worden niet geladen**

Controleer of Laravel nog actief is op poort 8000 en of http://127.0.0.1:8000/api/books bereikbaar is.

De API-configuratie staat in `frontend/config.js`:

```javascript
window.OBSIDIAN_API_BASE_URL = 'http://127.0.0.1:8000/api';
```

**De pagina wordt voortdurend vernieuwd met Live Server**

Controleer of Live Server automatisch wijzigingen in bestanden detecteert. Stop Live Server en probeer eventueel optie 2 met de ingebouwde PHP-server.

**De CSS of afbeeldingen worden niet geladen**

Controleer of je de correcte frontend-URL gebruikt en of `frontend/style.css` aanwezig is. Vernieuw de pagina met `Ctrl + F5`.

Bij optie 2 moet de website geopend worden via `http://127.0.0.1:5500/`.

**Poort 5500 is al in gebruik**

Stop eerst Live Server of de andere frontendserver voordat je dezelfde poort opnieuw gebruikt.

**Belangrijk:** beide methoden zijn bedoeld om het project lokaal uit te voeren. Voor een publieke deployment moeten geschikte webservers worden gebruikt. Zie de aparte sectie *Deployment*.
```

### Optioneel — Demonstratiereviews

Voor een lokale demonstratie kunnen extra fictieve reviews aangemaakt worden:

```cmd
cd backend
php artisan db:seed --class=DemoReviewSeeder
```

Deze gegevens zijn bedoeld **voor demonstraties, niet voor productie**.

## API-overzicht

Alle routes beginnen met `/api`.

| Methode | Endpoint | Toegang |
| --- | --- | --- |
| `GET` | `/books` | Publiek |
| `GET` | `/books/{book}` | Publiek |
| `POST` | `/register` | Publiek |
| `POST` | `/login` | Publiek |
| `GET` | `/me` | Ingelogd |
| `PATCH` | `/me` | Ingelogd |
| `POST` | `/logout` | Ingelogd |
| `GET` | `/reservations` | Ingelogd |
| `POST` | `/reservations` | Ingelogd |
| `DELETE` | `/reservations/{reservation}` | Eigenaar |
| `GET` | `/wishlist` | Ingelogd |
| `POST` | `/wishlist/toggle` | Ingelogd |
| `POST` | `/books/{book}/reviews` | Ingelogd |

Beveiligde endpoints vereisen een **Sanctum Bearer-token**.

Requestvoorbeelden, antwoorden en statuscodes: **[API-documentatie](docs/API.md)**.

## Testing

De testbestanden zijn gescheiden per deelproject:

| Deelproject | Testbestand | Doel |
| --- | --- | --- |
| Backend | `backend/tests/Feature/BookstoreApiTest.php` | Registratie, login, catalogus, voorraad, reserveringen, reviews en profiel. |
| Backend | `backend/tests/Feature/ReservationCancellationTest.php` | Annulering binnen/buiten 24 uur, eigenaarschap en voorraadherstel, indien toegevoegd aan de repository. |
| Frontend | `frontend/tests/api.test.cjs` | HTTP-aanroepen, foutafhandeling en gedrag van de DAO. |

**Backendtests** — vanuit `backend/`:

```cmd
php artisan test
```

**Frontendtests** — vanuit de hoofdmap:

```cmd
node --test frontend\tests\api.test.cjs
```

**Syntaxcontrole:**

```cmd
node --check frontend\script.js
```

Voor de effectieve resultaten en de handmatige testscenario's: **[Testdocumentatie](docs/TESTING.md)**.

## Deployment

Omdat het project **geen Java-applicatie** is, volgt hieronder een beknopte productiehandleiding.

### Backend (Laravel)

1. Gebruik een server met PHP 8.3+, Composer, HTTPS en een geschikte database.
2. Installeer de dependencies in `backend/`:

   ```bash
   composer install --no-dev --optimize-autoloader
   ```

3. Configureer `backend/.env` met de productie-URL, database-instellingen en een veilige `APP_KEY`. Stel `APP_ENV=production` en `APP_DEBUG=false` in.
4. Configureer Apache of Nginx met **`backend/public/` als document root**.
5. Geef Laravel schrijfrechten op `storage/` en `bootstrap/cache/`.
6. Voer de migraties uit:

   ```bash
   php artisan migrate --force
   php artisan config:cache
   ```

### Frontend (statische website)

1. Host de bestanden in `frontend/` via een HTTPS-webserver of statische hosting.
2. Pas `frontend/config.js` aan zodat deze naar de **publieke API-URL** verwijst.
3. Stel de toegestane frontend-origin in via `backend/config/cors.php`.
4. Controleer catalogus, registratie, login, reservaties en voorraadwijzigingen in de browser.

**Belangrijk:** `php artisan serve` en `php -S` zijn voor lokaal ontwikkelen, niet voor publieke productie. Publiceer nooit `.env` of echte toegangstokens.

## Projectdocumentatie

| Document | Inhoud |
| --- | --- |
| [API.md](docs/API.md) | Routes, requests, responses en foutcodes. |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Componenten, lagen, design patterns en datastroom. |
| [PLANNING.md](docs/PLANNING.md) | Projectplanning en voortgang. |
| [TESTING.md](docs/TESTING.md) | Testscenario's, edge cases en testcommando's. |

## Bronnen en AI-gebruik

### Eigen eerder project — inspiratie voor het design

**[The Silken Manuscript — GitHub](https://github.com/benhadiSalma/The-Silken-Manuscript)**

Dit is mijn **eerdere project voor het vak Backend Web**. Het diende als referentie en inspiratie voor de **visuele uitwerking** van The Obsidian Shelf: het *dark-academia*-thema, het manuscriptgevoel, de koninklijke bibliotheeksfeer en de vormgeving met donkere kleuren, goudaccenten en klassieke typografie.

The Obsidian Shelf is voor deze opdracht uitgewerkt als een **afzonderlijke frontend en Laravel REST API**, in tegenstelling tot de opbouw van het eerdere project.

### AI-tools

**[ChatGPT — OpenAI](https://chatgpt.com/)**

ChatGPT werd gebruikt als hulpmiddel bij:

- het begrijpen en structureren van de opdracht;
- het bespreken en verbeteren van PHP-, Laravel- en JavaScript-code;
- het opsporen van fouten en voorstellen van oplossingen;
- het uitwerken van reserveringsregels en testscenario's;
- het opstellen en verbeteren van documentatie.

### Technische referenties

- [Laravel Documentation](https://laravel.com/docs) — Laravel, routing, Eloquent, migrations en testing.
- [Laravel Sanctum](https://laravel.com/docs/sanctum) — authenticatie met API-tokens.
- [PHP Documentation](https://www.php.net/docs.php) — PHP-taal en standaardbibliotheek.
- [MDN Web Docs — Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) — HTTP-communicatie in JavaScript.
- [Node.js Test Runner](https://nodejs.org/api/test.html) — JavaScript-testomgeving.
- [Google Fonts](https://fonts.google.com/) — Playfair Display en Lora.
- [Transparent Textures](https://www.transparenttextures.com/) — achtergrondtextuur gebruikt in het CSS-ontwerp.



## Beperkingen

- Er is geen online betalingssysteem; betaling gebeurt volgens het projectscenario bij afhaling.
- Voorraad en afhaling worden vereenvoudigd volgens de opdracht.
- Het project is ontwikkeld voor een lokale schooldemonstratie.

---

