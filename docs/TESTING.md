# TESTING — The Obsidian Shelf

> Verslag van geautomatiseerde tests en geplande manuele controles.  
> Laatste vastgelegde terminalresultaten: **22 oktober 2026**.

[← README](../README.md) · [API](API.md) · [Architectuur](ARCHITECTURE.md) · [Planning](PLANNING.md)

---

## 1. Teststrategie

We testen de **bedrijfsregels** op de backend, de **HTTP-communicatie** op de frontend en de **volledige gebruikersflow** manueel in de browser. Testdata voor Laravel draait met `RefreshDatabase` en SQLite `:memory:`: de gewone lokale boekendatabase wordt niet gewist.

### Wat wordt getest?

- Succesgevallen, foutieve invoer en HTTP-statuscodes.
- Rechten van ingelogde en niet-ingelogde gebruikers.
- Verandering van boekvoorraad bij reserveren en annuleren.
- Grensgevallen rond de annuleringstermijn van 24 uur.
- Weigering van dubbele reviews en annuleringen.
- Communicatie met de REST API via `BookstoreDAO`.
- Bescherming van persoonlijke gegevens bij publieke boekreviews.

---

## 2. Bevestigde resultaten (terminal op Windows)

Op **22 oktober 2026** zijn de volgende resultaten daadwerkelijk behaald en getoond:

```text
php artisan test
Tests: 20 passed (96 assertions)

node --test frontend\tests\api.test.cjs
Tests: 8 passed, 0 failed
```

Daarnaast is de afzonderlijke annulatiesuite uitgevoerd:

```text
php artisan test --filter=ReservationCancellationTest
Tests: 8 passed (31 assertions)
```

**Let op:** de **8 annuleringstests maken deel uit van de 20 backendtests**. Ze mogen dus niet opnieuw worden opgeteld. De 96 assertions omvatten eveneens deze tests.

### Nieuwe correcties — opnieuw controleren

Na deze resultaten zijn **extra tests** voorbereid voor reviewprivacy en de frontend-annulering:

- `backend/tests/Feature/BookReviewPrivacyTest.php`: publieke boekdetails mogen geen e-mailadressen van reviewers uitlekken.
- `frontend/tests/api.test.cjs`: controle van de DELETE-route, de rechten na annulering en de synchronisatie van status, stock en teller.

De gewijzigde JavaScript-suite is gecontroleerd op de aangeleverde code: **12/12 tests geslaagd**. De extra Laravel-privacytest is op syntax gecontroleerd, maar moet op de Windows-installatie opnieuw worden uitgevoerd. Er wordt hier **geen nieuw totaal** voor PHP als geslaagd geclaimd.

---

## 3. Backend — testscenario's

**Bestand:** `backend/tests/Feature/BookstoreApiTest.php` — 10 tests.

- **BE-01 Registratie:** username verplicht en valide registratie lukt.
- **BE-02 Catalogus:** zoeken op ISBN en filteren op stock.
- **BE-03 Gast:** niet-ingelogde gebruikers kunnen niet reserveren (`401`).
- **BE-04 Reserveren:** stock `-1`, status `confirmed`, juiste afhaalgegevens.
- **BE-05 Geen stock:** weigering (`409`), stock wordt nooit negatief.
- **BE-06 Prijs:** reserveringsprijs verandert niet als catalogusprijs wijzigt.
- **BE-07 Reviews:** reservering verplicht, maximaal één review per boek/gebruiker.
- **BE-08 Reviewvalidatie:** score buiten 1–5 wordt geweigerd.
- **BE-09 Profiel:** wijzigingen worden opgeslagen; unieke username.
- **BE-10 Wishlist:** gebruikers zien alleen hun eigen wishlist.

**Bestand:** `backend/tests/Feature/ReservationCancellationTest.php` — 8 tests.

- **CAN-01 Binnen 24 uur:** status `cancelled` en stock `+1`.
- **CAN-02 Na 23 uur 59 min.:** annuleren nog toegestaan.
- **CAN-03 Precies na 24 uur:** weigering (`409`), stock blijft gelijk.
- **CAN-04 Tweemaal annuleren:** tweede keer weigeren, geen dubbele stocktoename.
- **CAN-05 Andere gebruiker:** weigering (`404`), geen wijziging.
- **CAN-06 Gast:** weigering (`401`).
- **CAN-07 Reeds afgehaald:** status `collected` kan niet worden geannuleerd.
- **CAN-08 Review na annulering:** geweigerd (`403`).

**Nieuw bestand:** `backend/tests/Feature/BookReviewPrivacyTest.php` — 1 extra test, nog te verifiëren in de eigen Laravel-omgeving.

- **SEC-01 Openbaar boekdetail:** toont naam en username van de reviewer, maar **geen e-mailadres** of andere privévelden.

**Technische voorbeeldtests:** in Laravel staan daarnaast de standaard `ExampleTest`-bestanden; zij verklaren het verschil tussen de functionele scenario's en het totaalaantal 20.

---

## 4. Frontend — testscenario's

**Bestand:** `frontend/tests/api.test.cjs`

- **FE-01:** Initialisatie pas op `DOMContentLoaded`.
- **FE-02:** Catalogus haalt ook meerdere pagina's op.
- **FE-03:** Bearer-token bij beveiligde verzoeken.
- **FE-04:** Registratie verstuurt JSON met POST.
- **FE-05:** Reservering verstuurt het juiste `book_id`.
- **FE-06:** Wishlist en reviews gebruiken de juiste Laravel-routes.
- **FE-07:** Laravel-validatiefouten worden verwerkt.
- **FE-08:** JavaScript verwijst niet naar ontbrekende HTML-element-ID's.
- **FE-09 (nieuw):** Annulering verstuurt `DELETE` en Bearer-token.
- **FE-10 (nieuw):** Een geannuleerde reservering geeft geen reviewrecht.
- **FE-11 (nieuw):** Een succesvolle annulering past status, stock en teller aan.
- **FE-12 (nieuw):** De teller Purchases telt enkel `confirmed` en `collected` en negeert `cancelled`.

De frontendtests gebruiken **gesimuleerde API-responses**, geen echte Laravel-server. Daarom zijn manuele browsertests aanvullend nodig.

---

## 5. Uitvoeren op Windows (CMD)

Vanuit de hoofdmap `the-obsidian-shelf`:

```cmd
cd backend
php artisan test
cd ..
node --check frontend\script.js
node --test frontend\tests\api.test.cjs
```

Test de nieuwe privacyregel afzonderlijk:

```cmd
cd backend
php artisan test --filter=BookReviewPrivacyTest
```

Geen `migrate:fresh` uitvoeren op de bestaande lokale database.

---

## 6. Manuele browsertests — nog af te vinken

**Catalogus**

- [x] Homepage toont boeken met titel, auteur, prijs en actuele stock.
- [x] Zoeken en filteren werken; details en reviews worden getoond.

**Accounts**

- [x] Registreren, aanmelden, profiel aanpassen en afmelden werken.
- [x] Andere gebruikers kunnen geen privéreserveringen bekijken.

**Reserveren en annuleren**

- [x] Reserveren verlaagt de zichtbare stock met één.
- [x] Afhaaltermijn en prijs worden correct bevestigd.
- [x] Annuleerknop verschijnt uitsluitend bij een bevestigde reservering jonger dan 24 uur.
- [x] Annuleren vraagt bevestiging en geeft stock éénmaal terug.
- [x] De geannuleerde reservering blijft zichtbaar met de juiste status.
- [x] De teller « Purchases » telt geannuleerde reserveringen niet mee.
- [x] Na annulering vervalt het reviewrecht zonder andere geldige reservering.

**Vormgeving en toegankelijkheid**

- [x] De witte wishlist- en aankoopcijfers zijn leesbaar op elke actieve/inactieve tab.
- [x] Modals, formulieren en knoppen werken op mobiel en desktop.
- [x] Browserconsole en Network-tabblad tonen geen onverwachte fouten.

> Niet afvinken zonder daadwerkelijk te testen. Noteer de testdatum en eventuele problemen na de controle.

---

## 7. Registratie van de laatste controle

- **Datum:** 22 oktober 2026.
- **Backend (daadwerkelijk uitgevoerd):** 20 geslaagd, 96 assertions.
- **Annulatiesuite (onderdeel van backend):** 8 geslaagd, 31 assertions.
- **Frontend (daadwerkelijk op Windows):** 8 geslaagd.
- **Extra frontendtests (gecontroleerd op aangeleverde code):** 12 geslaagd.
- **Extra privacytest (Laravel):** syntax gecontroleerd; uitvoering op Windows nog te doen.
- **Handmatige volledige browsercontrole:** nog niet gedocumenteerd.

Bronnen en gebruikte AI-tools: [README — Bronnen en AI-gebruik](../README.md#bronnen-en-ai-gebruik).