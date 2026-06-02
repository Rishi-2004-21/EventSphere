// aiModules.js — Local AI Logic (no API calls)

const KEYWORD_MAP = {
  Art: ['art', 'gallery', 'exhibition', 'paint', 'sculpture', 'music', 'concert', 'performance', 'photography', 'graffiti', 'mural'],
  Tech: ['tech', 'ai', 'coding', 'startup', 'hackathon', 'developer', 'software', 'blockchain', 'web3', 'cloud', 'devops', 'cybersecurity', 'innovation'],
  Fitness: ['fitness', 'yoga', 'gym', 'run', 'marathon', 'health', 'wellness', 'workout', 'crossfit', 'cycling', 'zumba', 'pilates'],
  Cultural: ['culture', 'heritage', 'festival', 'tradition', 'dance', 'folk', 'history', 'bharatanatyam', 'carnatic', 'hindustani', 'classical'],
  Community: ['community', 'volunteer', 'social', 'charity', 'meetup', 'networking', 'book', 'literature', 'environment'],
  Lifestyle: ['food', 'fashion', 'travel', 'photography', 'beauty', 'wine', 'cuisine', 'shopping', 'luxury'],
}

export function categorizeEvent(title, description) {
  const text = `${title} ${description}`.toLowerCase()
  const scores = {}
  let total = 0

  Object.entries(KEYWORD_MAP).forEach(([cat, keywords]) => {
    const matches = keywords.filter((kw) => text.includes(kw)).length
    scores[cat] = matches
    total += matches
  })

  if (total === 0) return [{ category: 'Community', confidence: 100 }]

  return Object.entries(scores)
    .map(([category, matches]) => ({
      category,
      confidence: Math.round((matches / total) * 100),
    }))
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3)
}

export function detectSpam(title, description, price) {
  let score = 0
  const SPAM_KEYWORDS = ['free money', 'win', 'prize', 'guaranteed', 'lucky', 'offer', 'limited']

  if (title && title === title.toUpperCase() && title.length > 5) score += 20
  if (!description || description.length < 50) score += 20
  if (price === 0 && description && description.length < 30) score += 15

  const text = `${title} ${description}`.toLowerCase()
  SPAM_KEYWORDS.forEach((kw) => { if (text.includes(kw)) score += 25 })
  score += Math.random() * 10

  return Math.min(Math.round(score), 100)
}

export function recommendEvents(currentUser, eventsArray) {
  const approved = eventsArray.filter((e) => e.status === 'approved')
  if (!currentUser) return approved

  const interests = currentUser.interests || []

  const scored = approved.map((evt) => {
    let score = 0
    if (interests.includes(evt.category)) score += 30
    if (currentUser.city && evt.city === currentUser.city) score += 15
    if (evt.trending === 'Hot') score += 20
    if (evt.trending === 'Rising') score += 10
    return { ...evt, _score: score }
  })

  return scored.sort((a, b) => b._score - a._score)
}
