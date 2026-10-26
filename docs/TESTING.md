# TESTING — The Obsidian Shelf

> Testverslag voor **Application Architecture**.  
> Laatste update: **26 oktober 2026**.

[← README](../README.md) · [API](API.md) · [Architectuur](ARCHITECTURE.md) · [Planning](PLANNING.md)

---

## 1. Doel en teststrategie

The Obsidian Shelf is opgebouwd uit een **Laravel REST API** (backend) en een **HTML/CSS/JavaScript-frontend**. De tests controleren of de belangrijkste functionaliteiten, toegangsrechten en bedrijfsregels correct werken.

De testaanpak bestaat uit:

- **Backend feature tests:** HTTP-responses, validatie, authenticatie, databasewijzigingen en grensgevallen.
- **Frontendtests:** gedrag van `BookstoreDAO`, API-verzoeken, verwerking van fouten en bijwerken van de interface.
- **Manuele browsertests:** de volledige gebruikersflow in de echte website met een draaiende Laravel-server.

De Laravel-tests gebruiken `RefreshDatabase` met **SQLite `:memory:`**. Daardoor wordt de gewone lokale database met demonstratieboeken niet gewist.

---

## 2. Bevestigde automatische testresultaten

**Uitgevoerd op 23 en 26 oktober 2026 in Windows CMD.** De onderstaande resultaten zijn bevestigd met terminaluitvoer. De backendtests dateren van 23 oktober; de nieuwe frontendtests van 26 oktober.

| Controle | Resultaat |
| --- | --- |
| Laravel: `php artisan test` | **21 geslaagd, 103 assertions** |
| Privacytest afzonderlijk | **1 geslaagd, 7 assertions** |
| Frontend: `node --test frontend\tests\api.test.cjs` | **15 geslaagd, 0 mislukt** op 26/10 |
| JavaScript-syntax: `node --check frontend\script.js` | **Geen syntaxfouten** |

### Volledige Laravel-testsuite

Vanuit `backend/`:

```cmd
php artisan test
```

Bevestigde uitvoer:

```text
Tests: 21 passed (103 assertions)
Duration: 6.81s
```

### Privacytest afzonderlijk

Vanuit `backend/`:

```cmd
php artisan test --filter=BookReviewPrivacyTest
```

Bevestigde uitvoer:

```text
Tests: 1 passed (7 assertions)
Duration: 5.47s
```

**Belangrijk:** deze privacytest maakt al deel uit van de 21 Laravel-tests en wordt dus niet dubbel geteld.

### Frontendtests

Vanuit de hoofdmap van het project:

```cmd
node --check frontend\script.js
for %f in (frontend\js\*.js) do @node --check "%f"
node --test frontend\tests\api.test.cjs
```

Bevestigde uitvoer op 26 oktober 2026:

```text
tests 15
pass 15
fail 0
cancelled 0
skipped 0
```

**Actueel totaal: 36 geslaagde automatische tests** (21 backendtests + 15 frontendtests; op twee verschillende data bevestigd). De backend telt **103 assertions**. Er zijn geen mislukte tests gerapporteerd.

---

### Herstructurering op 26 oktober 2026

De 12 bestaande frontendscenario's blijven aanwezig. Er zijn **3 aanvullende architectuurtests** toegevoegd: scriptvolgorde, scheiding van API- en DOM-code en verdeling van UI-verantwoordelijkheden. Alle **15 frontendtests zijn geslaagd**.

De backend is niet gewijzigd. De eerder bevestigde Laravel-suite blijft **21 tests en 103 assertions op 23 oktober 2026**. Na de herstructurering heeft de student het werkende systeem met de echte Laravel-backend gecontroleerd en als operationeel bevestigd. Dit was een **manuele controle**, geen geautomatiseerde browsertest.

---

## 3. Backend: scenario's en grensgevallen

### 3.1 `BookstoreApiTest.php` — 10 tests

| ID | Scenario | Verwacht resultaat |
| --- | --- | --- |
| BE-01 | Registratie zonder username | Validatie weigert de aanvraag |
| BE-02 | Catalogus zoeken op ISBN en filteren op voorraad | Correcte boeken worden teruggegeven |
| BE-03 | Niet-ingelogde gebruiker reserveert een boek | Aanvraag geweigerd (`401`) |
| BE-04 | Geldige reservering | Reservering aangemaakt, voorraad `-1`, afhaalgegevens bewaard |
| BE-05 | Reserveren bij voorraad `0` | Weigering; voorraad kan niet negatief worden |
| BE-06 | Catalogusprijs wijzigt na de reservering | `price_at_reservation` blijft onveranderd |
| BE-07 | Review zonder reservering of dubbele review | Review wordt geweigerd |
| BE-08 | Reviewscore buiten `1–5` | Validatiefout |
| BE-09 | Profiel wijzigen of bestaande username kiezen | Geldige wijziging opgeslagen; dubbele username geweigerd |
| BE-10 | Wishlist van verschillende gebruikers | Elke gebruiker ziet alleen zijn eigen wishlist |

**Resultaat:** 10 tests geslaagd.

### 3.2 `ReservationCancellationTest.php` — 8 tests

| ID | Scenario | Verwacht resultaat |
| --- | --- | --- |
| CAN-01 | Geldige reservering annuleren | Status `cancelled`, voorraad `+1` |
| CAN-02 | Annuleren na 23 uur en 59 minuten | Annulering toegestaan |
| CAN-03 | Annuleren precies na 24 uur | Weigering (`409`); voorraad blijft gelijk |
| CAN-04 | Tweemaal dezelfde reservering annuleren | Tweede annulering geweigerd; geen tweede voorraadverhoging |
| CAN-05 | Een andere gebruiker probeert te annuleren | Weigering (`404`) |
| CAN-06 | Niet-ingelogde gebruiker probeert te annuleren | Weigering (`401`) |
| CAN-07 | Een reeds afgehaald boek annuleren | Weigering (`409`) |
| CAN-08 | Review schrijven met alleen een geannuleerde reservering | Weigering (`403`) |

**Resultaat:** 8 tests geslaagd. Bij de eerder afzonderlijk uitgevoerde annulatiesuite werden **31 assertions** bevestigd. Deze tests zijn inbegrepen in de volledige Laravel-testsuite.

### 3.3 `BookReviewPrivacyTest.php` — 1 test

**SEC-01 — Publieke reviewgegevens**

Een bezoeker vraagt zonder login de detailgegevens van een boek met een review op via `GET /api/books/{book}`.

Verwacht resultaat:

- De review en de auteur zijn zichtbaar.
- Alleen `id`, `name` en `username` van de auteur worden teruggegeven.
- Het privé-e-mailadres van de auteur wordt **niet** opgenomen in de publieke JSON-response.

**Resultaat:** 1 test geslaagd, **7 assertions**.

### 3.4 Standaardtests — 2 tests

De standaardbestanden `tests/Unit/ExampleTest.php` en `tests/Feature/ExampleTest.php` slagen eveneens. Zij controleren een eenvoudige basisvoorwaarde en een succesvolle HTTP-response; ze vervangen de functionele tests van het project niet.

### Overzicht backend

| Testbestand | Tests |
| --- | ---: |
| `BookstoreApiTest.php` | 10 |
| `ReservationCancellationTest.php` | 8 |
| `BookReviewPrivacyTest.php` | 1 |
| Twee `ExampleTest.php`-bestanden | 2 |
| **Totaal** | **21** |

---

## 4. Frontend: testscenario's

**Bestand:** `frontend/tests/api.test.cjs`. De 12 tests hieronder zijn de oorspronkelijke scenario’s; op 26 oktober kwamen 3 architectuurcontroles bij.

| ID | Scenario | Verwacht resultaat |
| --- | --- | --- |
| FE-01 | Initialisatie | Start pas na `DOMContentLoaded` |
| FE-02 | Catalogus met meerdere pagina's | Alle pagina's worden verwerkt |
| FE-03 | Beveiligd API-verzoek | Correct Bearer-token in de header |
| FE-04 | Registratie | JSON wordt via `POST` verstuurd |
| FE-05 | Reservering | Correct `book_id`, geen paginareload |
| FE-06 | Wishlist en reviews | Correcte Laravel-routes |
| FE-07 | Laravel-validatiefouten | Foutmeldingen kunnen worden verwerkt |
| FE-08 | HTML-ID's | Geen verwijzingen naar ontbrekende elementen |
| FE-09 | Reservering annuleren | Correcte `DELETE`-route met token |
| FE-10 | Reviewrecht na annulering | Annulering geeft geen reviewrecht |
| FE-11 | Succesvolle annulering | Voorraad, status en tellers worden bijgewerkt |
| FE-12 | Teller `Purchases` | Geannuleerde reserveringen worden niet meegeteld |

### Extra architectuurtests na de herstructurering

| ID | Scenario | Verwacht resultaat |
| --- | --- | --- |
| FE-13 | Volgorde van scripts in `index.html` | Afhankelijkheden worden in de juiste volgorde geladen; geen dubbele scripts |
| FE-14 | Scheiding tussen DAO en DOM | `bookstore-dao.js` bevat API-/HTTP-code maar geen DOM-manipulatie |
| FE-15 | Kleine entrypoint en aparte verantwoordelijkheden | `script.js` start enkel de UI op; reservaties, reviews en accounts staan in featurebestanden |

**Oorspronkelijk resultaat (23 oktober):** 12 geslaagd. **Na herstructurering (26 oktober): 15 geslaagd, 0 mislukt**.

**Testbeperking:** deze tests gebruiken **gesimuleerde API-responses**. Ze controleren het JavaScript-gedrag, maar zijn geen automatische end-to-endtests met een echte Laravel-server en browser.

---

## 5. Manuele browsertests

De onderstaande controles zijn gebaseerd op de eerder gerapporteerde manuele scenario's. Op **26 oktober 2026** heeft de student daarnaast bevestigd dat de **herstructureerde applicatie met de echte backend operationeel is**. Voor manuele controles bestaat geen afzonderlijk automatisch testrapport.

### Catalogus en boekdetails

- [x] Boeken worden weergegeven met titel, auteur, prijs en voorraad.
- [x] Zoeken en filteren werken.
- [x] Boekdetails en bestaande reviews zijn zichtbaar.

### Accounts en persoonlijke gegevens

- [x] Registreren, aanmelden en afmelden werken.
- [x] Het profiel kan worden aangepast.
- [x] Een gebruiker kan zijn persoonlijke wishlist beheren.
- [x] Persoonlijke gegevens en reserveringen zijn niet zichtbaar voor andere gebruikers.

### Reserveringen en annuleringen

- [x] Een reservering verlaagt de voorraad met één.
- [x] De bevestiging toont de prijs en de afhaaltermijn.
- [x] Een geldige reservering kan binnen 24 uur worden geannuleerd.
- [x] Een succesvolle annulering wijzigt de status naar `cancelled` en herstelt de voorraad.
- [x] De geannuleerde reservering blijft zichtbaar in het profiel.
- [x] De teller `Purchases` telt geannuleerde reserveringen niet mee.

### Reviews en weergave

- [x] Een gebruiker met een geldige reservering kan een review plaatsen.
- [x] Een gebruiker zonder geldige reservering kan geen review plaatsen.
- [x] Publieke reviewgegevens bevatten geen privé-e-mailadres van de auteur.
- [x] De interface, formulieren en knoppen zijn bruikbaar op desktop en op een kleiner scherm.

---

## 6. Tests opnieuw uitvoeren

Open Windows CMD in de **hoofdmap** van `the-obsidian-shelf`:

```cmd
node --check frontend\script.js
for %f in (frontend\js\*.js) do @node --check "%f"
node --test frontend\tests\api.test.cjs
cd backend
php artisan test
```

Voor alleen de privacytest, vanuit `backend/`:

```cmd
php artisan test --filter=BookReviewPrivacyTest
```

**Let op:** voer voor deze tests geen `php artisan migrate:fresh` uit op de bestaande lokale database. De testomgeving gebruikt haar eigen SQLite-database in het geheugen.

De volledige opstartprocedure voor een manuele test staat in [README.md](../README.md#installatie-en-lokaal-uitvoeren).

---

## 7. Risico's, dekking en beperkingen

| Risico | Afdekking |
| --- | --- |
| Negatieve of foutieve voorraad | Voorraadcontroles, transacties en reserveringstests |
| Dubbele annulering | Statuscontrole en edge-casetest |
| Annulering na de deadline | Test op de grens van exact 24 uur |
| Onbevoegde toegang | Authenticatie- en eigenaarschapstests |
| Ongeldige of dubbele review | Validatie en reserveringscontrole |
| Lekken van persoonlijke gegevens | Privacytest voor publieke reviews |
| Foutieve interface na annulering | Frontendtests voor voorraad, status en tellers |

Niet alles is automatisch gedekt. Er zijn bijvoorbeeld geen afzonderlijke belastingstests of geautomatiseerde browsertests met een echt browserframework uitgevoerd. De twee Laravel-voorbeeldtests bieden bovendien weinig functionele dekking.

---

## 8. Eindconclusie

De resultaten zijn op **twee testmomenten** bevestigd:

- **Backend (23 oktober 2026):** 21 van de 21 tests geslaagd, **103 assertions**.
- **Frontend na opsplitsing (26 oktober 2026):** 15 van de 15 tests geslaagd, **0 mislukt**.
- **Syntaxcontrole `frontend/script.js` (26 oktober):** geen fouten.
- **Totaal van de laatst bevestigde suites:** **36 automatische tests** (21 backend + 15 frontend). De backend is tijdens de opsplitsing niet gewijzigd.

De student heeft na de opsplitsing bevestigd dat de website met de echte backend werkt. Dat is een manuele verificatie en geen geautomatiseerde end-to-endtest.

De tests controleren de belangrijkste bedrijfsregels, inclusief voorraadbeheer, toegangsrechten, reserveringen, annuleringen, reviews en de bescherming van privégegevens. De manuele controles vullen de automatische tests aan, maar vormen geen vervanging voor geautomatiseerde end-to-endtests.

**Bronnen en AI-gebruik:** [README — Bronnen en AI-gebruik](../README.md#bronnen-en-ai-gebruik).
