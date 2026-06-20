'use client'

import { useState } from 'react'

export default function SpendLimitsPage() {
  const [dailyLimit, setDailyLimit] = useState('10.00')
  const [monthlyLimit, setMonthlyLimit] = useState('100.00')
  const [perRequestLimit, setPerRequestLimit] = useState('1.00')
  const [alertThreshold, setAlertThreshold] = useState('80')
  const [hardStop, setHardStop] = useState(true)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Spend Limits</h1>
        <p className="text-white/60 mt-1">Control your API spending with configurable limits.</p>
      </div>

      {/* Current Spend */}
      <div className="border border-white/10 rounded-xl p-6 bg-white/[0.02] mb-6">
        <h3 className="font-medium mb-4">Current Period</h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-white/50">Today&apos;s Spend</p>
            <p className="text-2xl font-semibold mt-1">$0.00</p>
            <p className="text-xs text-white/40 mt-1">of ${dailyLimit} daily limit</p>
            <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full" style={{ width: '0%' }} />
            </div>
          </div>
          <div>
            <p className="text-sm text-white/50">This Month</p>
            <p className="text-2xl font-semibold mt-1">$0.00</p>
            <p className="text-xs text-white/40 mt-1">of ${monthlyLimit} monthly limit</p>
            <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full" style={{ width: '0%' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Limit Settings */}
      <div className="border border-white/10 rounded-xl p-6 bg-white/[0.02] mb-6">
        <h3 className="font-medium mb-4">Limit Settings</h3>

        <div className="space-y-5">
          <div>
            <label className="text-sm text-white/50 block mb-2">Daily Limit (USDC)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50">$</span>
              <input
                type="text"
                value={dailyLimit}
                onChange={(e) => setDailyLimit(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-4 py-2.5 text-sm focus:outline-none focus:border-white/20"
              />
            </div>
            <p className="text-xs text-white/40 mt-1.5">Maximum spend per day. Resets at midnight UTC.</p>
          </div>

          <div>
            <label className="text-sm text-white/50 block mb-2">Monthly Limit (USDC)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50">$</span>
              <input
                type="text"
                value={monthlyLimit}
                onChange={(e) => setMonthlyLimit(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-4 py-2.5 text-sm focus:outline-none focus:border-white/20"
              />
            </div>
            <p className="text-xs text-white/40 mt-1.5">Maximum spend per calendar month.</p>
          </div>

          <div>
            <label className="text-sm text-white/50 block mb-2">Per-Request Limit (USDC)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50">$</span>
              <input
                type="text"
                value={perRequestLimit}
                onChange={(e) => setPerRequestLimit(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-4 py-2.5 text-sm focus:outline-none focus:border-white/20"
              />
            </div>
            <p className="text-xs text-white/40 mt-1.5">Maximum cost for a single API request. Prevents runaway queries.</p>
          </div>
        </div>
      </div>

      {/* Alert Settings */}
      <div className="border border-white/10 rounded-xl p-6 bg-white/[0.02] mb-6">
        <h3 className="font-medium mb-4">Alerts & Behavior</h3>

        <div className="space-y-5">
          <div>
            <label className="text-sm text-white/50 block mb-2">Alert Threshold</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="50"
                max="100"
                value={alertThreshold}
                onChange={(e) => setAlertThreshold(e.target.value)}
                className="flex-1 h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
              />
              <span className="text-sm w-12 text-right">{alertThreshold}%</span>
            </div>
            <p className="text-xs text-white/40 mt-1.5">Send alert when spend reaches this percentage of limit.</p>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="text-sm">Hard Stop</p>
              <p className="text-xs text-white/50 mt-0.5">Block requests when limit is reached</p>
            </div>
            <button
              onClick={() => setHardStop(!hardStop)}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                hardStop ? 'bg-white' : 'bg-white/20'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full transition-all ${
                  hardStop ? 'left-6 bg-black' : 'left-1 bg-white/50'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Per-Key Limits Info */}
      <div className="flex items-start gap-3 p-4 border border-white/10 rounded-xl bg-white/[0.02] mb-6">
        <InfoIcon className="w-5 h-5 text-white/50 mt-0.5" />
        <div>
          <p className="text-sm font-medium">Per-Key Limits</p>
          <p className="text-xs text-white/50 mt-1">
            You can also set individual limits for each API key on the API Keys page. Key-level limits take precedence over account limits.
          </p>
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

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
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
