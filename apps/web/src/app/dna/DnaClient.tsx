'use client'

import { Icon } from '@/components/ui/icons'
import { Ring } from '@/components/ui/Ring'

interface DnaClientProps {
  profile: Record<string, unknown> | null
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DnaClient({ profile }: DnaClientProps) {
  if (!profile) {
    return (
      <div style={{ background: 'var(--surface-1)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', padding: 24, textAlign: 'center', marginTop: 8 }}>
        <p style={{ color: 'var(--text)', marginBottom: 4 }}>Perfil genético não carregado</p>
        <p style={{ color: 'var(--text-dim)', fontSize: 13 }}>
          Adicione o arquivo Genera em <code style={{ color: 'var(--accent)', fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12 }}>data/genetics/genera.json</code> na API.
        </p>
      </div>
    )
  }

  const score = typeof profile.score === 'number' ? profile.score : null
  const summary = typeof profile.summary === 'string' ? profile.summary : null
  const traits = Array.isArray(profile.traits) ? profile.traits as Array<{key:string;label:string;value:string;level:number;gene:string;tag?:string;note:string;warn?:boolean}> : []
  const drivers = Array.isArray(profile.drivers) ? profile.drivers as Array<{icon:string;title:string;text:string}> : []

  return (
    <div className="space-y-4 mt-2">
      {/* Score hero */}
      {(score !== null || summary) && (
        <div style={{ background: 'linear-gradient(135deg, var(--surface-2) 0%, var(--surface-1) 100%)', border: '1px solid var(--hairline-2)', borderRadius: 'var(--r-card)', padding: '28px 20px 20px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 120, opacity: 0.07, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* helix watermark */}
            <svg width={120} height={120} viewBox="0 0 32 32" fill="none">
              <path d="M11 3 C 21 9, 21 23, 11 29" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round"/>
              <path d="M21 3 C 11 9, 11 23, 21 29" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round"/>
            </svg>
          </div>
          {score !== null && (
            <div className="flex justify-center mb-4">
              <Ring value={score} size={108} sw={9}>
                <div style={{ fontSize: 32, fontWeight: 700, fontFamily: 'var(--font-jetbrains-mono)', color: 'var(--accent)' }}>{score}</div>
                <div style={{ fontSize: 11, color: 'var(--text-faint)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>índice</div>
              </Ring>
            </div>
          )}
          {summary && <p style={{ fontSize: 14, color: 'var(--text-dim)', lineHeight: 1.6, maxWidth: 280, margin: '0 auto' }}>{summary}</p>}
        </div>
      )}

      {/* Genetic markers */}
      {traits.length > 0 && (
        <>
          <div className="flex items-center gap-2 pt-2">
            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', margin: 0 }}>Marcadores genéticos</h3>
          </div>
          <div className="space-y-2">
            {traits.map(t => (
              <div key={t.key} style={{ background: 'var(--surface-1)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', padding: '14px 16px' }}>
                <div className="flex items-center justify-between mb-2">
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{t.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: t.warn ? 'var(--warn)' : 'var(--accent)', fontFamily: 'var(--font-jetbrains-mono)' }}>{t.value}</span>
                </div>
                <div style={{ height: 4, background: 'var(--surface-3)', borderRadius: 2, marginBottom: 8, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.round(t.level * 100)}%`, background: t.warn ? 'var(--warn)' : 'var(--accent)', borderRadius: 2, transition: 'width 0.9s cubic-bezier(.2,.8,.2,1)' }} />
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: 12, color: 'var(--text-faint)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Icon name="dna" size={12} stroke="var(--text-faint)" /> {t.gene}
                  </span>
                  {t.tag && (
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 'var(--r-pill)', background: t.warn ? 'rgba(245,183,62,0.12)' : 'var(--accent-soft)', color: t.warn ? 'var(--warn)' : 'var(--accent)', border: `1px solid ${t.warn ? 'rgba(245,183,62,0.3)' : 'var(--accent-line)'}` }}>
                      {t.tag}
                    </span>
                  )}
                </div>
                {t.note && <p style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 8, lineHeight: 1.5 }}>{t.note}</p>}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Drivers */}
      {drivers.length > 0 && (
        <>
          <div className="flex items-center gap-2 pt-2">
            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', margin: 0 }}>Como molda seu treino</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {drivers.map((d, i) => (
              <div key={i} style={{ background: 'var(--surface-1)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', padding: '14px 14px' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                  <Icon name="dumbbell" size={16} stroke="var(--accent)" />
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{d.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.4 }}>{d.text}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Fallback for unstructured profile */}
      {traits.length === 0 && drivers.length === 0 && score === null && (
        <p style={{ color: 'var(--text-dim)', fontSize: 13, textAlign: 'center', padding: 16 }}>
          Formato do perfil genético não reconhecido.
        </p>
      )}
    </div>
  )
}
