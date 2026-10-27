# REST API — The Obsidian Shelf

> **Technische documentatie van de Laravel REST API.**  
> Catalogus, accounts, reserveringen, voorraad, wishlist en reviews.

**API-base-URL (lokaal):** `http://127.0.0.1:8000/api`  
**Formaat:** JSON · **Authenticatie:** Laravel Sanctum (Bearer-token)

[← Terug naar README](../README.md) · [Architectuur](ARCHITECTURE.md) · [Testplan](TESTING.md)

---

## Inhoud

1. [Communicatie en authenticatie](#communicatie-en-authenticatie)
2. [Endpointoverzicht](#endpointoverzicht)
3. [Catalogus](#catalogus)
4. [Accounts en profiel](#accounts-en-profiel)
5. [Reserveringen](#reserveringen)
6. [Wishlist en reviews](#wishlist-en-reviews)
7. [HTTP-statuscodes](#http-statuscodes)
8. [Testen met curl](#testen-met-curl)

---

## Communicatie en authenticatie

De frontend communiceert met Laravel via de Fetch API en `BookstoreDAO` in `frontend/js/bookstore-dao.js`. De DAO verwerkt HTTP-verzoeken, tokens, JSON en API-fouten. De UI gebruikt de publieke DAO-methoden en roept niet zelf `fetch()` aan. De afhankelijkheden voor het toegangstoken en de HTTP-client worden bij de opstart geconfigureerd.

### Standaardheaders

```http
Accept: application/json
Content-Type: application/json
```

Bij beveiligde routes wordt ook deze header meegestuurd:

```http
Authorization: Bearer <access_token>
```

> Het token wordt ontvangen via `POST /register` of `POST /login`. Gebruik nooit echte tokens of wachtwoorden in screenshots, documentatie of Git-commits.

---

## Endpointoverzicht

| Methode | Route | Authenticatie | Beschrijving |
| :---: | --- | :---: | --- |
| `GET` | `/books` | Nee | Catalogus met zoeken, stockfilter en paginering |
| `GET` | `/books/{book}` | Nee | Details van een boek en bijbehorende reviews |
| `POST` | `/register` | Nee | Nieuw account aanmaken |
| `POST` | `/login` | Nee | Inloggen en token ontvangen |
| `GET` | `/me` | Ja | Eigen profiel ophalen |
| `PATCH` | `/me` | Ja | Eigen profiel aanpassen |
| `POST` | `/logout` | Ja | Huidig toegangstoken intrekken |
| `GET` | `/reservations` | Ja | Eigen reserveringen ophalen |
| `POST` | `/reservations` | Ja | Een boek reserveren |
| `DELETE` | `/reservations/{reservation}` | Ja | Eigen reservering binnen 24 uur annuleren |
| `GET` | `/wishlist` | Ja | Eigen wishlist ophalen |
| `POST` | `/wishlist/toggle` | Ja | Boek toevoegen of verwijderen |
| `POST` | `/books/{book}/reviews` | Ja | Review plaatsen bij een geldig gereserveerd boek |

> **Opmerking:** `{book}` en `{reservation}` zijn numerieke database-ID's. De routes hieronder staan *na* de prefix `/api`.

---

## Catalogus

### `GET /books`

Retourneert een **gepagineerde lijst** van beschikbare catalogusgegevens.

| Queryparameter | Type | Betekenis |
| --- | --- | --- |
| `search` | String (max. 100 tekens) | Zoeken op titel, auteur, ISBN of tropes |
| `in_stock` | Boolean | Enkel boeken tonen met `stock > 0` |
| `per_page` | Integer (1–100) | Aantal boeken per pagina |
| `page` | Positief paginanummer | Gewenste pagina |

**Voorbeeld:**

```http
GET /api/books?search=magic&in_stock=1&per_page=10&page=1
```

**Response:** `200 OK`, met een Laravel-paginator die onder meer `data`, `current_page`, `last_page` en `total` bevat.

### `GET /books/{book}`

Retourneert één boek inclusief `reviews` en de bijbehorende gebruikersinformatie.

| Veld | Beschrijving |
| --- | --- |
| `isbn` | Unieke ISBN-code |
| `title` | Titel |
| `author` | Auteur |
| `description` | Beschrijving |
| `price` | Prijs |
| `stock` | Actuele voorraad |
| `tropes` | Categorieën/tropes |
| `reviews` | Reviews met score, tekst en gebruiker |

**Response:** `200 OK`. Een onbekend boek geeft `404 Not Found`.

**Privacy:** in `reviews[*].user` worden alleen `id`, `name` en `username` teruggestuurd. E-mailadressen en andere privéprofielvelden worden niet publiek gemaakt.

---

## Accounts en profiel

### `POST /register`

**Request:**

```json
{
  "name": "Demo Reader",
  "username": "demo_reader",
  "email": "reader@example.test",
  "password": "voorbeeldWachtwoord123",
  "password_confirmation": "voorbeeldWachtwoord123"
}
```

| Veld | Regels |
| --- | --- |
| `name` | Verplicht, maximaal 255 tekens |
| `username` | Verplicht, uniek, 3–50 tekens, letters/cijfers/streepjes/underscores |
| `email` | Verplicht, geldig en uniek |
| `password` | Verplicht, minimaal 8 tekens |
| `password_confirmation` | Moet overeenkomen met `password` |

**Succes:** `201 Created`, met `user`, `access_token` en `token_type`.  
**Validatiefout:** `422 Unprocessable Entity`.

### `POST /login`

**Request:**

```json
{
  "email": "reader@example.test",
  "password": "voorbeeldWachtwoord123"
}
```

**Succes:** `200 OK`, met gebruikersgegevens en toegangstoken.  
**Ongeldige inloggegevens:** `422`.

### `GET /me`

**Authenticatie verplicht.** Geeft de eigen gebruiker terug in het veld `user`.

### `PATCH /me`

Wijzigt de gegevens van de ingelogde gebruiker.

| Veld | Regels |
| --- | --- |
| `name` | Verplicht |
| `username` | Verplicht en uniek (eigen gebruikersnaam toegestaan) |
| `email` | Verplicht, geldig en uniek (eigen e-mailadres toegestaan) |
| `password` | Optioneel, minimaal 8 tekens als ingevuld |
| `password_confirmation` | Verplicht wanneer het wachtwoord wordt gewijzigd |

**Succes:** `200 OK`, met het bijgewerkte `user`-object.  
**Validatiefout:** `422`.

### `POST /logout`

Trekt het huidige Sanctum-token in.

**Succes:** `200 OK`.

---

## Reserveringen

### `GET /reservations`

Retourneert **alleen de reserveringen van de ingelogde gebruiker**, met het bijbehorende boek, nieuwste eerst.

**Succes:** `200 OK`, een JSON-array.

### `POST /reservations`

**Request:**

```json
{
  "book_id": 1
}
```

**Succes:** `201 Created`.

```json
{
  "message": "Reservation confirmed. Pay when collecting your book within seven days.",
  "reservation": {
    "id": 12,
    "book_id": 1,
    "user_id": 3,
    "status": "confirmed",
    "price_at_reservation": "19.95",
    "pickup_until": "..."
  }
}
```

*Bovenstaand object is een verkort illustratief voorbeeld; het echte antwoord bevat ook het gerelateerde boek en tijdstempels.*

**Bedrijfsregel:** `ReservationService.reserve()` verlaagt de stock alleen als `stock > 0`. Het opslaan van de reservering en het verlagen van de stock gebeuren in **één databasetransactie**.

| Situatie | Antwoord |
| --- | --- |
| Geldig boek op voorraad | `201 Created` |
| Geen voorraad meer | `409 Conflict` |
| Onbekend `book_id` | `422 Unprocessable Entity` |
| Niet ingelogd | `401 Unauthorized` |

### `DELETE /reservations/{reservation}`

Annuleert een bestaande reservering.

**Voorwaarden:**

1. De gebruiker is ingelogd en is de **eigenaar**.
2. De status van de reservering is `confirmed`.
3. De reservering is **minder dan 24 uur geleden** aangemaakt.

**Succes:** `200 OK`.

```json
{
  "success": true,
  "message": "Reservation cancelled successfully.",
  "reservation": {
    "id": 12,
    "status": "cancelled",
    "book_id": 1
  }
}
```

*Verkort illustratief antwoord.*

De backend verhoogt de boekvoorraad met één. Een tweede annulatie mag **niet opnieuw** stock toevoegen.

**Consistentie van reviews bij annulering:** binnen dezelfde databasetransactie controleert `ReservationService` of de gebruiker voor dit boek nog een andere reservering met status `confirmed` of `collected` heeft. Als dat **niet** zo is, verwijdert de backend de bestaande review van die gebruiker voor dit boek. Bestaat er nog een andere geldige reservering, dan **blijft de review bewaard**. Dit verandert de HTTP-statuscode van een geslaagde annulering niet (`200 OK`).

| Situatie | Antwoord |
| --- | --- |
| Eigen bevestigde reservering, binnen 24 uur | `200 OK` |
| Al geannuleerd | `409 Conflict` |
| Precies 24 uur of later | `409 Conflict` |
| Status niet `confirmed` | `409 Conflict` |
| Reservering bestaat niet / is van andere gebruiker | `404 Not Found` |
| Niet ingelogd | `401 Unauthorized` |

---

## Wishlist en reviews

### `GET /wishlist`

Geeft de wishlist-items van de ingelogde gebruiker terug, inclusief de gerelateerde boeken.

**Succes:** `200 OK`.

### `POST /wishlist/toggle`

**Request:**

```json
{
  "book_id": 1
}
```

| Voorafgaande toestand | Actie | Antwoord |
| --- | --- | --- |
| Boek staat niet in wishlist | Toevoegen | `201`, `wishlisted: true` |
| Boek staat al in wishlist | Verwijderen | `200`, `wishlisted: false` |

### `POST /books/{book}/reviews`

**Request:**

```json
{
  "score": 5,
  "content": "Een boeiend verhaal met sterke personages."
}
```

**Validatie:**

- `score`: geheel getal van **1 t/m 5**.
- `content`: tekst van **3 t/m 1000 tekens**.
- Maximaal **één review per gebruiker per boek**.
- De gebruiker moet een **geldige reservering** voor het boek hebben.

| Situatie | Antwoord |
| --- | --- |
| Eerste geldige review | `201 Created` |
| Geen geldige reservering | `403 Forbidden` |
| Al een review geschreven | `409 Conflict` |
| Ongeldige score of tekst | `422 Unprocessable Entity` |

> **Implementatie:** `ReviewController` laat een review uitsluitend toe als de gebruiker voor het boek een reservering met status `confirmed` of `collected` heeft. `ReservationService` verwijdert een bestaande review na annulering alleen wanneer geen andere geldige reservering overblijft. Zie [Testing](TESTING.md), scenario's CAN-08 t/m CAN-10.

---

## HTTP-statuscodes

| Code | Betekenis in dit project |
| :---: | --- |
| `200` | Opdracht succesvol |
| `201` | Nieuw account, nieuwe reservering, wishlist-item of review aangemaakt |
| `401` | Niet ingelogd / geen geldig token |
| `403` | Geen toestemming om review te schrijven |
| `404` | Boek of toegankelijke reservering niet gevonden |
| `409` | Conflict: stock op, dubbele review of annulatie geweigerd |
| `422` | Invoer voldoet niet aan validatieregels |

---

## Testen met curl

### Catalogus ophalen zonder login

```bash
curl -H "Accept: application/json" \
  "http://127.0.0.1:8000/api/books?in_stock=1&per_page=10"
```

### Geauthenticeerd verzoek

Vervang `<TOKEN>` door een eigen lokaal testtoken.

```bash
curl -H "Accept: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  "http://127.0.0.1:8000/api/reservations"
```

---

**Verder lezen:** [README](../README.md) · [Architectuur](ARCHITECTURE.md) · [Planning](PLANNING.md) · [Testplan](TESTING.md)

**Bronnen en AI-verantwoording:** zie [Bronnen en AI-gebruik in de README](../README.md#bronnen-en-ai-gebruik), inclusief het eerdere eigen designproject [The Silken Manuscript](https://github.com/benhadiSalma/The-Silken-Manuscript).