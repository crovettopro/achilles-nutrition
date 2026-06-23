import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { ai } from '../services/ai'
import { mealScoreFromMacros, todayISO } from '../lib/metrics'
import Button from './ui/Button'
import type { Macros, Meal } from '../types'
import styles from './MealEditSheet.module.css'

/**
 * Bottom-sheet to create, edit, duplicate or delete a meal. Used by the Day
 * view (and reusable from Home). In "create" mode it back-fills a meal to the
 * given `date`; in "edit" mode it patches/removes an existing meal.
 */
export default function MealEditSheet({
  meal,
  date,
  onClose,
  onDeleted,
}: {
  /** Existing meal to edit; omit for create mode. */
  meal?: Meal
  /** Target date for create mode (YYYY-MM-DD). Defaults to today. */
  date?: string
  onClose: () => void
  /** Called with the removed meal so the parent can offer Undo. */
  onDeleted?: (meal: Meal) => void
}) {
  const { addMeal, updateMeal, removeMeal, duplicateMeal } = useApp()
  const editing = !!meal
  const targetDate = meal?.date ?? date ?? todayISO()

  const [name, setName] = useState(meal?.name ?? '')
  const [kcal, setKcal] = useState(meal ? String(meal.macros.kcal) : '')
  const [protein, setProtein] = useState(meal ? String(meal.macros.protein) : '')
  const [carbs, setCarbs] = useState(meal ? String(meal.macros.carbs) : '')
  const [fat, setFat] = useState(meal ? String(meal.macros.fat) : '')
  const [time, setTime] = useState(/^\d{2}:\d{2}$/.test(meal?.time ?? '') ? (meal!.time as string) : '')
  const [confirmDel, setConfirmDel] = useState(false)
  const [estimating, setEstimating] = useState(false)
  const [estError, setEstError] = useState<string | null>(null)

  const n = (s: string) => Math.max(0, parseFloat(s.replace(',', '.')) || 0)

  // Ask the AI to estimate macros from the dish name, so the user doesn't need
  // to know or remember them. Fills the four fields (and the name if empty).
  const estimate = async () => {
    if (!name.trim() || estimating) return
    setEstimating(true)
    setEstError(null)
    try {
      const r = await ai.analyzeFood({ text: name.trim() })
      setKcal(String(r.macros.kcal))
      setProtein(String(r.macros.protein))
      setCarbs(String(r.macros.carbs))
      setFat(String(r.macros.fat))
      if (!name.trim() && r.name) setName(r.name)
    } catch {
      setEstError('No se pudo estimar. Inténtalo de nuevo o escribe los macros.')
    } finally {
      setEstimating(false)
    }
  }

  const macros = (): Macros => {
    const p = n(protein)
    const c = n(carbs)
    const f = n(fat)
    const k = n(kcal) || Math.round(p * 4 + c * 4 + f * 9)
    return { protein: p, carbs: c, fat: f, kcal: k }
  }

  const valid = name.trim().length > 0 && (n(kcal) > 0 || n(protein) > 0 || n(carbs) > 0 || n(fat) > 0)

  const save = () => {
    if (!valid) return
    const m = macros()
    if (editing && meal) {
      updateMeal(meal.id, { name: name.trim(), macros: m, time: time || meal.time || '—' })
    } else {
      addMeal({ name: name.trim(), score: mealScoreFromMacros(m), macros: m }, { date: targetDate, time: time || undefined })
    }
    onClose()
  }

  const del = () => {
    if (!meal) return
    if (!confirmDel) {
      setConfirmDel(true)
      return
    }
    removeMeal(meal.id)
    onDeleted?.(meal)
    onClose()
  }

  const repeat = () => {
    if (!meal) return
    duplicateMeal(meal.id, todayISO())
    onClose()
  }

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <div className={styles.handle} />
        <h3 className={styles.title}>{editing ? 'Editar comida' : 'Añadir comida'}</h3>

        <input
          className={styles.name}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre de la comida"
          aria-label="Nombre"
        />

        <div className={styles.estimateRow}>
          <button className={styles.estimate} onClick={estimate} disabled={!name.trim() || estimating}>
            {estimating
              ? 'Estimando…'
              : valid
                ? '✨ Recalcular con IA'
                : '✨ Estimar con IA'}
          </button>
        </div>

        <div className={styles.grid}>
          <Mini label="kcal" value={kcal} onChange={setKcal} />
          <Mini label="Prot." value={protein} onChange={setProtein} />
          <Mini label="Carb." value={carbs} onChange={setCarbs} />
          <Mini label="Grasa" value={fat} onChange={setFat} />
        </div>

        {estError && <p className={styles.estError}>{estError}</p>}

        <label className={styles.timeRow}>
          <span className={styles.timeLabel}>Hora (opcional)</span>
          <input
            className={styles.timeInput}
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            aria-label="Hora"
          />
        </label>

        {!valid && name.trim().length > 0 ? (
          <div className={styles.hint}>Pulsa «Estimar con IA» o añade kcal / algún macro para guardar.</div>
        ) : (
          n(kcal) === 0 && <div className={styles.hint}>Si dejas las kcal vacías, las calculamos con los macros.</div>
        )}

        <div className={styles.actions}>
          <Button variant="ghost" block={false} className={styles.flex} onClick={onClose}>
            Cancelar
          </Button>
          <Button block={false} className={styles.flex} onClick={save} disabled={!valid}>
            {editing ? 'Guardar' : 'Añadir'}
          </Button>
        </div>

        {editing && (
          <div className={styles.editActions}>
            <button className={styles.repeat} onClick={repeat}>
              Repetir hoy
            </button>
            <button className={`${styles.delete} ${confirmDel ? styles.deleteArmed : ''}`} onClick={del}>
              {confirmDel ? '¿Seguro? Eliminar' : 'Eliminar'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function Mini({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className={styles.mini}>
      <span className={styles.miniLabel}>{label}</span>
      <input
        className={styles.miniInput}
        value={value}
        inputMode="decimal"
        onChange={(e) => onChange(e.target.value)}
        placeholder="0"
        aria-label={label}
      />
    </label>
  )
}
