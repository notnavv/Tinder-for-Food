import type { Food } from '../types/contracts'

export default function DishDetails({ food }: { food: Food }) {
  return <details className="dish-details">
    <summary>Dish details</summary>
    <p>{food.ingredients_text || 'Ingredients have not been collected.'}</p>
    <p>Listed allergens: {food.allergens === null ? 'unknown' : food.allergens.join(', ') || 'none listed'}. This is not an allergy-safety guarantee.</p>
    <p>Dietary tags: {food.dietary_tags?.join(', ') || 'none recorded'}.</p>
  </details>
}
