# PLANNING — The Obsidian Shelf

> Projectplanning en voortgang voor **Application Architecture**.  
> Bijgewerkt op **27 oktober 2026**.

[← README](../README.md) · [Architectuur](ARCHITECTURE.md) · [Testing](TESTING.md)

---

## 1. Projectdoel

Een fictieve romantasy-boekhandel bouwen met **twee afzonderlijke applicaties** die via een REST API samenwerken:

- **Frontend:** HTML, CSS en JavaScript.
- **Backend:** PHP, Laravel, SQLite en Sanctum.

De bezoeker kan boeken bekijken; na login kan een gebruiker reserveren, annuleren, zijn wishlist beheren en reviews schrijven.

**Startdatum:** 21 oktober 2026.  
**Geschatte werktijd tot en met 22 oktober 2026:** ongeveer 15 uur (persoonlijke schatting; geen volledige urenregistratie voor de latere wijzigingen).

---

## 2. Werkpakketten — planning en status

### Fase 1 — Analyse en architectuur

**Doel:** de vereisten begrijpen en de projectonderdelen scheiden.

- [x] Opdracht en beoordelingsrubriek analyseren.
- [x] Twee deelprojecten (`frontend/` en `backend/`) opzetten.
- [x] REST API, MVC, DAO en Service Layer kiezen.

**Resultaat:** projectstructuur en architectuurbeschrijving.

### Fase 2 — Datamodel en backend

**Doel:** boeken, gebruikers en transacties correct beheren.

- [x] Models en migrations voor boeken, reserveringen, reviews en wishlist.
- [x] Unieke ISBN en stock bijhouden.
- [x] Registratie, login en profiel via Sanctum.
- [x] Catalogus- en reviewendpoints.
- [x] Reservering als transactie met stockvermindering.

**Resultaat:** Laravel REST API en SQLite-datamodel.

### Fase 3 — Frontend en design

**Doel:** bezoekers een werkende, leesbare interface aanbieden.

- [x] Catalogus, zoeken, filteren en boekdetails.
- [x] Login, registratie en profiel.
- [x] Wishlist, reserveringen en reviews.
- [x] Responsief zwart-gouden design, geïnspireerd op mijn eerdere project *The Silken Manuscript*.
- [x] Betere leesbaarheid van wishlist- en aankoopcijfers.

**Resultaat:** statische frontend die `BookstoreDAO` en de Laravel API gebruikt.

### Fase 4 — Reserveringsregels

**Doel:** voorraadcorrectheid en duidelijke annuleringsregels.

- [x] Stock verminderen bij reserveren.
- [x] Reserveringsprijs bewaren.
- [x] Afhaaltermijn van zeven dagen tonen.
- [x] Annulering binnen 24 uur door de eigenaar.
- [x] Bij annuleren status wijzigen en stock één keer herstellen.
- [x] Reviews weigeren wanneer enkel een geannuleerde reservering bestaat.
- [x] Na feedback over een extra grensgeval de service aanpassen: een review verwijderen bij annulering van de laatste geldige reservering, maar behouden als een andere geldige reservering overblijft (26 oktober).

**Resultaat:** `ReservationService` en beschermde API-routes.

### Fase 5 — Testen en bijwerken

**Doel:** technische fouten en grensgevallen controleren.

- [x] 10 specifieke backend-API-tests toevoegen.
- [x] De oorspronkelijke 8 annuleringstests toevoegen en uitvoeren (bevestigd vóór 26 oktober).
- [x] Twee nieuwe annuleringstests toevoegen op 26 oktober (review verwijderen of behouden); **beide geslaagd** in de definitieve Laravel-suite.
- [x] Eerdere volledige PHP-testsuite uitvoeren: **21 tests, 103 assertions geslaagd** op 23 oktober 2026.
- [x] Definitieve Laravel-suite op 26 oktober tweemaal uitvoeren: **23 tests geslaagd, 118 assertions**.
- [x] Oorspronkelijke JavaScript-testsuite uitvoeren: **12 tests geslaagd, 0 mislukt** op 23 oktober 2026.
- [x] Herstructurering van de frontend testen: **16 tests geslaagd, 0 mislukt** op 26 oktober 2026, inclusief 4 architectuurcontroles (gecontroleerd op een aparte kopie).
- [x] Aanvullende frontendtests voor annulering en tellercontrole toevoegen.
- [x] Nieuwe Laravel-privacytest uitvoeren: **1 test geslaagd, 7 assertions** (deel van de 21 backendtests).
- [x] Manuele browsercontroles van de gebruikersflow uitvoeren (door student gerapporteerd).

**Resultaat:** geautomatiseerde tests met testscenario's in `TESTING.md`.

### Fase 6 — Documentatie en oplevering

**Doel:** een project afleveren dat een docent of collega kan installeren en onderhouden.

- [x] README op de root van de Git-repository.
- [x] `docs/API.md`, `docs/ARCHITECTURE.md`, `docs/PLANNING.md` en `docs/TESTING.md` opstellen.
- [x] Gebruikte bronnen en ChatGPT expliciet documenteren.
- [x] Deploymentinstructies voorzien voor de gekozen technologie.
- [x] Publieke GitHub-repository met `backend/` en `frontend/`.
- [x] De bijgewerkte code en eerdere documentatie naar GitHub `main` pushen; commit `e1b428f` is bevestigd op 26 oktober.
- [x] Controleren en verwijderen van tijdelijk back-upbestand `frontend/script-casse-backup.js` uit de Git-repository.
- [x] Laatste handmatige tests uitvoeren.
- [x] Definitieve documentatie in lijn brengen met de bevestigde tests van 26 oktober; laatste tekstcorrecties op 27 oktober voorbereid voor publicatie.

---

## 3. Tijdlijn — werkelijk projectverloop

### 21 oktober 2026 — Start van het project

Ik ben op 21 oktober 2026 gestart met **The Obsidian Shelf**.

Tijdens de ontwikkeling heb ik gewerkt aan de analyse van de opdracht, de technische structuur, de Laravel-backend, het datamodel en de frontend.

De applicatie werd opgesplitst in een afzonderlijke frontend en backend, met communicatie via een REST API.

### 22 oktober 2026 — Testen, verbeteringen en documentatie

Op 22 oktober 2026 heb ik verder gewerkt aan:

- Het verfijnen van de reserverings- en annuleringsregels.
- Het controleren van de voorraadwijzigingen.
- Het toevoegen van tests voor de annuleringsflow.
- Het uitvoeren van automatische backend- en frontendtests.
- Het verbeteren en structureren van de projectdocumentatie.
- Het voorbereiden van bijkomende kwaliteitsverbeteringen.

**Eerder bevestigde testresultaten op 22 oktober 2026:**

- Laravel: **20 geslaagde tests en 96 assertions**.
- JavaScript: **8 geslaagde tests**.

### 23 oktober 2026 — Tussentijdse tests en kwaliteitscontrole

- `php artisan test`: **21 tests geslaagd, 103 assertions**.
- `php artisan test --filter=BookReviewPrivacyTest`: **1 test geslaagd, 7 assertions** (onderdeel van de 21).
- `node --test frontend\tests\api.test.cjs`: **12 tests geslaagd, 0 mislukt**.
- `node --check frontend\script.js`: geen syntaxfouten.
- Manuele browsercontrole van de gebruikersflow: door de student als voltooid aangegeven.
- Testverslag bijgewerkt met de definitieve automatische testresultaten.

### 26 oktober 2026 — Frontend opsplitsen na feedback van de docent

Naar aanleiding van feedback over *Separation of Concerns* heb ik de JavaScript-code opgesplitst. De DAO staat nu in `frontend/js/bookstore-dao.js`, de applicatiestatus in `frontend/js/store.js` en de UI-functies in afzonderlijke featurebestanden. `frontend/script.js` start de applicatie alleen nog op.

- Scripts in `frontend/index.html` in de vereiste volgorde geladen.
- De oorspronkelijke frontendtests behouden en vier controles op de architectuur toegevoegd.
- **15/15 frontendtests geslaagd in Windows CMD na opsplitsing; daarna 16/16 geslaagd op een aparte gecontroleerde kopie na verbetering van de DAO.**
- `node --check frontend\script.js` gaf geen syntaxfouten.
- De student heeft de website met de echte backend opnieuw als operationeel bevestigd.
- Later op 26 oktober is de backendcode bijgewerkt: reviews worden na een annulering alleen verwijderd als er voor hetzelfde boek geen andere geldige reservering van de gebruiker bestaat.
- `ReservationCancellationTest.php` is van 8 naar **10 testmethoden** uitgebreid. De nieuwe backendcode heeft **23 tests**; op 26 oktober zijn **alle 23 tests tweemaal geslaagd met 118 assertions**.
- De eerdere uitvoering van 23 oktober (**21 tests, 103 assertions**) blijft in de tijdlijn staan als historisch resultaat, niet als de actuele status.
- De documentatie is op 26 oktober naar GitHub `main` gepusht (`e1b428f`); de eindredactie van de testresultaten volgt op 27 oktober.

### Totale tijdsbesteding

De geschatte totale werktijd vanaf 21 oktober tot en met 22 oktober 2026 bedraagt **ongeveer 15 uur**.

Dit is een persoonlijke schatting van de tijd die ik aan het project heb besteed. Ik heb geen gedetailleerde urenregistratie per taak bijgehouden.

Dit overzicht documenteert het werkelijke ontwikkelingsverloop achteraf en wordt niet voorgesteld als een vooraf opgestelde planning.

---

## 4. Opleverstatus

- [x] Frontend opsplitsen in aparte scripts en DAO apart plaatsen.
- [x] Nieuwe scripts en scriptvolgorde gecontroleerd met frontendtests (**16/16 op aparte kopie**).
- [x] De volledige bijgewerkte backendtestsuite op de eigen computer tweemaal uitvoeren (**23 tests, 118 assertions**).
- [x] Website opnieuw controleren met de werkende Laravel-backend (door student operationeel bevestigd).
- [x] Documentatie aanpassen aan de nieuwe mapstructuur en testresultaten.
- [x] Definitieve testresultaten in het testverslag vastleggen.
- [x] Code en documentatie op GitHub `main` gepubliceerd op 26 oktober (commit `e1b428f`).
- [ ] De laatste tekstcorrecties van 27 oktober committen en pushen.
- [ ] GitHub-URL indienen via het opleidingsplatform.

**Indieningsdatum:** woensdag **28 oktober 2026 om 23:59** volgens de opgegeven opdrachtinformatie.

---

## 5. Risico's en preventie

- **Ontbrekende bronvermelding:** ChatGPT, officiële documentatie en mijn eerdere project *The Silken Manuscript* worden vermeld in `README.md`.
- **Verkeerde stock na annuleren:** databasetransacties, statuscontroles en automatische tests.
- **Blootstelling van privégegevens:** authenticatie met Sanctum en beperking van publiek teruggegeven gebruikersgegevens.
- **Problemen tussen frontend en backend:** afzonderlijke servers en correcte CORS-configuratie.
- **Codewijzigingen die het design verstoren:** gerichte wijzigingen en controles in de browser.
- **Onvoldoende kennis van de eigen code:** architectuur en design patterns begrijpen en kleine aanpassingen zelfstandig oefenen.

---

## 6. Eigen tijdsregistratie en projectgegevens

| Gegeven | Informatie |
|---|---|
| Projectnaam | The Obsidian Shelf |
| Vak | Application Architecture |
| Werkelijke startdatum | **21 oktober 2026** |
| Laatste update van dit document | **27 oktober 2026** |
| Geschatte gewerkte uren | **Ongeveer 15 uur tot en met 22 oktober (schatting); geen aparte urenregistratie voor 23 oktober** |
| Gebruikte technologieën | PHP, Laravel, SQLite, Sanctum, HTML, CSS, JavaScript |
| Versiebeheer | Git en GitHub |
| Repository | [The Obsidian Shelf](https://github.com/benhadiSalma/the-obsidian-shelf) |
| Definitieve indieningsdatum | **Woensdag 28 oktober 2026 om 23:59** |

### Belangrijke Git-activiteit

Een bevestigd voorbeeld uit de Git-geschiedenis:

- `1d9031a` — **Organize project documentation and README**.
- `e1b428f` — **Werk documentatie bij met nieuwe annuleringstests en architectuur** (push naar `main` bevestigd op 26 oktober).

Deze commit verplaatste het hoofd-README-bestand naar de root en organiseerde de documentatie van het project.

De volledige commitgeschiedenis blijft beschikbaar in de GitHub-repository.

---

## 7. Reflectie op het ontwikkelingsproces

Tijdens dit project heb ik geleerd hoe een frontend en een backend als twee afzonderlijke applicaties kunnen samenwerken via een REST API.

Ik heb aandacht besteed aan het scheiden van verantwoordelijkheden door MVC, een DAO en een Service Layer te gebruiken.

Een belangrijk aandachtspunt was de correcte verwerking van reserveringen: wanneer een gebruiker een boek reserveert, moet de voorraad verminderen. Bij een geldige annulering moet die voorraad opnieuw worden hersteld zonder dat dit meerdere keren kan gebeuren.

Ook testing speelde een belangrijke rol. Door automatische tests uit te voeren kon ik verschillende situaties controleren, waaronder onvoldoende voorraad, toegangsrechten en de annuleringsdeadline van 24 uur.

De totale ontwikkelingstijd was relatief kort, ongeveer 15 uur verspreid over twee dagen. Daarom heb ik prioriteit gegeven aan de verplichte functionaliteiten, de belangrijkste bedrijfsregels, automatische tests en documentatie.

De wijzigingen van 26 oktober tonen hoe feedback over onderhoudbaarheid is toegepast. Een extra correctie aan de annuleringslogica houdt ook rekening met reeds gepubliceerde reviews. De bijgewerkte backend is op 26 oktober tweemaal succesvol getest (**23 tests, 118 assertions**), en de code met bijgewerkte documentatie is naar de publieke GitHub-branch `main` gepusht. Deze documentatie is op 27 oktober nog tekstueel bijgewerkt voor een consistente eindversie.

---

**Bronnen en AI-gebruik:** [README](../README.md#bronnen-en-ai-gebruik).