# Architectuur — The Obsidian Shelf
**Project:** Fictieve online boekenwinkel  
**Technologie:** Laravel, PHP, SQLite, HTML, CSS en JavaScript  
**Bijgewerkt:** 26 oktober 2026

[Terug naar README](../README.md) · [API](API.md) · [Testing](TESTING.md)

---

## 1. Overzicht

The Obsidian Shelf bestaat uit twee aparte deelprojecten:

- **Frontend:** de website die de gebruiker ziet en gebruikt.
- **Backend:** de Laravel REST API met de bedrijfslogica.

De backend gebruikt SQLite om alle gegevens op te slaan. De frontend spreekt de database nooit rechtstreeks aan. De scheiding tussen presentatie, logica en opslag is een belangrijk onderdeel van de architectuur.

### Eenvoudig architectuurschema

```text
GEBRUIKER
    |
    v
FRONTEND (HTML / CSS / JavaScript)
    |
    | fetch() - HTTP / JSON
    v
BACKEND (Laravel REST API)
    |
    +--> Controllers (verzoeken en validatie)
    |       |
    |       +--> ReservationService (bedrijfsregels)
    |
    +--> Eloquent Models (databasegegevens)
                |
                v
          SQLite-database
```

> Dit schema toont de duidelijke scheiding tussen presentatielaag, applicatielaag en databanklaag.

---

## 2. Projectstructuur

```text
the-obsidian-shelf/
|
|-- README.md
|-- docs/
|   |-- API.md
|   |-- ARCHITECTURE.md
|   |-- PLANNING.md
|   `-- TESTING.md
|
|-- backend/
|   |-- app/
|   |   |-- Http/Controllers/Api/
|   |   |-- Models/
|   |   `-- Services/ReservationService.php
|   |-- database/
|   |   |-- migrations/
|   |   `-- seeders/
|   |-- routes/api.php
|   `-- tests/Feature/
|
`-- frontend/
    |-- index.html
    |-- style.css
    |-- config.js
    |-- script.js                # Enkel initialisatie
    |-- js/
    |   |-- store.js            # Status en hulpfuncties
    |   |-- bookstore-dao.js    # DAO en HTTP-communicatie
    |   |-- ui.js               # Centrale initialisatie
    |   |-- dom.js              # DOM-hulpfuncties en dialogen
    |   |-- catalog.js          # Catalogus, filters en boekdetail
    |   |-- account.js          # Accounts en profiel
    |   |-- reservations.js     # Reservering en annulering
    |   |-- wishlist.js         # Wishlist
    |   `-- reviews.js          # Reviews
    `-- tests/api.test.cjs
```

---

## 3. Verantwoordelijkheden per laag

### Frontend

- `index.html` bevat de structuur van de website.
- `style.css` verzorgt het dark-academia-design.
- `config.js` bevat het adres van de backend-API.
- `js/store.js`: `Store` bewaart tijdelijke status in de browser.
- `js/bookstore-dao.js`: `BookstoreDAO` beheert alle API-paden, Bearer-tokens, JSON en foutafhandeling; dit bestand bevat **geen DOM-manipulatie**.
- `js/ui.js`: `ArchiveUI` coördineert de initialisatie; de functies zitten in aparte featurebestanden.
- `js/catalog.js`: boeken laden, zoeken, filteren en details tonen.
- `js/account.js`: account, profiel en sessie beheren.
- `js/reservations.js`: reserveren en annuleren via de DAO.
- `js/wishlist.js` en `js/reviews.js`: favorieten en beoordelingen.
- `js/dom.js`: gedeelde UI-hulpfuncties zoals modals, meldingen en tellers.
- `script.js`: registreert alleen de `DOMContentLoaded`-initialisatie.

### Backend

- `routes/api.php` definieert de beschikbare API-routes.
- `AuthController` beheert registratie, login en profiel.
- `BookController` geeft de catalogus en boekdetails terug.
- `ReservationController` ontvangt reserveringsverzoeken.
- `ReservationService` beheert voorraad en annuleringen.
- `WishlistController` beheert persoonlijke favorieten.
- `ReviewController` controleert en bewaart beoordelingen.
- Eloquent Models lezen en wijzigen de database.

### Database

De belangrijkste modellen zijn:

- **User:** gegevens van een gebruiker.
- **Book:** ISBN, titel, auteur, omschrijving, prijs en stock.
- **Reservation:** gebruiker, boek, status en afhaaldatum.
- **Review:** score, tekst en de bijbehorende gebruiker en het boek.
- **Wishlist:** de favoriete boeken van een gebruiker.

Een gebruiker kan meerdere reserveringen, reviews en wishlist-items hebben. Een boek kan in meerdere van deze relaties voorkomen.

---

## 4. Gebruikte design patterns

### 4.1 MVC (Model - View - Controller)

Laravel gebruikt MVC-principes:

- **Model:** Eloquent-modellen zoals `Book` en `Reservation`.
- **Controller:** bijvoorbeeld `BookController` en `AuthController`.
- **View:** de afzonderlijke HTML/CSS/JavaScript-frontend.

De frontend is geen Laravel Blade-view, maar een apart deelproject.

### 4.2 DAO (Data Access Object)

`BookstoreDAO` in `frontend/js/bookstore-dao.js` centraliseert de communicatie tussen de website en de REST API. Bij een wijziging van een endpoint of HTTP-header wordt de aanpassing in dit bestand gedaan; de UI spreekt uitsluitend de publieke DAO-methoden aan.

```js
getReservations: () =>
    BookstoreDAO.request('/reservations'),

reserve: bookId =>
    BookstoreDAO.request('/reservations', {
        method: 'POST',
        body: { book_id: bookId }
    })
```

Voordeel: HTTP-verzoeken, JSON-verwerking, tokens en fouten worden op één plaats behandeld.

**Testbaarheid en losse koppeling:** `BookstoreDAO` leest het `Store`-object niet rechtstreeks. De applicatie configureert bij het opstarten een functie die het token teruggeeft:

```javascript
BookstoreDAO.configure({ tokenProvider: () => Store.token });
```

Bij tests kan de HTTP-client en de tokenprovider onafhankelijk worden vervangen door testfuncties. De API-code hoeft hiervoor niet aangepast te worden. Dit past het principe *dependency injection* toe op de frontend.

### 4.3 Service Layer

`ReservationService` bevat de bedrijfsregels voor reserveringen:

- Stock moet groter dan nul zijn om te reserveren.
- Bij reserveren vermindert de stock met één.
- Annuleren is alleen mogelijk binnen 24 uur.
- Alleen de eigenaar mag een reservering annuleren.
- Een succesvolle annulering geeft één exemplaar terug.

Voordeel: complexe regels staan niet verspreid over controllers.

### 4.4 Dependency Injection

Laravel geeft de service automatisch aan de controller:

```php
public function store(
    Request $request,
    ReservationService $service
): JsonResponse
```

Voordeel: onderdelen hebben een duidelijke verantwoordelijkheid en zijn eenvoudiger te onderhouden en te testen.

### 4.5 ORM en database-transacties

Eloquent ORM verzorgt de databasequeries en relaties.

Voor een reservering gebruikt de service een transactie:

1. Controleer of het boek op voorraad is.
2. Verminder de stock met één.
3. Maak een reservering aan.
4. Bewaar beide wijzigingen samen.

Als er iets fout gaat, kan de transactie teruggedraaid worden. Zo vermijdt de applicatie een reservering zonder correcte stock.

---

## 5. Belangrijke gebruikersflows

### Een boek reserveren

1. De gebruiker klikt op **Reserve**.
2. `ArchiveUI` roept `BookstoreDAO.reserve(bookId)` aan.
3. De frontend stuurt `POST /api/reservations` naar Laravel.
4. Laravel controleert `login` en `book_id`.
5. `ReservationService` past de stock aan en bewaart de reservering.
6. De frontend toont de bevestiging en de nieuwe stock.

> Geen stock? De API geeft `409 Conflict` en maakt geen reservering aan.

### Een reservering annuleren

1. De gebruiker ziet de annuleerknop bij een recente reservering.
2. De frontend verstuurt `DELETE /api/reservations/{reservation}`.
3. De backend controleert eigenaar, status en de grens van 24 uur.
4. De reservering krijgt de status `cancelled`.
5. De stock stijgt met één binnen dezelfde transactie.
6. De frontend toont de aangepaste status.

> Belangrijk: het verbergen van de knop is niet voldoende. De backend moet elke aanvraag opnieuw controleren.

---

## 6. Beveiliging en correctheid

- **Laravel Sanctum:** beschermt persoonlijke API-routes.
- **Validatie:** voorkomt ongeldige input.
- **Gebruikerscontrole:** persoonlijke reserveringen en wishlists worden beperkt tot de ingelogde gebruiker.
- **Stockcontrole:** voorkomt reserveringen met negatieve voorraad.
- **Transacties:** houden reserveringen en stock synchroon.
- **Statuscontrole:** voorkomt dat dezelfde annulering de stock meerdere keren verhoogt.
- **Publieke reviewprivacy:** de boekdetail-API laadt van de reviewer alleen `id`, `name` en `username`, niet het e-mailadres.

> **Huidige implementatie:** `ReviewController` aanvaardt voor reviews enkel reserveringen met status `confirmed` of `collected`. Een `cancelled`-reservering verleent dus geen reviewrecht (zie de annuleringstests in [TESTING.md](TESTING.md)).

---

## 7. Ontwerpkeuzes en toekomstige uitbreidingen

- **Waarom aparte projecten?** De frontend en backend kunnen apart worden onderhouden, getest en gedeployed.
- **Waarom SQLite?** De database is eenvoudig te gebruiken voor een lokale demonstratie en vereist geen aparte databaseserver.
- **Waarom JavaScript zonder framework?** De website gebruikt standaard HTML, CSS en JavaScript. De code is **opgesplitst in aparte scripts per verantwoordelijkheid** zonder bijkomende frameworkafhankelijkheid.
- **Waarom klassieke scripts met `Object.assign`?** `ArchiveUI` krijgt zijn methoden uit aparte featurebestanden. Dit behoudt de bestaande werking en `this`-aanroepen, terwijl bijvoorbeeld DAO-onderhoud beperkt blijft tot `bookstore-dao.js`. De scriptvolgorde in `index.html` is bewust vastgelegd: `Store`, DAO, UI-coördinator, UI-functies en tenslotte het opstartscript.
- **Afweging:** deze oplossing scheidt de bestanden fysiek en houdt de API-communicatie uit de UI. De klassieke scripts gebruiken nog gedeelde globale objecten (`Store`, `BookstoreDAO`, `ArchiveUI`) en de UI-methoden worden via `Object.assign` toegevoegd. Het zijn dus **geen onafhankelijk importeerbare ES-modules**. Later zouden `import`/`export` en interfaces de koppeling verder kunnen verminderen.

**Beperking:** betalingen gebeuren volgens de opdracht bij afhaling. Er is nog geen online betaalsysteem of volledige afhaaladministratie.

---

## 8. Controle van de nieuwe structuur

Op 26 oktober 2026 zijn na de opsplitsing **16 van de 16 frontendtests geslaagd**. Vier bijkomende tests controleren specifiek de volgorde van de scripts, de afwezigheid van DOM-code in het DAO-bestand, de verdeling van de verantwoordelijkheden en de injecteerbare HTTP-client en tokenprovider. De student heeft de oorspronkelijke modulaire versie met de echte backend als operationeel bevestigd. De extra aanpassing aan de DAO is automatisch getest maar moet na het kopiëren nog manueel worden gecontroleerd. De backendcode is niet veranderd; de laatst bevestigde Laravel-testsuite telde 21 geslaagde tests en 103 assertions op 23 oktober 2026.

---

## 9. Bronnen

Voor het visuele concept gebruikte ik mijn eerdere project:

**The Silken Manuscript**

De volledige bronnenlijst en de verantwoording van het gebruik van ChatGPT staan in de [README](../README.md#bronnen-en-ai-gebruik).
