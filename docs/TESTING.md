# Testing — The Obsidian Shelf
**Backend:** Laravel Feature Tests (PHPUnit)  
**Frontend:** Node.js Test Runner (`node:test`)  
**Laatste gedocumenteerde controle:** 22 oktober 2026

[Terug naar README](../README.md) · [API](API.md) · [Planning](PLANNING.md)

---

## 1. Teststrategie

Het doel is om niet alleen te controleren of functies werken, maar ook of de toepassing correcte fouten teruggeeft.

We gebruiken drie soorten controles:

1. **Backendtests:** authenticatie, rechten, HTTP-statuscodes, stockwijzigingen en databasegegevens.
2. **Frontendtests:** API-aanroepen, JSON, tokens en foutafhandeling.
3. **Handmatige browsertests:** werkelijke gebruikersflow en design.

> Een geslaagde syntaxtest bewijst niet dat een knop in de browser correct werkt. Daarom zijn de controles apart beschreven.

---

## 2. Automatische backendtests

### Commando's

Open Windows CMD in de map `backend/`:

```bash
php artisan test
```

Voor alleen de bestaande API-tests:

```bash
php artisan test tests\Feature\BookstoreApiTest.php
```

### Bestaande testscenario's

Het bestand `backend/tests/Feature/BookstoreApiTest.php` bevat tien tests voor de belangrijkste functies.

#### BE-01 — Registratie
- Een gebruiker kan registreren met geldige gegevens.
- De gegevens voldoen aan de validatieregels.

#### BE-02 — Catalogus
- Zoeken op boekgegevens werkt.
- Filteren op beschikbare stock werkt.

#### BE-03 — Gast probeert te reserveren
- Verwacht: `401 Unauthorized`.

#### BE-04 — Geldige reservering
- De reservering wordt opgeslagen.
- De boekvoorraad daalt met één.
- Afhaalgegevens zijn aanwezig.

#### BE-05 — Geen voorraad
- Een boek met stock nul kan niet worden gereserveerd.
- De stock wordt nooit negatief.

#### BE-06 — Vastgelegde prijs
- De gereserveerde prijs blijft bewaard als de boekprijs wijzigt.

#### BE-07 — Reviews
- Zonder reservering kan de gebruiker geen review plaatsen.
- Een tweede review voor hetzelfde boek wordt geweigerd.

#### BE-08 — Reviewvalidatie
- Alleen een score van 1 tot en met 5 is geldig.

#### BE-09 — Profiel wijzigen
- De eigen profielgegevens kunnen worden aangepast.
- Een gebruikersnaam die al bestaat wordt geweigerd.

#### BE-10 — Wishlist en privacy
- Persoonlijke wishlistgegevens blijven gescheiden per gebruiker.

### Eerder bevestigd resultaat

**10 tests geslaagd, 63 assertions.**

> Dit resultaat is van vóór de laatste wijzigingen in de annuleringsfunctie. De volledige testsuite moet opnieuw draaien voordat een actueel resultaat wordt ingevuld.

---

## 3. Automatische frontendtests

Open CMD in de hoofdmap `the-obsidian-shelf/`:

```bash
node --check frontend\script.js
node --test frontend\tests\api.test.cjs
```

De acht tests in `frontend/tests/api.test.cjs` controleren onder meer:

- Aanwezigheid van verwachte HTML-elementen.
- Ophalen en pagineren van catalogusgegevens.
- Het versturen van het authenticatietoken.
- Requestbody bij registratie en reserveringen.
- API-routes voor wishlist en reviews.
- Correcte foutafhandeling bij API-verzoeken.

**Eerder bevestigd resultaat:** 8 van 8 tests geslaagd.

> Deze tests gebruiken gesimuleerde responses. Ze vervangen geen test van de werkelijke browserknoppen met Laravel.

---

## 4. Extra tests voor annulering

**Bestand:** `backend/tests/Feature/ReservationCancellationTest.php`

De volgende zeven scenario's zijn voorbereid en moeten na toevoegen aan het eigen project worden uitgevoerd.

### CAN-01 — Annuleren binnen 24 uur
- Gebruiker annuleert zijn eigen bevestigde reservering.
- Verwacht: `200 OK`, status `cancelled`, stock `+1`.

### CAN-02 — Dubbele annulering
- Gebruiker probeert dezelfde reservering opnieuw te annuleren.
- Verwacht: `409 Conflict`, geen extra stockverhoging.

### CAN-03 — Grens van exact 24 uur
- Reservering is precies 24 uur oud.
- Verwacht: `409 Conflict`, stock ongewijzigd.

### CAN-04 — Reservering van andere gebruiker
- Een andere gebruiker probeert te annuleren.
- Verwacht: `404 Not Found`.

### CAN-05 — Annuleren zonder login
- Niet-ingelogde gebruiker probeert te annuleren.
- Verwacht: `401 Unauthorized`.

### CAN-06 — Reeds afgehaalde reservering
- Een reservering met status `collected` wordt geannuleerd.
- Verwacht: `409 Conflict`, stock ongewijzigd.

### CAN-07 — Review na annulering
- Gebruiker heeft alleen een geannuleerde reservering.
- Verwacht: `403 Forbidden`, geen nieuwe review.

### Uitvoeren

Open CMD in `backend/`:

```bash
php artisan test tests\Feature\ReservationCancellationTest.php
```

> **Belangrijk:** `CAN-07` vereist dat `ReviewController` alleen niet-geannuleerde reserveringen accepteert:
>
> ```php
> $hasReserved = $user->reservations()
>     ->where('book_id', $book->id)
>     ->whereIn('status', ['confirmed', 'collected'])
>     ->exists();
> ```
>
> Zonder deze backendaanpassing kan de test terecht falen. Dat is een echte bug en moet als zodanig worden gecorrigeerd.

**Status:** de zeven nieuwe tests zijn nog niet bevestigd als geslaagd op de Windows-installatie van de student.

---

## 5. Handmatige end-to-end-tests

Voor deze tests moeten de Laravel-server en de frontend actief zijn.

### Catalogus en zoeken

- [ ] De homepage toont de beschikbare boeken.
- [ ] Elk boek toont titel, auteur, prijs en stock.
- [ ] Zoeken op titel, auteur en ISBN werkt.
- [ ] Het stockfilter toont alleen boeken op voorraad.
- [ ] Boekdetails en reviews worden correct getoond.

### Registratie en profiel

- [ ] Registreren met geldige gegevens lukt.
- [ ] Inloggen werkt en opent persoonlijke functies.
- [ ] Profiel aanpassen werkt.
- [ ] Een reeds gebruikte gebruikersnaam wordt geweigerd.
- [ ] Uitloggen maakt privéfuncties niet meer beschikbaar.

### Reservering en stock

- [ ] Een boek met stock groter dan nul kan worden gereserveerd.
- [ ] De reservering verschijnt in het profiel.
- [ ] De afhaalbevestiging bevat de juiste termijn.
- [ ] De stock daalt met één.
- [ ] Een boek met stock nul kan niet worden gereserveerd.

### Annuleren binnen 24 uur

- [ ] De annuleerknop verschijnt bij een recente reservering.
- [ ] Eerst verschijnt een bevestigingsvraag.
- [ ] De reservering krijgt de status `cancelled`.
- [ ] De stock stijgt één keer met één.
- [ ] De annuleerknop verdwijnt na annulering.
- [ ] Een tweede annulering wordt geweigerd.
- [ ] Een annulering na de deadline wordt geweigerd.

### Reviews en privacy

- [ ] Zonder geldige reservering kan geen review worden geplaatst.
- [ ] Een geldige review met score en tekst wordt opgeslagen.
- [ ] Een dubbele review wordt geweigerd.
- [ ] Na annulering is er geen reviewrecht zonder andere geldige reservering.
- [ ] Gebruikers kunnen elkaars privégegevens niet inzien.

### Design en browser

- [ ] Wishlist- en reserveringstellers zijn goed leesbaar.
- [ ] Knoppen en formulieren werken op desktop en mobiel.
- [ ] Het zwarte en gouden thema blijft consistent.
- [ ] De browserconsole bevat geen onverwachte JavaScript-fouten.
- [ ] Het Network-tabblad toont correcte API-requests.
- [ ] Demonstratiereviews zijn herkenbaar als fictieve gegevens.

---

## 6. Resultaten

> Regel: markeer alleen echt uitgevoerde tests als geslaagd.

### Bekende resultaten vóór de laatste wijzigingen

- **Backend:** 10 tests geslaagd, 63 assertions.
- **Frontend:** 8 tests geslaagd op de aangeleverde code-export.

### Opnieuw te controleren

- [ ] Volledige Laravel-testsuite, inclusief annulatie.
- [ ] Volledige frontendtestsuite na de laatste wijzigingen.
- [ ] Annulering in de browser.
- [ ] Reviewcontrole na annulering.
- [ ] Mobiele weergave en contrast.

### Eigen testregistratie — zelf invullen

- **Testdatum:** ...
- **Git-commit of versie:** ...
- **Uitgevoerd commando:** ...
- **Aantal geslaagde tests:** ...
- **Aantal mislukte tests:** ...
- **Gevonden problemen:** ...
- **Uitgevoerde correcties:** ...

---

## 7. Bekende aandachtspunten

- Een dubbele annulering mag geen dubbele stockverhoging veroorzaken.
- De controle op de 24-uursgrens moet ook exact op de grens werken.
- Een gebruiker mag geen reservering van iemand anders annuleren.
- Een geannuleerde reservering mag geen reviewrecht geven.
- Een geslaagde `node --check` sluit browserfouten niet uit.
- De frontend en backend gebruiken verschillende lokale poorten; ook de CORS-instellingen moeten dus juist zijn.

> Bewaar eventueel screenshots van testresultaten, met datum en geteste commit. Zet nooit wachtwoorden, `.env` of tokens in Git.

**Bronnen en AI-verantwoording:** [README - Bronnen en AI-gebruik](../README.md#bronnen-en-ai-gebruik), met ChatGPT en **The Silken Manuscript** als eigen designreferentie.