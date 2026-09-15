'use client'

import { Shipment } from '@/lib/types'
import { CheckCircle2, Download, Printer, Shield, X, QrCode, Lock } from 'lucide-react'

interface CustodyCertificateModalProps {
  shipment: Shipment
  isOpen: boolean
  onClose: () => void
  isLocked?: boolean
}

export function CustodyCertificateModal({ shipment, isOpen, onClose, isLocked = false }: CustodyCertificateModalProps) {
  if (!isOpen) return null

  const handlePrint = () => {
    if (isLocked) return
    window.print()
  }

  const currentDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  // Administrative Certificate Lockdown View
  if (isLocked) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
        <div className="relative w-full max-w-lg rounded-3xl border border-red-500/40 bg-[#0e1117] p-8 shadow-2xl text-center text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 rounded-full p-2 text-gray-400 hover:bg-white/10 hover:text-white transition"
          >
            <X size={20} />
          </button>

          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400">
            <Lock size={30} />
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-red-400 mb-3">
            Administrative Restriction
          </span>

          <h2 className="font-serif text-2xl font-bold text-white">
            Certificate Access Locked
          </h2>
          <p className="text-xs text-gray-300 mt-2 leading-relaxed">
            Official chain-of-custody documentation, LBMA assay certificates, and export manifests for consignment <strong className="text-white font-mono">{shipment.trackingNumber}</strong> have been administratively locked by the Federal Operations Command.
          </p>

          <div className="mt-6 rounded-2xl border border-[#242833] bg-[#161a24] p-4 text-left text-xs font-mono space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Security Directive:</span>
              <span className="text-red-400 font-bold">DOCUMENT EXTRACTION REVOKED</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Enforcing Authority:</span>
              <span className="text-gray-200">Geneva HQ Operations Desk</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Protocol Reference:</span>
              <span className="text-[#dfba6c]">CH-SPECIE-LOCK-47</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="mt-6 w-full rounded-xl bg-[#242833] hover:bg-[#2d3342] text-white py-3 text-xs font-semibold transition"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/70 p-4 backdrop-blur-sm">
      <div className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        {/* Modal Toolbar */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/95 px-6 py-3.5 backdrop-blur">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Shield size={14} className="text-primary" />
            Official Chain of Custody Certificate
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition"
            >
              <Printer size={13} />
              Print
            </button>
            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Certificate Content - Print optimized */}
        <div className="p-6 sm:p-10 guilloche-pattern">
          <div className="certificate-border rounded-xl bg-card p-6 sm:p-8 relative overflow-hidden">
            {/* Watermark */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.03] select-none">
              <span className="font-serif text-8xl font-bold tracking-widest text-foreground uppercase rotate-[-25deg]">
                AURUMVAULT
              </span>
            </div>

            {/* Certificate Header */}
            <div className="border-b-2 border-primary/40 pb-6 text-center">
              <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Shield size={24} />
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-primary">
                Confédération Suisse • Bonded Specie Transport Register
              </p>
              <h1 className="mt-1 font-serif text-2xl sm:text-3xl text-foreground font-semibold">
                Certificate of Chain of Custody
              </h1>
              <p className="mt-1 text-xs text-muted-foreground">
                Document Ref: <span className="font-mono font-medium text-foreground">{shipment.trackingNumber}</span> • Issued under Geneva Freeport Protocol
              </p>
            </div>

            {/* Consignment Overview */}
            <div className="mt-6 grid gap-4 rounded-lg bg-muted/40 p-4 text-xs sm:grid-cols-2">
              <div>
                <span className="text-muted-foreground uppercase tracking-wider text-[10px]">Shipment Reference</span>
                <p className="font-mono text-sm font-bold text-foreground mt-0.5">{shipment.id}</p>
                <p className="text-muted-foreground mt-1 text-[11px]">{shipment.category}</p>
              </div>
              <div>
                <span className="text-muted-foreground uppercase tracking-wider text-[10px]">Security Escort Tier</span>
                <p className="font-medium text-foreground mt-0.5">{shipment.manifest.securityTier}</p>
                <div className="mt-1 inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                  <CheckCircle2 size={12} />
                  Active Seal Intact ({shipment.telemetry.electronicSeal.id})
                </div>
              </div>
            </div>

            {/* Route & Custody Transfer Grid */}
            <div className="mt-6 grid gap-4 sm:grid-cols-2 text-xs border border-border rounded-lg p-4">
              <div>
                <span className="text-muted-foreground uppercase tracking-wider text-[10px]">Origin Point of Vaulting</span>
                <p className="font-semibold text-foreground mt-0.5">{shipment.origin.facility}</p>
                <p className="text-muted-foreground text-[11px] mt-0.5">{shipment.origin.city}, {shipment.origin.country} ({shipment.origin.code})</p>
                <p className="text-[11px] text-muted-foreground mt-1">Dispatched: <span className="font-mono">{shipment.dispatchedAt}</span></p>
              </div>

              <div>
                <span className="text-muted-foreground uppercase tracking-wider text-[10px]">Destination High-Security Vault</span>
                <p className="font-semibold text-foreground mt-0.5">{shipment.destination.facility}</p>
                <p className="text-muted-foreground text-[11px] mt-0.5">{shipment.destination.city}, {shipment.destination.country} ({shipment.destination.code})</p>
                <p className="text-[11px] text-muted-foreground mt-1">Target Handover: <span className="font-mono">{shipment.eta}</span></p>
              </div>
            </div>

            {/* Manifest Specifications Table */}
            <div className="mt-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Declared Cargo Specification & Assay Verification
              </h3>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-left text-xs">
                  <tbody className="divide-y divide-border">
                    <tr className="bg-muted/30">
                      <td className="p-2.5 font-medium text-muted-foreground w-1/3">Item Description</td>
                      <td className="p-2.5 font-medium text-foreground">{shipment.manifest.itemType}</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-medium text-muted-foreground">Detailed Declaration</td>
                      <td className="p-2.5 text-foreground">{shipment.manifest.description}</td>
                    </tr>
                    <tr className="bg-muted/30">
                      <td className="p-2.5 font-medium text-muted-foreground">Certified Gross Weight</td>
                      <td className="p-2.5 font-mono text-foreground font-semibold">{shipment.manifest.grossWeight}</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-medium text-muted-foreground">Certified Fineness / Grade</td>
                      <td className="p-2.5 font-mono text-foreground font-semibold">{shipment.manifest.fineness}</td>
                    </tr>
                    <tr className="bg-muted/30">
                      <td className="p-2.5 font-medium text-muted-foreground">Assay Certificate & Refiner</td>
                      <td className="p-2.5 font-mono text-foreground">{shipment.manifest.assayCertNumber} ({shipment.manifest.assayLab})</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-medium text-muted-foreground">Declared Insured Value</td>
                      <td className="p-2.5 font-semibold text-primary">{shipment.manifest.declaredValue}</td>
                    </tr>
                    <tr className="bg-muted/30">
                      <td className="p-2.5 font-medium text-muted-foreground">Underwriter & Policy</td>
                      <td className="p-2.5 text-foreground">{shipment.manifest.underwriter} • Policy #{shipment.manifest.policyNumber}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cryptographic Proof & Signatures */}
            <div className="mt-6 border-t border-border pt-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Lock size={12} className="text-primary" />
                    <span>Cryptographic Audit Proof (SHA-256):</span>
                  </div>
                  <p className="font-mono text-[10px] break-all bg-muted p-1.5 rounded border border-border/60 text-muted-foreground max-w-md">
                    {shipment.checkpoints[0]?.hash || 'SHA256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069'}
                  </p>
                </div>

                {/* Simulated Stamp */}
                <div className="size-24 shrink-0 rounded-full border-2 border-dashed border-primary/80 p-1 text-center flex flex-col items-center justify-center rotate-[-8deg] bg-primary/5">
                  <span className="text-[8px] font-bold tracking-widest text-primary uppercase">AURUMVAULT</span>
                  <span className="text-[7px] text-foreground font-semibold uppercase">SWITZERLAND</span>
                  <span className="my-0.5 text-[9px] font-bold text-primary font-mono">VERIFIED</span>
                  <span className="text-[7px] text-muted-foreground">{currentDate}</span>
                </div>
              </div>

              {/* Signatures */}
              <div className="mt-8 grid grid-cols-2 gap-8 text-xs">
                <div className="border-t border-border pt-2 text-center">
                  <p className="font-serif italic text-foreground text-sm">M. Al-Mansoor</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">Authorised Dispatch Custodian</p>
                  <p className="text-[9px] font-mono text-muted-foreground">ID: #DXB-9021 • DMCC Vault</p>
                </div>
                <div className="border-t border-border pt-2 text-center">
                  <p className="font-serif italic text-foreground text-sm">Laurent Favrod</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">Head Vault Custodian</p>
                  <p className="text-[9px] font-mono text-muted-foreground">ID: #GVA-FP-01 • Geneva Freeport</p>
                </div>
              </div>
            </div>

            {/* Bottom Barcode */}
            <div className="mt-8 pt-4 border-t border-dashed border-border/80 flex items-center justify-between text-[10px] text-muted-foreground">
              <span className="font-mono">VERIFICATION-PORTAL: https://aurumvault.com/verify/{shipment.id}</span>
              <div className="flex gap-1 items-end h-6">
                {[4, 12, 6, 16, 2, 8, 14, 4, 10, 18, 6, 12, 16, 4, 8, 14, 10, 4, 12].map((h, i) => (
                  <span key={i} className="w-[1.5px] bg-foreground/60 rounded-full" style={{ height: `${h}px` }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
