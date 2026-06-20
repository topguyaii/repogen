'use client'

import { useState } from 'react'

export default function DashboardPage() {
  const [showKey, setShowKey] = useState(false)
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<'mcp' | 'sdk'>('mcp')

  const apiKey = 'rg_live_51e8b8c7a3f7d2e4b9a1c7e9d2f8b3c6'

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const mcpConfig = `{
  "mcpServers": {
    "repogen": {
      "command": "npx",
      "args": ["-y", "@repogen/mcp"],
      "env": {
        "REPOGEN_API_KEY": "${apiKey}"
      }
    }
  }
}`

  const sdkExample = `from openai import OpenAI

client = OpenAI(
    base_url="https://api.repogen.xyz/v1",
    api_key="${apiKey}",
)

response = client.chat.completions.create(
    model="llama-3.3-70b",
    messages=[{"role": "user", "content": "Hello"}],
)
print(response.choices[0].message.content)`

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Getting Started</h1>
        <p className="text-white/60 mt-1">Connect your agent or application to repogen.</p>
      </div>

      {/* API Key */}
      <div className="border border-white/10 rounded-xl p-6 bg-white/[0.02] mb-6">
        <label className="text-sm text-white/50 block mb-2">Your API Key</label>
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center bg-white/5 border border-white/10 rounded-lg px-4 py-2.5">
            <code className="text-sm font-mono flex-1 text-white/80">
              {showKey ? apiKey : '••••••••••••••••••••••••••••••••'}
            </code>
            <button
              onClick={() => setShowKey(!showKey)}
              className="p-1 hover:bg-white/10 rounded transition-colors"
            >
              {showKey ? <EyeOffIcon className="w-4 h-4 text-white/50" /> : <EyeIcon className="w-4 h-4 text-white/50" />}
            </button>
          </div>
          <button
            onClick={() => copyToClipboard(apiKey)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-black rounded-lg font-medium hover:bg-white/90 transition-colors text-sm"
          >
            <CopyIcon className="w-4 h-4" />
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* MCP / SDK Tabs */}
      <div className="border border-white/10 rounded-xl bg-white/[0.02]">
        <div className="flex border-b border-white/10">
          <button
            onClick={() => setActiveTab('mcp')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'mcp' ? 'text-white border-b-2 border-white' : 'text-white/50'
            }`}
          >
            MCP (Agents)
          </button>
          <button
            onClick={() => setActiveTab('sdk')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'sdk' ? 'text-white border-b-2 border-white' : 'text-white/50'
            }`}
          >
            SDK
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'mcp' ? (
            <>
              <p className="text-sm text-white/60 mb-4">
                Add repogen to your Claude Code or MCP-compatible agent.
              </p>
              <p className="text-xs text-white/40 mb-2">Add to your MCP settings:</p>
              <div className="relative bg-black border border-white/10 rounded-lg">
                <div className="absolute top-3 right-3">
                  <button
                    onClick={() => copyToClipboard(mcpConfig)}
                    className="p-2 hover:bg-white/10 rounded transition-colors"
                  >
                    <CopyIcon className="w-4 h-4 text-white/50" />
                  </button>
                </div>
                <pre className="p-4 text-sm font-mono overflow-x-auto">
                  <code className="text-white/80">{mcpConfig}</code>
                </pre>
              </div>
              <p className="text-xs text-white/40 mt-4">
                Once configured, your agent can use the <code className="text-white/60">chat</code>, <code className="text-white/60">list_models</code>, and <code className="text-white/60">get_balance</code> tools.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm text-white/60 mb-4">
                Use any OpenAI-compatible SDK. Just change the base URL.
              </p>
              <div className="relative bg-black border border-white/10 rounded-lg">
                <div className="absolute top-3 right-3">
                  <button
                    onClick={() => copyToClipboard(sdkExample)}
                    className="p-2 hover:bg-white/10 rounded transition-colors"
                  >
                    <CopyIcon className="w-4 h-4 text-white/50" />
                  </button>
                </div>
                <pre className="p-4 text-sm font-mono overflow-x-auto">
                  <code className="text-white/80">{sdkExample}</code>
                </pre>
              </div>
              <p className="text-xs text-white/40 mt-4">
                Works with Python, Node.js, or any OpenAI SDK.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
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
