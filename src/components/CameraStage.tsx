import { useEffect, useRef, useState } from 'react'
import { useCamera } from '../lib/useCamera'
import { captureVideoFrame, fileToDataUrl } from '../lib/image'
import Button from './ui/Button'
import styles from './CameraStage.module.css'

interface CameraStageProps {
  /** Caption shown over the placeholder (e.g. "APUNTA A TU COMIDA"). */
  caption: string
  /** Primary capture button label (e.g. "Capturar", "Analizar carta"). */
  ctaLabel: string
  /** Called with a downscaled JPEG data URL once a photo is captured/uploaded. */
  onCapture: (dataUrl: string) => void
}

/**
 * Camera capture surface: live rear-camera preview with frame capture, plus a
 * file-upload fallback for desktops or when permission is denied. Produces a
 * compact JPEG data URL ready for the AI.
 */
export default function CameraStage({ caption, ctaLabel, onCapture }: CameraStageProps) {
  const { videoRef, status, start } = useCamera()
  const fileRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')

  // Try to start the camera when the stage mounts.
  useEffect(() => {
    void start()
  }, [start])

  const capture = () => {
    if (!videoRef.current) return
    try {
      onCapture(captureVideoFrame(videoRef.current))
    } catch {
      setError('No se pudo capturar la foto.')
    }
  }

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting the same file
    if (!file) return
    try {
      onCapture(await fileToDataUrl(file))
    } catch {
      setError('No se pudo procesar la imagen.')
    }
  }

  const live = status === 'live'

  return (
    <div>
      <div className={styles.viewer}>
        <video
          ref={videoRef}
          className={styles.video}
          data-active={live}
          playsInline
          muted
        />
        <div className={styles.frame} />
        {!live && <span className={styles.caption}>{caption}</span>}
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {live ? (
        <Button onClick={capture} style={{ marginTop: 28 }}>
          {ctaLabel}
        </Button>
      ) : (
        <Button onClick={() => fileRef.current?.click()} style={{ marginTop: 28 }}>
          Subir foto
        </Button>
      )}

      <div className={styles.alt}>
        {live ? (
          <button className={styles.altLink} onClick={() => fileRef.current?.click()}>
            o sube una foto
          </button>
        ) : status === 'denied' ? (
          <button className={styles.altLink} onClick={() => void start()}>
            Permitir cámara
          </button>
        ) : status === 'starting' ? (
          <span className={styles.altMuted}>Activando cámara…</span>
        ) : null}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onFile}
        hidden
      />
    </div>
  )
}
