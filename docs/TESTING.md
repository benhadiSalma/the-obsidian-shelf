# TESTING — The Obsidian Shelf

> Testverslag voor **Application Architecture**.  
> Laatste update: **27 oktober 2026** (testuitvoering: 26 oktober).

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

De student heeft op **26 oktober 2026 de volledige bijgewerkte Laravel-testsuite tweemaal succesvol uitgevoerd**. De resultaten zijn bevestigd door de uitvoer van `php artisan test`. De frontendtests zijn op dezelfde datum uitgevoerd op een gecontroleerde kopie van de opgesplitste frontend.

| Controle | Bevestigd resultaat |
| --- | --- |
| Backend Laravel/PHPUnit (26/10) | **23 tests geslaagd, 118 assertions, 0 mislukt**; tweemaal uitgevoerd |
| Annuleringstests | **10 geslaagd**, waaronder CAN-09 en CAN-10; inbegrepen in de 23 |
| Privacytest | **1 geslaagd**; inbegrepen in de 23 |
| Frontend Node.js Test Runner (26/10) | **16 geslaagd, 0 mislukt**; gecontroleerde kopie |
| JavaScript-syntax | **Geen syntaxfouten vastgesteld** |
| **Totaal geautomatiseerde tests** | **39 geslaagd** (23 backend + 16 frontend) |

### Volledige Laravel-testsuite

Vanuit `backend/`:

```cmd
php artisan test
```

Bevestigde uitvoer op 26 oktober 2026 (twee succesvolle runs):

```text
Tests:    23 passed (118 assertions)
Duration: 6.07s

Tests:    23 passed (118 assertions)
Duration: 5.80s
```

### Privacytest afzonderlijk

Vanuit `backend/`:

```cmd
php artisan test --filter=BookReviewPrivacyTest
```

De privacytest is eveneens opgenomen in de volledige suite. **Deze wordt niet dubbel geteld**.

### Frontendtests

Vanuit de hoofdmap van het project:

```cmd
node --check frontend\script.js
for %f in (frontend\js\*.js) do @node --check "%f"
node --test frontend\tests\api.test.cjs
```

Bevestigde uitvoer op de gecontroleerde kopie van 26 oktober 2026:

```text
tests 16
pass 16
fail 0
cancelled 0
skipped 0
```

**Afbakening:** de JavaScript-tests gebruiken simulaties van API-antwoorden. Er is geen afzonderlijke geautomatiseerde browser-end-to-endtest met de echte Laravel-server gedocumenteerd.

---

### Herstructurering op 26 oktober 2026

De 12 bestaande frontendscenario's blijven aanwezig. Er zijn **4 aanvullende architectuurtests** toegevoegd: scriptvolgorde, scheiding van API- en DOM-code, verdeling van UI-verantwoordelijkheden en injecteerbare afhankelijkheden. Alle **16 frontendtests zijn geslaagd**.

Na de modulaire frontendherstructurering is op 26 oktober ook de backend aangepast om bestaande reviews correct te verwerken bij annulering. Beide nieuwe testmethoden zijn opgenomen in de **tweemaal geslaagde** Laravel-suite van 23 tests en 118 assertions. De student heeft de website met Laravel eerder als operationeel bevestigd. Een afzonderlijke geautomatiseerde browser-end-to-endtest is niet uitgevoerd.

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

### 3.2 `ReservationCancellationTest.php` — 10 tests

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
| CAN-09 | Een review plaatsen en daarna de laatste geldige reservering annuleren | Bestaande review wordt verwijderd; stock wordt hersteld |
| CAN-10 | Twee geldige reserveringen voor hetzelfde boek; één annuleren na plaatsing van een review | Review blijft bestaan, zolang de andere reservering `confirmed` is |

**Status (26 oktober 2026): alle 10 annuleringstests geslaagd**, inclusief CAN-09 en CAN-10. Ze maken deel uit van de volledige Laravel-suite met **23 geslaagde tests en 118 assertions**.

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
| `ReservationCancellationTest.php` | 10 |
| `BookReviewPrivacyTest.php` | 1 |
| Twee `ExampleTest.php`-bestanden | 2 |
| **Totaal geslaagd in de actuele testsuite** | **23** |

**Bevestigd door twee volledige uitvoeringen op 26 oktober 2026: 23 tests geslaagd, 118 assertions.**

---

## 4. Frontend: testscenario's

**Bestand:** `frontend/tests/api.test.cjs`. De 12 tests hieronder zijn de oorspronkelijke scenario’s; op 26 oktober kwamen 4 architectuurcontroles bij.

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
| FE-15 | Klein opstartbestand en aparte verantwoordelijkheden | `script.js` start enkel de UI op; reserveringen, reviews en accounts staan in featurebestanden |
| FE-16 | Dependency injection van de DAO | HTTP-client en tokenprovider kunnen onafhankelijk worden vervangen zonder de UI te wijzigen |

**Oorspronkelijk resultaat (23 oktober):** 12 geslaagd. **Na de modulaire herstructurering:** 15 geslaagd. **Na de bijkomende dependency-injectionverbetering:** 16 geslaagd, 0 mislukt (gecontroleerd op een aparte kopie).

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
- [ ] Op de **definitieve backendversie** controleren dat een review verdwijnt na annulering van de laatste geldige reservering en blijft bestaan als een andere geldige reservering overblijft.
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
| Review blijft bestaan zonder geldige reservering na annulering | Voorwaardelijke reviewverwijdering in `ReservationService` en testscenario's CAN-09/CAN-10 (CAN-09 en CAN-10 geslaagd op 26 oktober) |
| Lekken van persoonlijke gegevens | Privacytest voor publieke reviews |
| Foutieve interface na annulering | Frontendtests voor voorraad, status en tellers |

Niet alles is automatisch gedekt. Er zijn bijvoorbeeld geen afzonderlijke belastingstests of geautomatiseerde browsertests met een echt browserframework uitgevoerd. De twee Laravel-voorbeeldtests bieden bovendien weinig functionele dekking.

---


## 8. Eindconclusie

De laatste testresultaten bevestigen dat zowel de backend als de frontend correct functioneren volgens de uitgevoerde automatische tests.

- **Backend (26 oktober 2026):** 23 van de 23 Laravel-tests geslaagd, met **118 succesvolle assertions** en 0 mislukte tests. De volledige testsuite werd tweemaal succesvol uitgevoerd.
- **Frontend (26 oktober 2026):** 16 van de 16 JavaScript-tests geslaagd, met **0 mislukte tests**.
- **Totaal:** 39 geautomatiseerde tests geslaagd.
- **Annuleringen:** alle 10 tests geslaagd, inclusief het verwijderen van een review na annulering van de laatste geldige reservering en het behouden van een review wanneer een andere geldige reservering bestaat.
- **Manuele controle:** de student bevestigde eerder dat de website met de Laravel-backend functioneerde. Een volledige manuele hercontrole na de laatste wijzigingen is nog niet afzonderlijk gedocumenteerd.

De testresultaten ondersteunen de correcte werking van de belangrijkste functionaliteiten, waaronder registratie, authenticatie, catalogusbeheer, voorraadwijzigingen, reserveringen, annuleringen, reviews en profielbeheer.

Het project bevat zowel functionele tests als tests voor foutscenario's en grensgevallen. Hiermee wordt de betrouwbaarheid en onderhoudbaarheid van de applicatie ondersteund.

Deze tests en scenario's bestrijken voorraadbeheer, rechten, reserveringen, annuleringen, reviews en privacy. De manuele controles vullen de automatische tests aan, maar zijn geen vervanging voor geautomatiseerde end-to-endtests.

**Bronnen en AI-gebruik:** [README — Bronnen en AI-gebruik](../README.md#bronnen-en-ai-gebruik).
