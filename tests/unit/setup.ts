// Node 26 exposes an experimental global localStorage that throws or is undefined without a flag, and it
// shadows happy-dom's. Tests get a plain in-memory Storage instead.
class MemoryStorage implements Storage {
  private m = new Map<string, string>()
  get length() { return this.m.size }
  clear() { this.m.clear() }
  getItem(k: string) { return this.m.get(k) ?? null }
  key(i: number) { return [...this.m.keys()][i] ?? null }
  removeItem(k: string) { this.m.delete(k) }
  setItem(k: string, v: string) { this.m.set(k, String(v)) }
  [name: string]: unknown
}

Object.defineProperty(globalThis, 'localStorage', { value: new MemoryStorage(), configurable: true, writable: true })
