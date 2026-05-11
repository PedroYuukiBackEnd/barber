const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('AVISO: DATABASE_URL nao definida. Configure a URL do PostgreSQL no ambiente.');
  if (process.env.NODE_ENV === 'production') {
    throw new Error('DATABASE_URL e obrigatoria em producao.');
  }
}

const pool = new Pool({
  connectionString,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
});

function normalizeQuery(sql, params = []) {
  let index = 0;
  const text = sql.replace(/\?/g, () => `$${++index}`);
  return { text, values: params };
}

async function query(sql, params = []) {
  const normalized = normalizeQuery(sql, params);
  return pool.query(normalized.text, normalized.values);
}

function withCallback(promise, callback, mapper) {
  promise
    .then((result) => callback(null, mapper(result)))
    .catch((error) => callback(error));
}

const db = {
  query,

  get(sql, params = [], callback) {
    const promise = query(sql, params);
    if (callback) {
      withCallback(promise, callback, (result) => result.rows[0]);
      return;
    }
    return promise.then((result) => result.rows[0]);
  },

  all(sql, params = [], callback) {
    const promise = query(sql, params);
    if (callback) {
      withCallback(promise, callback, (result) => result.rows);
      return;
    }
    return promise.then((result) => result.rows);
  },

  run(sql, params = [], callback) {
    const promise = query(sql, params).then((result) => ({
      lastID: result.rows[0]?.id,
      changes: result.rowCount,
      rowCount: result.rowCount,
      rows: result.rows,
    }));

    if (callback) {
      promise
        .then((context) => callback.call(context, null))
        .catch((error) => callback(error));
      return;
    }

    return promise;
  },

  exec(sql, callback) {
    const promise = pool.query(sql);
    if (callback) {
      promise.then(() => callback(null)).catch((error) => callback(error));
      return;
    }
    return promise;
  },

  close(callback) {
    const promise = pool.end();
    if (callback) {
      promise.then(() => callback(null)).catch((error) => callback(error));
      return;
    }
    return promise;
  },
};

module.exports = db;
