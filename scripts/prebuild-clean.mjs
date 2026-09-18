import { readdirSync, rmSync } from "node:fs";

function clearEntries(path) {
  let entries;
  try {
    entries = readdirSync(path);
  } catch {
    return;
  }
  for (const entry of entries) {
    try {
      rmSync(`${path}/${entry}`, { recursive: true, force: true });
    } catch {
      // tolera EBUSY (mountpoints) y locks; se vacía lo que se pueda
    }
  }
}

// `.next/cache` puede estar montado por el proveedor de build (EBUSY al rmdir):
// se vacía sin intentar borrar la carpeta en sí; el resto de `.next` se elimina.
const BASE = ".next";
let rootEntries;
try {
  rootEntries = readdirSync(BASE);
} catch {
  process.exit(0);
}

for (const entry of rootEntries) {
  if (entry === "cache") {
    clearEntries(`${BASE}/cache`);
  } else {
    try {
      rmSync(`${BASE}/${entry}`, { recursive: true, force: true });
    } catch {
      clearEntries(`${BASE}/${entry}`);
    }
  }
}
