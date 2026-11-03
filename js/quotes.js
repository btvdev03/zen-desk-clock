/**
 * ZenDesk Clock - Curated Deep Work & Stoic Quotes
 */
export const quotes = [
  { text: "We suffer more often in imagination than in reality.", author: "Seneca" },
  { text: "Do not act as if you were going to live ten thousand years. Death hangs over you.", author: "Marcus Aurelius" },
  { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
  { text: "Deep work is the ability to focus without distraction on a cognitively demanding task.", author: "Cal Newport" },
  { text: "The impediment to action advances action. What stands in the way becomes the way.", author: "Marcus Aurelius" },
  { text: "Focus is a muscle. The more you practice, the stronger it gets.", author: "Zen Wisdom" },
  { text: "Time you enjoy wasting is not wasted time.", author: "Bertrand Russell" },
  { text: "Make each day your masterpiece.", author: "John Wooden" },
  { text: "You have power over your mind - not outside events. Realize this, and you will find strength.", author: "Marcus Aurelius" },
  { text: "It is not that we have a short time to live, but that we waste a lot of it.", author: "Seneca" },
  { text: "Do less, but do it with complete presence.", author: "Zen Proverb" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Small deeds done are better than great deeds planned.", author: "Peter Marshall" },
  { text: "Breath in clarity, breathe out distraction.", author: "Mindfulness" },
  { text: "Order and simplification are the first steps toward the mastery of a subject.", author: "Thomas Mann" }
];

export function getRandomQuote() {
  const index = Math.floor(Math.random() * quotes.length);
  return quotes[index];
}
