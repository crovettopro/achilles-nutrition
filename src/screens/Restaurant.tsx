import { useState } from 'react'
import { ai } from '../services/ai'
import CameraStage from '../components/CameraStage'
import Spinner from '../components/ui/Spinner'
import Button from '../components/ui/Button'
import BackLink from '../components/ui/BackLink'
import type { MenuAnalysis } from '../types'
import styles from './Restaurant.module.css'

type State = 'camera' | 'analyzing' | 'result'

export default function Restaurant() {
  const [state, setState] = useState<State>('camera')
  const [result, setResult] = useState<MenuAnalysis | null>(null)
  const [error, setError] = useState('')

  const analyze = async (image: string) => {
    setError('')
    setState('analyzing')
    try {
      const r = await ai.analyzeMenu({ image })
      setResult(r)
      setState('result')
    } catch (err) {
      console.error(err)
      setError('No se pudo analizar la carta. Inténtalo de nuevo.')
      setState('camera')
    }
  }

  return (
    <div className={`${styles.screen} ach-fade`}>
      <BackLink />
      <h2 className={styles.title}>Modo Restaurante</h2>
      <p className={styles.subtitle}>Fotografía la carta y elige bien.</p>

      {state === 'analyzing' && (
        <Spinner title="Analizando…" subtitle="Mejor opción para tu objetivo" />
      )}

      {state === 'camera' && (
        <>
          {error && <p className={styles.errorBanner}>{error}</p>}
          <CameraStage
            caption="FOTOGRAFÍA LA CARTA"
            ctaLabel="Analizar carta"
            onCapture={analyze}
          />
        </>
      )}

      {state === 'result' && result && (
        <div className="ach-fade">
          <div className={styles.best}>
            <div className={styles.bestEyebrow}>Mejor opción para ti</div>
            <div className={styles.bestText}>{result.bestOption}</div>
          </div>

          <div className={styles.avoid}>
            <div className={styles.avoidEyebrow}>Evita</div>
            <div className={styles.avoidList}>
              {result.avoid.map((item, i) => (
                <div key={`${item}-${i}`} className={styles.avoidItem}>
                  <span className={styles.cross}>✕</span> {item}
                </div>
              ))}
            </div>
          </div>

          <Button variant="ghost" onClick={() => setState('camera')} style={{ marginTop: 22 }}>
            Analizar otra
          </Button>
        </div>
      )}
    </div>
  )
}
