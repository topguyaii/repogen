'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { useSiwe } from '@/providers'

export default function SettingsPage() {
  const [defaultPrivacy, setDefaultPrivacy] = useState('no-log')
  const [saved, setSaved] = useState(false)
  const { address } = useAccount()
  const { apiKey } = useSiwe()

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address)
    }
  }

  const copyApiKey = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-white/60 mt-1">Manage your account preferences.</p>
      </div>

      {/* Account */}
      <div className="border border-white/10 rounded-xl p-6 bg-white/[0.02] mb-6">
        <h3 className="font-medium mb-4">Account</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-white/50 block mb-2">Wallet Address</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={address || 'Loading...'}
                disabled
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white/70 cursor-not-allowed font-mono"
              />
              <button
                onClick={copyAddress}
                disabled={!address}
                className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                <CopyIcon className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-white/40 mt-1.5">
              Your connected wallet on Base. Used for USDC payments.
            </p>
          </div>
        </div>
      </div>

      {/* API Key */}
      <div className="border border-white/10 rounded-xl p-6 bg-white/[0.02] mb-6">
        <h3 className="font-medium mb-4">API Key</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-white/50 block mb-2">Your API Key</label>
            <div className="flex items-center gap-2">
              <input
                type="password"
                value={apiKey || 'Not authenticated'}
                disabled
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white/70 cursor-not-allowed font-mono"
              />
              <button
                onClick={copyApiKey}
                disabled={!apiKey}
                className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                <CopyIcon className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-white/40 mt-1.5">
              Use this key to authenticate API requests. Keep it secret.
            </p>
          </div>

          <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
            <p className="text-sm text-white/80 mb-2">Usage Example:</p>
            <code className="text-xs font-mono text-white/60 block overflow-x-auto">
              curl https://api.repogen.ai/v1/chat/completions \<br />
              &nbsp;&nbsp;-H &quot;Authorization: Bearer {apiKey ? apiKey.slice(0, 12) + '...' : 'YOUR_API_KEY'}&quot; \<br />
              &nbsp;&nbsp;-H &quot;Content-Type: application/json&quot; \<br />
              &nbsp;&nbsp;-d &apos;{`{"model":"llama-3.1-70b","messages":[...]}`}&apos;
            </code>
          </div>
        </div>
      </div>

      {/* Defaults */}
      <div className="border border-white/10 rounded-xl p-6 bg-white/[0.02] mb-6">
        <h3 className="font-medium mb-4">Defaults</h3>
        <div>
          <label className="text-sm text-white/50 block mb-2">Default Privacy Tier</label>
          <select
            value={defaultPrivacy}
            onChange={(e) => setDefaultPrivacy(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-white/20 appearance-none cursor-pointer"
          >
            <option value="standard">Standard</option>
            <option value="no-log">No-log (Recommended)</option>
            <option value="tee">TEE</option>
          </select>
          <p className="text-xs text-white/40 mt-1.5">Applied to all requests unless overridden.</p>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        className="w-full py-3 bg-white text-black rounded-lg font-medium hover:bg-white/90 transition-colors flex items-center justify-center gap-2"
      >
        {saved ? (
          <>
            <CheckIcon className="w-4 h-4" />
            Saved
          </>
        ) : (
          'Save Changes'
        )}
      </button>
    </div>
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
