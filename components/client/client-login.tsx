'use client'

import React, { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Shield, Lock, Key, CheckCircle2, ArrowRight, Building2, User, AlertCircle, Fingerprint, ShieldCheck, Sparkles } from 'lucide-react'
import Link from 'next/link'

interface ClientLoginProps {
  onSuccess?: () => void
}

export function ClientLogin({ onSuccess }: ClientLoginProps) {
  const { login, user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      const res = await login(email, password)
      if (res.success) {
        if (onSuccess) onSuccess()
      } else {
        setError(res.error || 'Authentication failed. Please verify your credentials.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0c10] text-[#f4f4f6] px-4 py-12 flex flex-col justify-center relative overflow-hidden font-sans">
      {/* Subtle Ambient Gold Aura */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#dfba6c]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-5xl w-full relative z-10">
        {/* Top Banner / Breadcrumb */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-gray-400 hover:text-white transition"
          >
            ← Return to Public Radar
          </Link>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#dfba6c]/30 bg-[#dfba6c]/10 px-3.5 py-1.5 text-xs font-mono font-bold text-[#dfba6c] self-start sm:self-auto">
            <ShieldCheck size={14} />
            <span>FIPS 140-3 Hardware Enclave Active</span>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-12 items-start">
          {/* Main Login Form */}
          <div className="lg:col-span-7 rounded-3xl border border-[#242833] bg-[#0e1117] p-6 sm:p-10 shadow-2xl">
            <div className="mb-8">
              <div className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-[#dfba6c] via-[#c29b43] to-[#916e25] p-3.5 text-black shadow-lg shadow-[#c29b43]/20 mb-4">
                <Fingerprint size={28} />
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl text-white font-bold tracking-tight">
                Private Client Depository
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-gray-400 leading-relaxed font-mono">
                Cryptographic dual-handshake authentication for allocated Swiss vault depositors, family offices, and sovereign trustees.
              </p>
            </div>

            {error && (
              <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-xs text-red-300">
                <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-400" />
                <div>
                  <p className="font-bold">Access Denied</p>
                  <p className="mt-0.5 opacity-90">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-gray-300 mb-2">
                  Client Depository Identifier / Email
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="e.g. client@private-trust.ch"
                    required
                    className="w-full rounded-xl border border-[#242833] bg-[#161a24] py-3 pl-11 pr-4 text-sm text-white placeholder:text-gray-500 focus:border-[#dfba6c] focus:outline-none transition font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-gray-300 mb-2">
                  Cryptographic Specie Passkey / HSM Token
                </label>
                <div className="relative">
                  <Key size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your confidential passkey"
                    required
                    className="w-full rounded-xl border border-[#242833] bg-[#161a24] py-3 pl-11 pr-4 text-sm text-white placeholder:text-gray-500 focus:border-[#dfba6c] focus:outline-none transition font-mono"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#dfba6c] to-[#c29b43] py-3.5 text-xs sm:text-sm font-bold text-black transition hover:opacity-95 disabled:opacity-50 shadow-xl shadow-[#c29b43]/20"
                >
                  {isSubmitting ? (
                    <span className="font-mono">Authenticating Hardware Key...</span>
                  ) : (
                    <>
                      <Lock size={15} />
                      <span>Authorize Vault Access</span>
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-8 border-t border-[#242833] pt-5 text-center">
              <p className="text-[11px] text-gray-400 font-mono">
                Institutional bullion accounts are protected by Lloyd’s of London Specie Policy #LL-9924-SPEC with zero deductible.
              </p>
            </div>
          </div>

          {/* Institutional Custody & Security Verification Standards */}
          <div className="lg:col-span-5 space-y-5">
            <div className="rounded-3xl border border-[#242833] bg-[#0e1117] p-6 sm:p-7 shadow-2xl space-y-5">
              <div className="flex items-center gap-2.5 border-b border-[#242833] pb-4">
                <Shield size={18} className="text-[#dfba6c]" />
                <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                  Sovereign Security Protocols
                </h2>
              </div>

              <div className="space-y-4 text-xs font-mono">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-[#dfba6c]/10 border border-[#dfba6c]/20 p-2 text-[#dfba6c] shrink-0 mt-0.5">
                    <Lock size={14} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xs">FIPS 140-3 Hardware Security Enclave</h4>
                    <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">
                      Zero-knowledge dual cryptographic handshakes. Key pairs never leave cold HSM enclosures.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2 text-emerald-400 shrink-0 mt-0.5">
                    <CheckCircle2 size={14} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xs">Allocated & Numbered Bar Storage</h4>
                    <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">
                      Physical gold bullion bars are segregated by hallmark and serial number under Swiss Property Law.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-[#dfba6c]/10 border border-[#dfba6c]/20 p-2 text-[#dfba6c] shrink-0 mt-0.5">
                    <Building2 size={14} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xs">Freeport Diplomatic Transit Status</h4>
                    <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">
                      Cross-border air corridors maintained under sovereign diplomatic carnet and armed airborne escort details.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-[#242833] bg-[#0e1117] p-5 text-xs text-gray-400 space-y-2.5 shadow-2xl">
              <div className="flex items-center gap-2 font-mono font-bold text-white">
                <Building2 size={15} className="text-[#dfba6c]" />
                <span>Custodial Jurisdiction</span>
              </div>
              <p className="text-[11px] leading-relaxed font-mono">
                Assets vaulted at AurumVault Geneva Freeport, Zurich Kloten Depository, and Singapore Changi are segregated on a numbered allocated basis under Swiss property law.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
