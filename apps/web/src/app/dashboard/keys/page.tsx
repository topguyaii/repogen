'use client'

import { useState } from 'react'

interface ApiKey {
  id: string
  name: string
  key: string
  created: string
  lastUsed: string | null
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([
    {
      id: '1',
      name: 'Default',
      key: 'rg_live_51e8b8c7a3f7d2e4b9a1c7e9d2f8b3c6',
      created: '2025-01-15',
      lastUsed: null,
    },
  ])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set())
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const toggleReveal = (id: string) => {
    const newRevealed = new Set(revealedKeys)
    if (newRevealed.has(id)) {
      newRevealed.delete(id)
    } else {
      newRevealed.add(id)
    }
    setRevealedKeys(newRevealed)
  }

  const copyKey = (key: string, id: string) => {
    navigator.clipboard.writeText(key)
    setCopiedKey(id)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const createKey = () => {
    if (!newKeyName.trim()) return
    const newKey: ApiKey = {
      id: Date.now().toString(),
      name: newKeyName,
      key: `rg_live_${Math.random().toString(36).substring(2, 34)}`,
      created: new Date().toISOString().split('T')[0],
      lastUsed: null,
    }
    setKeys([...keys, newKey])
    setNewKeyName('')
    setShowCreateModal(false)
  }

  const deleteKey = (id: string) => {
    if (keys.length === 1) return
    setKeys(keys.filter((k) => k.id !== id))
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">API Keys</h1>
          <p className="text-white/60 mt-1">Manage your API keys for authentication.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-white text-black rounded-lg font-medium hover:bg-white/90 transition-colors text-sm"
        >
          <PlusIcon className="w-4 h-4" />
          Create Key
        </button>
      </div>

      {/* Security Notice */}
      <div className="flex items-start gap-3 p-4 border border-white/10 rounded-xl bg-white/[0.02] mb-6">
        <ShieldIcon className="w-5 h-5 text-white/50 mt-0.5" />
        <div>
          <p className="text-sm font-medium">Keep your API keys secure</p>
          <p className="text-xs text-white/50 mt-1">
            Never share your API keys or commit them to version control. Use environment variables in production.
          </p>
        </div>
      </div>

      {/* Keys List */}
      <div className="border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-white/50 bg-white/[0.02]">
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Key</th>
              <th className="px-5 py-3 font-medium">Created</th>
              <th className="px-5 py-3 font-medium">Last Used</th>
              <th className="px-5 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {keys.map((apiKey) => (
              <tr key={apiKey.id} className="border-t border-white/10">
                <td className="px-5 py-4">
                  <span className="text-sm font-medium">{apiKey.name}</span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono text-white/70">
                      {revealedKeys.has(apiKey.id)
                        ? apiKey.key
                        : `${apiKey.key.substring(0, 12)}${'•'.repeat(20)}`}
                    </code>
                    <button
                      onClick={() => toggleReveal(apiKey.id)}
                      className="p-1 hover:bg-white/10 rounded transition-colors"
                    >
                      {revealedKeys.has(apiKey.id) ? (
                        <EyeOffIcon className="w-4 h-4 text-white/50" />
                      ) : (
                        <EyeIcon className="w-4 h-4 text-white/50" />
                      )}
                    </button>
                    <button
                      onClick={() => copyKey(apiKey.key, apiKey.id)}
                      className="p-1 hover:bg-white/10 rounded transition-colors"
                    >
                      {copiedKey === apiKey.id ? (
                        <CheckIcon className="w-4 h-4 text-green-400" />
                      ) : (
                        <CopyIcon className="w-4 h-4 text-white/50" />
                      )}
                    </button>
                  </div>
                </td>
                <td className="px-5 py-4 text-sm text-white/50">{apiKey.created}</td>
                <td className="px-5 py-4 text-sm text-white/50">{apiKey.lastUsed || 'Never'}</td>
                <td className="px-5 py-4">
                  <button
                    onClick={() => deleteKey(apiKey.id)}
                    disabled={keys.length === 1}
                    className="p-1.5 hover:bg-white/10 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title={keys.length === 1 ? 'Cannot delete the only key' : 'Delete key'}
                  >
                    <TrashIcon className="w-4 h-4 text-white/50" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-black border border-white/10 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Create API Key</h2>
            <div className="mb-4">
              <label className="text-sm text-white/50 block mb-2">Key Name</label>
              <input
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="e.g., Production, Development"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-white/20 placeholder:text-white/30"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createKey}
                disabled={!newKeyName.trim()}
                className="flex-1 py-2.5 bg-white text-black rounded-lg text-sm font-medium hover:bg-white/90 transition-colors disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Icons
function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  )
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  )
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  )
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  )
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  )
}
