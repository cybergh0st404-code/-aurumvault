'use client'

import React from 'react'
import {
  AlertTriangle,
  X,
  FileText,
  ShieldAlert,
  Coins,
  CheckCircle2,
} from 'lucide-react'

interface ClientNoticeModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string | null
  message?: string | null
  clientName?: string
  clientCode?: string
}

export function ClientNoticeModal({
  isOpen,
  onClose,
  title,
  message,
  clientName,
  clientCode,
}: ClientNoticeModalProps) {
  if (!isOpen) return null

  const displayTitle = title || 'SHIPMENT PROCESSING NOTICE'
  const displayMessage =
    message ||
    'A total fee of US$3,400 is stated for final inspection, processing, and completion of doorstep delivery of the gold consignment. Payment instructions are to be issued separately.'

  return (
    <div
      data-notice-modal="true"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      {/* Outer Card with Red/Gold Pulsing Border */}
      <div
        className="relative w-full max-w-xl rounded-3xl border-2 border-amber-500/40 bg-[#0d0f15] shadow-2xl shadow-amber-500/10 overflow-hidden text-white font-sans ring-1 ring-amber-500/20"
      >
        {/* Top High-Security Accent Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-600 via-[#dfba6c] to-amber-500 animate-pulse" />

        {/* Header */}
        <div className="border-b border-[#242833] p-5 sm:p-6 bg-[#12151e]/80 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="size-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
              <AlertTriangle size={22} className="animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-300 uppercase tracking-widest">
                  URGENT OPERATIONAL NOTICE
                </span>
                <span className="text-[10px] font-mono text-gray-400">
                  REF: AV-NOTIF-{clientCode || 'GENEVA'}
                </span>
              </div>
              <h2 className="font-serif text-lg sm:text-xl font-bold text-white tracking-tight mt-1">
                {displayTitle}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl border border-[#242833] bg-[#161a24] p-2 text-gray-400 hover:text-white hover:bg-[#1e2330] transition shrink-0"
            title="Acknowledge and dismiss"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-7 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {/* Client Reference Card */}
          <div className="flex items-center justify-between rounded-xl border border-[#202533] bg-[#141824] px-4 py-3 text-xs font-mono">
            <div>
              <span className="text-gray-400">Recipient Account:</span>{' '}
              <strong className="text-white">{clientName || 'Valued Private Client'}</strong>
            </div>
            {clientCode && (
              <span className="text-[#dfba6c] font-bold bg-[#dfba6c]/10 px-2 py-0.5 rounded border border-[#dfba6c]/30">
                {clientCode}
              </span>
            )}
          </div>

          {/* Official Directive Text Box */}
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 sm:p-6 relative overflow-hidden shadow-inner">
            <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none text-amber-400">
              <Coins size={96} />
            </div>
            <div className="relative z-10 space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                <FileText size={15} />
                <span>Directive Text</span>
              </div>
              <p className="text-sm sm:text-base text-gray-100 font-medium leading-relaxed whitespace-pre-line">
                {displayMessage}
              </p>
            </div>
          </div>

          {/* Air-Corridor / Radar Hold Alert */}
          <div className="rounded-2xl border border-red-500/30 bg-red-950/20 p-4 text-xs space-y-2">
            <div className="flex items-center gap-2 text-red-300 font-bold font-mono">
              <ShieldAlert size={16} className="text-red-400 shrink-0" />
              <span>LIVE TRACKER & DOORSTEP DELIVERY ADVISORY</span>
            </div>
            <p className="text-gray-300 leading-relaxed text-[11px] pl-6 font-mono">
              Live radar avionics and doorstep handover dispatches require settlement acknowledgment of this notice. Telemetry downlinks remain restricted until administrative clearance.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#242833] p-5 sm:p-6 bg-[#0f121a] flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-[11px] font-mono text-gray-400 text-center sm:text-left">
            AurumVault Federal Air Operations Command (Geneva HQ)
          </span>

          <button
            onClick={onClose}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#dfba6c] to-[#c29b43] px-6 py-2.5 text-xs font-bold text-black hover:opacity-95 transition shadow-lg shadow-[#c29b43]/20"
          >
            <CheckCircle2 size={15} />
            <span>Acknowledge Notice</span>
          </button>
        </div>
      </div>
    </div>
  )
}
