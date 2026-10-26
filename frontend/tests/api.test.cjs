'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const frontendPath = path.resolve(__dirname, '..');

// Load the exact script list used by index.html in the same order.
// Classic scripts intentionally share the same global lexical environment.
const scripts = [
    'js/store.js',
    'js/bookstore-dao.js',
    'js/ui.js',
    'js/dom.js',
    'js/catalog.js',
    'js/account.js',
    'js/reservations.js',
    'js/wishlist.js',
    'js/reviews.js',
    'script.js'
];

const script = scripts.map(file => fs.readFileSync(
    path.join(frontendPath, file), 'utf8'
)).join('\n');

function response(data, status = 200) {
    return {
        ok: status >= 200 && status < 300,
        status,
        json: async () => data
    };
}

function setup(fakeFetch, token = null) {
    const events = [];
    const elements = new Map();

    const context = vm.createContext({
        window: {
            OBSIDIAN_API_BASE_URL:
                'http://127.0.0.1:8000/api',
            confirm: () => true
        },

        document: {
            addEventListener: name => events.push(name),
            getElementById(id) {
                if (!elements.has(id)) elements.set(id, { textContent: '' });
                return elements.get(id);
            }
        },

        localStorage: {
            getItem: () => token
        },

        fetch: fakeFetch,
        Intl,
        console
    });

    vm.runInContext(script, context, {
        filename: 'frontend/script.js'
    });

    return {
        dao: vm.runInContext('BookstoreDAO', context),
        store: vm.runInContext('Store', context),
        ui: vm.runInContext('ArchiveUI', context),
        elements,
        events
    };
}

// TEST 1 - Initialization

test('le frontend initialise uniquement au chargement du DOM', () => {
    const { events } = setup(
        async () => response({})
    );

    assert.deepEqual(events, [
        'DOMContentLoaded'
    ]);

    assert.doesNotMatch(
        script,
        /\b(?:location\.reload|window\.location\.reload)\s*\(/
    );
});

// TEST 2 - Catalog pagination

test('le catalogue récupère toutes les pages et garde les livres', async () => {
    const calls = [];

    const { dao } = setup(async (url, options) => {
        calls.push({ url, options });

        return url.includes('page=2')
            ? response({
                data: [{ id: 2 }],
                last_page: 2
            })
            : response({
                data: [{ id: 1 }],
                last_page: 2
            });
    });

    const books = await dao.getCatalog();

    assert.equal(books.length, 2);
    assert.equal(books[0].id, 1);
    assert.equal(books[1].id, 2);

    assert.equal(calls.length, 2);

    assert.match(
        calls[0].url,
        /\/api\/books\?per_page=100&page=1/
    );

    assert.equal(
        calls[0].options.method,
        'GET'
    );
});

// TEST 3 - Authentication token

test('les requêtes authentifiées envoient un token Bearer', async () => {
    let call;

    const { dao } = setup(
        async (url, options) => {
            call = { url, options };

            return response({
                user: { id: 7 }
            });
        },
        'sample-token'
    );

    await dao.me();

    assert.equal(
        call.url,
        'http://127.0.0.1:8000/api/me'
    );

    assert.equal(
        call.options.headers.Authorization,
        'Bearer sample-token'
    );

    assert.equal(
        call.options.headers.Accept,
        'application/json'
    );
});

// TEST 4 - Registration

test('l’inscription envoie les données en POST JSON', async () => {
    let call;

    const { dao } = setup(async (url, options) => {
        call = { url, options };

        return response({
            access_token: 'x'
        }, 201);
    });

    const user = {
        name: 'Eva',
        username: 'eva1',
        email: 'eva@example.test',
        password: 'password123',
        password_confirmation: 'password123'
    };

    await dao.register(user);

    assert.match(
        call.url,
        /\/api\/register$/
    );

    assert.equal(
        call.options.method,
        'POST'
    );

    assert.equal(
        call.options.headers['Content-Type'],
        'application/json'
    );

    assert.equal(
        JSON.parse(call.options.body).username,
        'eva1'
    );
});

// TEST 5 - Reservations

test('une réservation envoie le bon identifiant sans rechargement navigateur', async () => {
    let call;

    const { dao } = setup(async (url, options) => {
        call = { url, options };

        return response({
            reservation: {
                id: 9,
                book_id: 23
            }
        }, 201);
    });

    const result = await dao.reserve(23);

    assert.match(
        call.url,
        /\/api\/reservations$/
    );

    assert.equal(
        call.options.method,
        'POST'
    );

    assert.equal(
        JSON.parse(call.options.body).book_id,
        23
    );

    assert.equal(
        result.reservation.book_id,
        23
    );
});

// TEST 6 - Wishlist and reviews

test('les favoris et les avis utilisent les routes Laravel prévues', async () => {
    const calls = [];

    const { dao } = setup(async (url, options) => {
        calls.push({ url, options });

        return response({}, 201);
    });

    await dao.toggleWishlist(4);

    await dao.review(
        4,
        5,
        'Très bon livre !'
    );

    assert.match(
        calls[0].url,
        /\/api\/wishlist\/toggle$/
    );

    assert.equal(
        JSON.parse(calls[0].options.body).book_id,
        4
    );

    assert.match(
        calls[1].url,
        /\/api\/books\/4\/reviews$/
    );

    assert.equal(
        JSON.parse(calls[1].options.body).score,
        5
    );

    assert.equal(
        JSON.parse(calls[1].options.body).content,
        'Très bon livre !'
    );
});

// TEST 7 - Laravel validation errors

test('les erreurs de validation Laravel sont affichables', async () => {
    const { dao } = setup(async () => response({
        message: 'The given data was invalid.',

        errors: {
            username: [
                'This username is already taken.'
            ]
        }
    }, 422));

    await assert.rejects(
        dao.register({}),
        error =>
            error.status === 422 &&
            error.message ===
                'This username is already taken.'
    );
});

// TEST 8 - HTML and JavaScript integration

test('le JavaScript ne référence aucun ID HTML inexistant', () => {
    const html = fs.readFileSync(
        path.join(frontendPath, 'index.html'),
        'utf8'
    );

    const ids = new Set(
        [...html.matchAll(/\bid=["']([^"']+)["']/g)]
            .map(match => match[1])
    );

    const used = [
        ...script.matchAll(
            /getElementById\(\s*["']([^"']+)["']/g
        )
    ].map(match => match[1]);

    const missing = [
        ...new Set(used)
    ].filter(id => !ids.has(id));

    assert.deepEqual(missing, []);
});


// TEST 9 - Cancellation sends DELETE and Bearer token

test('annuler une réservation appelle la bonne route DELETE avec le token', async () => {
    let call;

    const { dao } = setup(async (url, options) => {
        call = { url, options };
        return response({ success: true, reservation: { id: 42, status: 'cancelled' } });
    }, 'demo-token');

    const result = await dao.cancelReservation(42);

    assert.equal(call.url, 'http://127.0.0.1:8000/api/reservations/42');
    assert.equal(call.options.method, 'DELETE');
    assert.equal(call.options.headers.Authorization, 'Bearer demo-token');
    assert.equal(result.reservation.status, 'cancelled');
});

// TEST 10 - Cancelled reservations cannot unlock reviews

test('une réservation annulée ne débloque pas les avis', () => {
    const { store } = setup(async () => response({}));
    store.reservations = [{ book_id: 7, status: 'cancelled' }];
    assert.equal(store.hasReserved(7), false);

    store.reservations.push({ book_id: 7, status: 'confirmed' });
    assert.equal(store.hasReserved(7), true);
});

// TEST 11 - Actual cancellation updates the state and counters

test('une annulation réussie met à jour stock, statut et compteurs', async () => {
    const { store, ui } = setup(async () => response({
        success: true,
        reservation: {
            id: 15,
            book_id: 7,
            status: 'cancelled',
            book: { id: 7, stock: 4 }
        }
    }), 'demo-token');

    store.books = [{ id: 7, stock: 3 }];
    store.reservations = [{
        id: 15,
        book_id: 7,
        status: 'confirmed',
        created_at: new Date().toISOString()
    }];

    const effects = [];
    ui.renderProfile = () => effects.push('profile');
    ui.renderCatalog = () => effects.push('catalog');
    ui.updateCounters = () => effects.push('counters');
    ui.showToast = message => effects.push(message);
    ui.handleError = error => { throw error; };

    await ui.handleCancellation(15);

    assert.equal(store.reservations[0].status, 'cancelled');
    assert.equal(store.books[0].stock, 4);
    assert.equal(store.hasReserved(7), false);
    assert.ok(effects.includes('counters'));
    assert.ok(effects.includes('catalog'));
    assert.ok(effects.includes('profile'));
});


// TEST 12 - Counts active reservations only

test('le compteur Purchases ignore les réservations annulées', () => {
    const { store, ui, elements } = setup(async () => response({}));
    store.wishlistIds = [1, 2];
    store.reservations = [
        { id: 1, status: 'confirmed' },
        { id: 2, status: 'cancelled' },
        { id: 3, status: 'collected' }
    ];

    ui.updateCounters();

    assert.equal(elements.get('wishlist-count').textContent, 2);
    assert.equal(elements.get('purchases-count').textContent, 2);
});


// TEST 13 - Script loading order matches dependencies

test('les modules sont inclus dans l’ordre de leurs dépendances', () => {
    const html = fs.readFileSync(path.join(frontendPath, 'index.html'), 'utf8');
    const listed = [...html.matchAll(/<script\s+src="([^"]+)"/g)]
        .map(match => match[1]);
    assert.deepEqual(listed, ['config.js', ...scripts]);
    assert.equal(new Set(listed).size, listed.length);
});

// TEST 14 - DAO remains separated from DOM code

test('les accès API sont isolés du code de présentation', () => {
    const dao = fs.readFileSync(path.join(frontendPath, 'js/bookstore-dao.js'), 'utf8');
    assert.match(dao, /const BookstoreDAO/);
    assert.match(dao, /async request\(/);
    assert.doesNotMatch(dao, /\bStore\b/);
    assert.doesNotMatch(dao, /document\./);
    assert.doesNotMatch(dao, /innerHTML|querySelector|addEventListener/);
});

// TEST 15 - Single entrypoint, separate feature responsibilities

test('le point d’entrée est petit et les responsabilités sont réparties', () => {
    const entry = fs.readFileSync(path.join(frontendPath, 'script.js'), 'utf8');
    const reservations = fs.readFileSync(path.join(frontendPath, 'js/reservations.js'), 'utf8');
    const reviews = fs.readFileSync(path.join(frontendPath, 'js/reviews.js'), 'utf8');
    const accounts = fs.readFileSync(path.join(frontendPath, 'js/account.js'), 'utf8');
    assert.match(entry, /ArchiveUI\.init\(\)/);
    assert.doesNotMatch(entry, /BookstoreDAO|handleReservation|renderCatalog/);
    assert.match(reservations, /handleCancellation\(/);
    assert.match(reviews, /bindReviewForm\(/);
    assert.match(accounts, /bindAuth\(/);
});


// TEST 16 - Dependency injection genuinely isolates the DAO
test('le DAO accepte un transport HTTP et un fournisseur de token injectés', async () => {
    const { dao, store } = setup(
        async () => { throw new Error('Original fetch must not be used'); },
        'original-token'
    );

    let request;
    dao.configure({
        tokenProvider: () => 'injected-token',
        fetchImpl: async (url, options) => {
            request = { url, options };
            return response({ user: { id: 42 } });
        }
    });

    // Changing UI state must not override an injected DAO dependency.
    store.token = 'other-token';
    const result = await dao.me();

    assert.equal(result.user.id, 42);
    assert.equal(request.url, 'http://127.0.0.1:8000/api/me');
    assert.equal(request.options.headers.Authorization, 'Bearer injected-token');
});

