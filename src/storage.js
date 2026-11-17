import { APP_CONFIG } from './config'
const KEY = 'pew_demo_v1'
const clone = x => JSON.parse(JSON.stringify(x))
export function loadState() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { accounts: [], currentId: null, transactions: clone(APP_CONFIG.demoTransactions), balance: APP_CONFIG.wallet.initialBalance, notifications: [], preferences: { dark: false, hideBalance: false, language: 'ar' } }
    const s = JSON.parse(raw)
    if (!s || typeof s !== 'object') throw new Error('bad state')
    return { accounts: [], currentId: null, transactions: clone(APP_CONFIG.demoTransactions), balance: APP_CONFIG.wallet.initialBalance, notifications: [], preferences: { dark: false, hideBalance: false, language: 'ar' }, ...s }
  } catch { return { accounts: [], currentId: null, transactions: clone(APP_CONFIG.demoTransactions), balance: APP_CONFIG.wallet.initialBalance, notifications: [], preferences: { dark: false, hideBalance: false, language: 'ar' } } }
}
export function saveState(state) { localStorage.setItem(KEY, JSON.stringify(state)) }
export function makeId(prefix='DEMO') { return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,6).toUpperCase()}` }
export function resetState() {
  const s = { accounts: [], currentId: null, transactions: clone(APP_CONFIG.demoTransactions), balance: APP_CONFIG.wallet.initialBalance, notifications: [], preferences: { dark: false, hideBalance: false, language: 'ar' } }
  saveState(s); return s
}
