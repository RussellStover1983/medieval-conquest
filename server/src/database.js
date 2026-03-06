import initSqlJs from 'sql.js';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', 'medieval_conquest.db');

let db;

export async function initDatabase() {
  const SQL = await initSqlJs();

  // Load existing database if it exists
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // Create tables
  db.run(`CREATE TABLE IF NOT EXISTS players (
    id TEXT PRIMARY KEY,
    player_code TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    selected_class TEXT NOT NULL DEFAULT 'Knight',
    join_date TEXT NOT NULL,
    titles TEXT DEFAULT '[]',
    stats TEXT DEFAULT '{"exploration":0,"building":0,"combat":0,"contribution":0}',
    inventory TEXT DEFAULT '[]',
    personal_space TEXT DEFAULT '{}',
    currency TEXT DEFAULT '{"gold":0,"silver":0,"emerald":0,"ruby":0}',
    current_position TEXT DEFAULT '{}',
    is_founder INTEGER DEFAULT 1,
    total_play_time INTEGER DEFAULT 0,
    last_seen TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS submissions (
    id TEXT PRIMARY KEY,
    player_id TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    submitted_at TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    votes INTEGER DEFAULT 0,
    version_implemented TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS votes (
    id TEXT PRIMARY KEY,
    player_id TEXT NOT NULL,
    submission_id TEXT NOT NULL,
    voted_at TEXT NOT NULL,
    UNIQUE(player_id, submission_id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS changelog (
    id TEXT PRIMARY KEY,
    version TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    changes TEXT DEFAULT '[]',
    release_date TEXT NOT NULL,
    contributors TEXT DEFAULT '[]'
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS monuments (
    id TEXT PRIMARY KEY,
    version TEXT NOT NULL,
    event_name TEXT NOT NULL,
    active_players TEXT DEFAULT '[]',
    created_at TEXT NOT NULL
  )`);

  saveDatabase();
  return db;
}

function saveDatabase() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

function getOne(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  let result = null;
  if (stmt.step()) {
    result = stmt.getAsObject();
  }
  stmt.free();
  return result;
}

function getAll(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

export function createPlayer(displayName, selectedClass, playerCode) {
  const id = uuidv4();
  const joinDate = new Date().toISOString();

  db.run(
    `INSERT INTO players (id, player_code, display_name, selected_class, join_date, last_seen)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, playerCode, displayName, selectedClass, joinDate, joinDate]
  );
  saveDatabase();

  return getPlayerById(id);
}

export function getPlayerByCode(code) {
  return getOne('SELECT * FROM players WHERE player_code = ?', [code]);
}

export function getPlayerById(id) {
  return getOne('SELECT * FROM players WHERE id = ?', [id]);
}

export function updatePlayer(id, fields) {
  const allowed = [
    'display_name', 'selected_class', 'titles', 'stats', 'inventory',
    'personal_space', 'currency', 'current_position', 'total_play_time', 'last_seen'
  ];
  const updates = [];
  const values = [];

  for (const [key, value] of Object.entries(fields)) {
    if (allowed.includes(key)) {
      updates.push(`${key} = ?`);
      values.push(typeof value === 'object' ? JSON.stringify(value) : value);
    }
  }

  if (updates.length === 0) return getPlayerById(id);

  values.push(id);
  db.run(`UPDATE players SET ${updates.join(', ')} WHERE id = ?`, values);
  saveDatabase();

  return getPlayerById(id);
}

export function createSubmission(playerId, content, category) {
  const id = uuidv4();
  const submittedAt = new Date().toISOString();

  db.run(
    `INSERT INTO submissions (id, player_id, content, category, submitted_at)
     VALUES (?, ?, ?, ?, ?)`,
    [id, playerId, content, category || 'general', submittedAt]
  );
  saveDatabase();

  return getOne('SELECT * FROM submissions WHERE id = ?', [id]);
}

export function getSubmissions(status) {
  if (status) {
    return getAll(
      `SELECT s.*, p.display_name FROM submissions s
       LEFT JOIN players p ON s.player_id = p.id
       WHERE s.status = ? ORDER BY s.votes DESC, s.submitted_at DESC`,
      [status]
    );
  }
  return getAll(
    `SELECT s.*, p.display_name FROM submissions s
     LEFT JOIN players p ON s.player_id = p.id
     ORDER BY s.votes DESC, s.submitted_at DESC`
  );
}

export function voteForSubmission(playerId, submissionId) {
  const existing = getOne(
    'SELECT * FROM votes WHERE player_id = ? AND submission_id = ?',
    [playerId, submissionId]
  );
  if (existing) return false;

  const id = uuidv4();
  db.run(
    'INSERT INTO votes (id, player_id, submission_id, voted_at) VALUES (?, ?, ?, ?)',
    [id, playerId, submissionId, new Date().toISOString()]
  );
  db.run(
    'UPDATE submissions SET votes = votes + 1 WHERE id = ?',
    [submissionId]
  );
  saveDatabase();
  return true;
}

export function getChangelog() {
  return getAll('SELECT * FROM changelog ORDER BY release_date DESC');
}

export function getLatestVersion() {
  return getOne('SELECT * FROM changelog ORDER BY release_date DESC LIMIT 1');
}

export function createChangelogEntry(version, title, description, changes, contributors) {
  const id = uuidv4();
  const releaseDate = new Date().toISOString();

  db.run(
    `INSERT INTO changelog (id, version, title, description, changes, release_date, contributors)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, version, title, description, JSON.stringify(changes || []), releaseDate, JSON.stringify(contributors || [])]
  );
  saveDatabase();

  return getOne('SELECT * FROM changelog WHERE id = ?', [id]);
}

export function getMonuments() {
  return getAll('SELECT * FROM monuments ORDER BY created_at DESC');
}
