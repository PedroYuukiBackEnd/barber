const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const runtimeDir = process.pkg ? path.dirname(process.execPath) : path.join(__dirname, '../..');
const configuredDatabasePath = process.env.SQLITE_DATABASE_PATH;
const databasePath = configuredDatabasePath
  ? (path.isAbsolute(configuredDatabasePath)
    ? configuredDatabasePath
    : path.join(runtimeDir, configuredDatabasePath))
  : path.join(runtimeDir, 'database.sqlite');

const nativeBindingPath = process.pkg ? path.join(runtimeDir, 'better_sqlite3.node') : null;
const databaseOptions = nativeBindingPath && fs.existsSync(nativeBindingPath)
  ? { nativeBinding: nativeBindingPath }
  : {};

const database = new Database(databasePath, databaseOptions);
database.pragma('foreign_keys = ON');

function run(sql, params = []) {
  const statement = database.prepare(sql);
  const info = statement.run(params);

  return Promise.resolve({
    lastID: info.lastInsertRowid,
    changes: info.changes,
    rowCount: info.changes,
    rows: [],
  });
}

function get(sql, params = []) {
  const statement = database.prepare(sql);
  return Promise.resolve(statement.get(params));
}

function all(sql, params = []) {
  const statement = database.prepare(sql);
  return Promise.resolve(statement.all(params));
}

function withCallback(promise, callback) {
  promise
    .then((result) => callback(null, result))
    .catch((error) => callback(error));
}

const db = {
  query(sql, params = []) {
    return all(sql, params).then((rows) => ({ rows, rowCount: rows.length }));
  },

  get(sql, params = [], callback) {
    const promise = get(sql, params);
    if (callback) {
      withCallback(promise, callback);
      return;
    }
    return promise;
  },

  all(sql, params = [], callback) {
    const promise = all(sql, params);
    if (callback) {
      withCallback(promise, callback);
      return;
    }
    return promise;
  },

  run(sql, params = [], callback) {
    const promise = run(sql, params);
    if (callback) {
      promise
        .then((context) => callback.call(context, null))
        .catch((error) => callback(error));
      return;
    }
    return promise;
  },

  exec(sql, callback) {
    const promise = Promise.resolve().then(() => database.exec(sql));
    if (callback) {
      promise.then(() => callback(null)).catch((error) => callback(error));
      return;
    }
    return promise;
  },

  close(callback) {
    const promise = Promise.resolve().then(() => database.close());
    if (callback) {
      promise.then(() => callback(null)).catch((error) => callback(error));
      return;
    }
    return promise;
  },
};

module.exports = db;
