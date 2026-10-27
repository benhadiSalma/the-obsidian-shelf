# Backend — The Obsidian Shelf

> Laravel REST API voor de fictieve romantasy-boekwinkel.  
> De volledige projectdocumentatie staat in de [hoofd-README](../README.md).

## Overzicht

- **Laravel 13 / PHP 8.3+** met SQLite en Sanctum.
- `routes/api.php` bevat de publieke en beveiligde API-routes.
- `app/Http/Controllers/Api/` bevat de controllers voor boeken, accounts, reviews, wishlist en reserveringen.
- `app/Services/ReservationService.php` houdt reservering, stockwijziging en reviewconsistentie samen in databasetransacties: na annulering verdwijnt een review alleen als er geen andere geldige reservering van dat boek bestaat.
- `app/Models/` bevat de Eloquent-modellen en relaties.

## Lokaal installeren (Windows CMD)

Vanuit `backend/`:

```cmd
composer install
```

Als `.env` nog niet bestaat (enkel bij een eerste installatie):

```cmd
copy .env.example .env
php artisan key:generate
```

Configureer `DB_CONNECTION=sqlite` en maak indien nodig het bestand `database/database.sqlite` aan. Daarna:

```cmd
php artisan migrate
php artisan db:seed
php artisan serve --host=127.0.0.1 --port=8000
```

**Test de API:** <http://127.0.0.1:8000/api/books>

Gebruik `migrate:fresh` niet op een bestaande database: dit verwijdert alle gegevens.

## Tests

```cmd
php artisan test
```

**Definitief resultaat (26 oktober 2026):** de volledige Laravel-testsuite werd tweemaal succesvol uitgevoerd: **23 tests geslaagd, 118 assertions, 0 mislukt**. Dit omvat **10 annuleringstests**, waaronder het verwijderen of behouden van reviews na annulering, en de privacytest. Deze test wordt niet dubbel geteld. Zie [TESTING.md](../docs/TESTING.md) voor alle scenario's en resultaten.

## Documentatie

- [API-endpoints](../docs/API.md)
- [Architectuur en design patterns](../docs/ARCHITECTURE.md)
- [Testscenario's en resultaten](../docs/TESTING.md)
- [Projectplanning](../docs/PLANNING.md)
- [Installatie, deployment, bronnen en AI-verantwoording](../README.md)

**Veiligheid:** commit nooit `.env`, tokens, lokale productiegegevens of vertrouwelijke gebruikersinformatie.
