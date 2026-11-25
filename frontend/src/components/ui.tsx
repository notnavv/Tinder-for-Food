import { useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import type { Food } from '../types/contracts'
import { USE_MOCKS } from '../lib/supabase'

export function SectionLabel({ children }: { children: ReactNode }) {
  return <span className="section-label">{children}</span>
}

export function PageHeader({ eyebrow, title, description }: { eyebrow: string; title: ReactNode; description?: string }) {
  return (
    <header className="page-header">
      <SectionLabel>{eyebrow}</SectionLabel>
      <h1>{title}</h1>
      {description && <p>{description}</p>}
    </header>
  )
}

export function PaperPanel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`paper-panel ${className}`}>{children}</section>
}

export function PrimaryButton({ children, className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={`primary-button ${className}`} {...props}>{children}</button>
}

export function SecondaryButton({ children, className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={`secondary-button ${className}`} {...props}>{children}</button>
}

export function Tag({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'coral' }) {
  return <span className={`tag tag-${tone}`}>{children}</span>
}

const IMAGE_BY_WORD: Record<string, string> = {
  chicken: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=700&q=80',
  tofu: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=700&q=80',
  tacos: 'https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?auto=format&fit=crop&w=700&q=80',
  pizza: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=700&q=80',
  salmon: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=700&q=80',
  burger: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=700&q=80',
  lemon: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=700&q=80',
  pho: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=700&q=80',
  chana: 'https://images.unsplash.com/photo-1601050690117-94f5f6fa8bd7?auto=format&fit=crop&w=700&q=80',
  mac: 'https://images.unsplash.com/photo-1543339494-b4cd4f7ba686?auto=format&fit=crop&w=700&q=80',
  rice: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=700&q=80',
  salad: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=700&q=80',
}

function foodImage(food: Food) {
  if (food.image_url) return food.image_url
  if (!food.name.startsWith('Mock ')) return null
  const name = food.name.toLowerCase()
  const match = Object.keys(IMAGE_BY_WORD).find((word) => name.includes(word))
  return match ? IMAGE_BY_WORD[match] : null
}

export function FoodImage({ food, size = 'large' }: { food: Food; size?: 'small' | 'large' }) {
  const [failed, setFailed] = useState(false)
  const src = foodImage(food)
  return (
    <div className={`food-image food-image-${size}`}>
      {src && !failed ? <img draggable={false} src={src} alt={food.image_url ? food.name : 'Illustrative food photo; not the actual UCLA dish'} onError={() => setFailed(true)} /> : <span role="img" aria-label="Dish photo unavailable">{food.name.replace(/^Mock /, '').slice(0, 2).toUpperCase()}</span>}
    </div>
  )
}

export function DemoNotice() {
  return USE_MOCKS ? <p className="demo-notice" role="status">Demo mode · sample dishes and illustrative photos. Recommendations and Food DNA are static examples, not calculated from your swipes.</p> : null
}
