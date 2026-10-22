
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const frontendPath = path.resolve(__dirname, '..');

const script = fs.readFileSync(
    path.join(frontendPath, 'script.js'),
    'utf8'
);

function response(data, status = 200) {
    return {
        ok: status >= 200 && status < 300,
        status,
        json: async () => data
    };
}

function setup(fakeFetch, token = null) {
    const events = [];

    const context = vm.createContext({
        window: {
            OBSIDIAN_API_BASE_URL:
                'http://127.0.0.1:8000/api'
        },

        document: {
            addEventListener: name => events.push(name)
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
