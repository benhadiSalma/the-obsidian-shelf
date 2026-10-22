# Projectplanning — The Obsidian Shelf
**Project:** Fictieve boekwinkel  
**Deelprojecten:** Frontend en backend  
**Stand van het overzicht:** 22 oktober 2026

[Terug naar README](../README.md) · [Architectuur](ARCHITECTURE.md) · [Testing](TESTING.md)

---

## 1. Projectdoel

Voor de opdracht Application Architecture maak ik een fictieve boekwinkel met twee aparte applicaties:

- **Frontend:** HTML, CSS en JavaScript.
- **Backend:** PHP, Laravel REST API en SQLite.

### Belangrijkste functies

- Boekencatalogus met ISBN, titel, auteur, beschrijving en prijs.
- Voorraadbeheer dat reageert op reserveringen.
- Registreren, inloggen en het eigen profiel aanpassen.
- Boeken reserveren en een afhaalbevestiging krijgen.
- Reserveringen binnen 24 uur annuleren.
- Wishlist beheren.
- Reviews met een score en tekst toevoegen.
- Tests, documentatie en bronvermelding voorzien.

---

## 2. Opdeling in werkpakketten

### Fase 1 — Analyse en structuur
**Doel:** vereisten begrijpen en de onderdelen bepalen.

- [x] Functionele vereisten uit de opdracht bekijken.
- [x] Frontend en backend als aparte mappen opbouwen.
- [x] Technologie kiezen: Laravel, SQLite, HTML, CSS en JavaScript.

### Fase 2 — Database en backend
**Doel:** gegevens veilig kunnen opslaan en ophalen.

- [x] Models en migrations voor de belangrijkste tabellen.
- [x] API-routes voor catalogus, gebruikers en reserveringen.
- [x] Authenticatie met Laravel Sanctum.
- [x] Endpoints voor profiel, wishlist en reviews.

### Fase 3 — Frontend en vormgeving
**Doel:** een bruikbare en herkenbare boekwinkel bouwen.

- [x] Interactieve catalogus en boekdetails.
- [x] Zoeken en filteren.
- [x] Account- en profielformulieren.
- [x] Reserverings- en wishlistfuncties.
- [x] Dark-academia-design geïnspireerd op een eerder eigen project.

### Fase 4 — Bedrijfsregels en extra functies
**Doel:** voorraad en reserveringen correct verwerken.

- [x] Stock verminderen bij een reservering.
- [x] Reserveringsprijs opslaan.
- [x] Annulering binnen 24 uur implementeren.
- [ ] Volledige annulatieflow opnieuw controleren in de browser.
- [ ] Reviewrechten na een annulering op de backend controleren.

### Fase 5 — Testing
**Doel:** fouten en grensgevallen opsporen.

- [x] Basis-featuretests voor de backend schrijven.
- [x] Frontendtests met de Node.js Test Runner schrijven.
- [ ] De nieuwe annuleringstests uitvoeren.
- [ ] Alle tests na de laatste wijzigingen opnieuw uitvoeren.
- [ ] De volledige gebruikersflow handmatig testen.

### Fase 6 — Documentatie en oplevering
**Doel:** een project indienen dat een ander kan begrijpen.

- [x] Een structuur voor README en documentatie voorbereiden.
- [ ] De vier documenten definitief nakijken en toevoegen aan Git.
- [ ] Alle gebruikte bronnen en AI-tools correct vermelden.
- [ ] Geheime en tijdelijke bestanden uit GitHub houden.
- [ ] De repository publiceren of de docent toegang geven.
- [ ] De mondelinge verdediging voorbereiden.

> De vinkjes geven de zichtbare projectvoortgang weer. Ze vervangen geen bewijs van uitgevoerde tests.

---

## 3. Geregistreerde voortgang

Bij de codecontrole op 22 oktober 2026 waren de volgende onderdelen aanwezig:

- Database en migrations voor boeken en gebruikersgegevens.
- Laravel-controllers, API-routes en `ReservationService`.
- Werkende HTML/CSS/JavaScript-frontend volgens de projectstructuur.
- Demo-seeders voor boeken en fictieve reviews.
- 10 bestaande Laravel-featuretests.
- 8 bestaande JavaScript-tests.
- Een extra annulatiefunctie waarvoor nog controles nodig zijn.

**Eerder resultaat:** 10 backendtests en 8 frontendtests geslaagd.  
Dit bewijst nog niet dat alle nieuwe aanpassingen geslaagd zijn.

---

## 4. Nog te doen voor de indiening

### Hoge prioriteit

- [ ] Annulatie controleren: eigenaar, deadline, status en stock.
- [ ] `ReviewController` laten controleren of een reservering geldig is.
- [ ] `ReservationCancellationTest.php` toevoegen en uitvoeren.
- [ ] `php artisan test` opnieuw uitvoeren.
- [ ] `node --test frontend\tests\api.test.cjs` opnieuw uitvoeren.
- [ ] De echte browserflow testen en fouten oplossen.

### Documentatie en GitHub

- [ ] `README.md` en de volledige map `docs/` toevoegen.
- [ ] Installatie-instructies op een andere computer nakijken.
- [ ] AI-gebruik en eigen designreferentie vermelden.
- [ ] Controleren dat `.env` en persoonlijke data niet op GitHub staan.
- [ ] Tijdelijke back-upbestanden niet mee indienen.
- [ ] Laatste wijzigingen committen en GitHub-toegang controleren.

### Mondelinge verdediging

- [ ] MVC uitleggen met een voorbeeld uit het project.
- [ ] `BookstoreDAO` en `fetch()` kunnen toelichten.
- [ ] Dependency injection en `ReservationService` uitleggen.
- [ ] Sanctum en Bearer-tokens begrijpen.
- [ ] De stocktransactie en de 24-uursgrens uitleggen.
- [ ] Zelf een kleine codewijziging kunnen uitvoeren.

---

## 5. Risico's en oplossingen

### Risico: documentatie of bronvermelding ontbreekt
**Oplossing:** controleren dat de README, bronvermelding en alle vereiste documenten op GitHub staan.

### Risico: de stock klopt niet na reserveren of annuleren
**Oplossing:** database-transacties gebruiken en grensgevallen testen.

### Risico: een geannuleerde reservering geeft toch reviewrechten
**Oplossing:** de backendstatus controleren en een featuretest uitvoeren.

### Risico: het project werkt niet op de computer van de docent
**Oplossing:** volledige installatie- en deploymentstappen beschrijven.

### Risico: een aanpassing breekt het frontend
**Oplossing:** gerichte wijzigingen, syntaxchecks en een browsertest.

### Risico: ik kan de gebruikte code niet uitleggen
**Oplossing:** de volledige gebruikersflow zelf doorlopen en alle ontwerpkeuzes begrijpen voor de verdediging.

---

## 6. Persoonlijke planning en tijdsregistratie

Zelf aanvullen met werkelijke gegevens.

> Dit is een voortgangsoverzicht achteraf. Het is geen bewijs dat alle fasen vooraf op deze manier werden ingepland.

### Werkelijke datums

- Start project: nog in te vullen.
- Datamodel en backend: nog in te vullen.
- Frontend en design: nog in te vullen.
- Tests geschreven: nog in te vullen.
- Laatste verbeteringen: nog in te vullen.
- Definitieve indiening: nog in te vullen.

### Tijdsbesteding en bewijs

- Geschatte eigen werkuren: nog in te vullen.
- Belangrijke Git-commits: nog in te vullen.
- Eigen notities of screenshots: nog in te vullen.

Gebruik je eigen agenda of Git-geschiedenis om dit correct in te vullen. Verzin geen datums of afgeronde prestaties.

---

## 7. Checklist voor de oplevering

- [ ] Eén GitHub-repository met `frontend/` en `backend/`.
- [ ] README op het hoogste niveau van het project.
- [ ] API-documentatie, architectuur, planning en testverslag.
- [ ] Alle nodige broncode en tests toegevoegd.
- [ ] Complete en eerlijke bron- en AI-vermelding.
- [ ] Duidelijke installatie- en deploymentinstructies.
- [ ] Publieke repository of toegang voor de docent.
- [ ] Mondelinge uitleg van architectuur en belangrijkste code.

Bronnen: de volledige lijst staat in de [README](../README.md#bronnen-en-ai-gebruik), met ChatGPT en het eerdere eigen project **The Silken Manuscript**.