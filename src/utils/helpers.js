// helpers.js

export const getEncouragingPhrase = () => {
  const phrases = [
    "You're proving your strength!",
    'Keep up the great work!',
    "You're on fire!",
    'Blossom and shine!',
    'Growing stronger every day!',
    'Your dedication is blooming!',
    'Keep nurturing your progress!',
    'Your efforts are bearing fruit!',
    'Stay rooted and keep going!',
    'Let your potential blossom!',
  ];
  return phrases[Math.floor(Math.random() * phrases.length)];
};


export const getEmojiByWeek = (week) => {
  const emojis = [
    '🪨', '🌱', '🌿', '🌳', '🌻', '🍀', '🍂', '🌸', '🌷', '🌼', '🌾', '🌵', '🍁', '🪵',
    '🍇', '🍈', '🍉', '🍊', '🍋', '🍌', '🍍', '🥭', '🍎', '🍏', '🍐', '🍑', '🍒', '🍓',
    '🥥', '🥑', '🍆', '🍅', '🫐', '🥕', '🌽', '🌰', '🍄', '🧅', '🧄', '🥦', '🥬', '🥒',
    '🌶️', '🫑', '🥔', '🥕', '🥝', '🥭', '🌲', '🌾', '🌻', '🍂',
  ];
  const index = (week - 1) % emojis.length;
  return emojis[index];
};
