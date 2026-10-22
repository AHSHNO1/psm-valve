import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { readJSON, writeJSON } from "./db.js";

function readUsers() {
  return readJSON("users.json", []) || [];
}

export function getAuthors() {
  return readUsers().filter((user) => user.role === "author");
}

export function isAuthorActive(id) {
  return getAuthors().some((user) => user.id === id && user.active !== false);
}

export async function authenticateAuthor(username, password) {
  const author = getAuthors().find((user) => user.username === username && user.active !== false);
  if (!author || !author.passwordHash) return null;
  if (!(await bcrypt.compare(password, author.passwordHash))) return null;
  return {
    id: author.id,
    username: author.username,
    name: author.name,
    role: "author"
  };
}

export async function createAuthor({ name, username, password }) {
  const users = readUsers();
  if (users.some((user) => user.username.toLowerCase() === username.toLowerCase())) {
    return null;
  }

  const author = {
    id: randomUUID(),
    name: name.trim(),
    username: username.trim(),
    role: "author",
    passwordHash: await bcrypt.hash(password, 12),
    active: true,
    createdAt: new Date().toISOString()
  };
  users.push(author);
  writeJSON("users.json", users);
  return author;
}

export function updateAuthor(id, patch) {
  const users = readUsers();
  const index = users.findIndex((user) => user.id === id && user.role === "author");
  if (index < 0) return null;
  users[index] = { ...users[index], ...patch, id, role: "author" };
  writeJSON("users.json", users);
  return users[index];
}
