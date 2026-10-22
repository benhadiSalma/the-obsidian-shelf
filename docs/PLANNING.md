# PLANNING — The Obsidian Shelf

> Projectplanning en voortgang voor **Application Architecture**.  
> Bijgewerkt op **22 oktober 2026**.

[← README](../README.md) · [Architectuur](ARCHITECTURE.md) · [Testing](TESTING.md)

---

## 1. Projectdoel

Een fictieve romantasy-boekhandel bouwen met **twee afzonderlijke applicaties** die via een REST API samenwerken:

- **Frontend:** HTML, CSS en JavaScript.
- **Backend:** PHP, Laravel, SQLite en Sanctum.

De bezoeker kan boeken bekijken; na login kan een gebruiker reserveren, annuleren, zijn wishlist beheren en reviews schrijven.

**Startdatum:** 21 oktober 2026.  
**Geschatte totale werktijd tot 22 oktober 2026:** ongeveer 15 uur.

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

**Resultaat:** `ReservationService` en beschermde API-routes.

### Fase 5 — Testen en bijwerken

**Doel:** technische fouten en grensgevallen controleren.

- [x] 10 specifieke backend-API-tests toevoegen.
- [x] 8 tests voor de annuleringsflow toevoegen en uitvoeren.
- [x] Volledige PHP-testsuite uitvoeren: **20 tests, 96 assertions geslaagd** op 22 oktober 2026.
- [x] 8 JavaScript-tests uitvoeren: **8 geslaagd** op 22 oktober 2026.
- [x] Aanvullende frontendtests voor annulering voorbereiden.
- [x] Bijgewerkte frontendtests opnieuw op mijn eigen computer uitvoeren.
- [x] Nieuwe Laravel-test voor bescherming van reviewgegevens uitvoeren.
- [x] Volledige browserflow handmatig controleren en resultaten registreren.

**Resultaat:** geautomatiseerde tests met testscenario's in `TESTING.md`.

### Fase 6 — Documentatie en oplevering

**Doel:** een project afleveren dat een docent of collega kan installeren en onderhouden.

- [x] README op de root van de Git-repository.
- [x] `docs/API.md`, `docs/ARCHITECTURE.md`, `docs/PLANNING.md` en `docs/TESTING.md` opstellen.
- [x] Gebruikte bronnen en ChatGPT expliciet documenteren.
- [x] Deploymentinstructies voorzien voor de gekozen technologie.
- [x] Publieke GitHub-repository met `backend/` en `frontend/`.
- [x] Laatste codecorrecties committen en pushen.
- [x] Tijdelijk back-upbestand uit de Git-repository verwijderen.
- [x] Laatste handmatige tests uitvoeren.
- [x] Documentatie na de laatste tests definitief bijwerken.

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

**Bevestigde testresultaten op 22 oktober 2026:**

- Laravel: **20 geslaagde tests en 96 assertions**.
- JavaScript: **8 geslaagde tests**.

### Totale tijdsbesteding

De geschatte totale werktijd vanaf 21 oktober tot en met 22 oktober 2026 bedraagt **ongeveer 15 uur**.

Dit is een persoonlijke schatting van de tijd die ik aan het project heb besteed. Ik heb geen gedetailleerde urenregistratie per taak bijgehouden.

Dit overzicht documenteert het werkelijke ontwikkelingsverloop achteraf en wordt niet voorgesteld als een vooraf opgestelde planning.

---

## 4. Resterend werk — prioriteiten voor de indiening

1. **Privacy en consistentie:** controleren dat publieke reviewgegevens geen privégegevens van gebruikers bevatten.
2. **Frontend-annulering:** voorraad, reservatiestatus en tellers controleren na een annulering.
3. **Automatische tests:** nieuwe tests lokaal uitvoeren en resultaten documenteren.
4. **Handmatige controles:** registratie, login, reservering, annulering, reviews en mobiele weergave testen.
5. **Documentatie:** testresultaten en projectstatus definitief bijwerken.
6. **GitHub:** tijdelijke bestanden opruimen en de definitieve wijzigingen pushen.

**Definitieve indieningsdatum:** nog te bevestigen via de officiële opdracht.

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
| Laatste update van dit document | **22 oktober 2026** |
| Geschatte gewerkte uren | **Ongeveer 15 uur** |
| Gebruikte technologieën | PHP, Laravel, SQLite, Sanctum, HTML, CSS, JavaScript |
| Versiebeheer | Git en GitHub |
| Repository | [The Obsidian Shelf](https://github.com/benhadiSalma/the-obsidian-shelf) |
| Definitieve indieningsdatum | Nog niet bevestigd |

### Belangrijke Git-activiteit

Een bevestigd voorbeeld uit de Git-geschiedenis:

- `1d9031a` — **Organize project documentation and README**.

Deze commit verplaatste het hoofd-README-bestand naar de root en organiseerde de documentatie van het project.

De volledige commitgeschiedenis blijft beschikbaar in de GitHub-repository.

---

## 7. Reflectie op het ontwikkelingsproces

Tijdens dit project heb ik geleerd hoe een frontend en een backend als twee afzonderlijke applicaties kunnen samenwerken via een REST API.

Ik heb aandacht besteed aan het scheiden van verantwoordelijkheden door MVC, een DAO en een Service Layer te gebruiken.

Een belangrijk aandachtspunt was de correcte verwerking van reserveringen: wanneer een gebruiker een boek reserveert, moet de voorraad verminderen. Bij een geldige annulering moet die voorraad opnieuw worden hersteld zonder dat dit meerdere keren kan gebeuren.

Ook testing speelde een belangrijke rol. Door automatische tests uit te voeren kon ik verschillende situaties controleren, waaronder onvoldoende voorraad, toegangsrechten en de annuleringsdeadline van 24 uur.

De totale ontwikkelingstijd was relatief kort, ongeveer 15 uur verspreid over twee dagen. Daarom heb ik prioriteit gegeven aan de verplichte functionaliteiten, de belangrijkste bedrijfsregels, automatische tests en documentatie.

De resterende verbeteringen zijn opgenomen in de planning zodat duidelijk blijft welke controles nog moeten gebeuren vóór de definitieve indiening.

---

**Bronnen en AI-gebruik:** [README](../README.md#bronnen-en-ai-gebruik).