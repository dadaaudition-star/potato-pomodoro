(() => {
  "use strict";

  window.PotatoConstants = {
    BREAK_TIPS: [
      "Drink water 💧",
      "Stretch your neck gently",
      "Look far away for 20 seconds 👀",
      "Roll your shoulders back",
      "Take three slow breaths",
      "Refill your tea or water ☕",
      "Stand up and wiggle a little",
      "Unclench your jaw",
      "Shake out your hands",
      "Rest your eyes — blink slowly",
      "Walk to the window",
      "Eat a small snack if you need one 🥔",
    ],

    TIME_HINTS: {
      study: [
        { above: 0.85, lines: ["Deep breath. You've got this.", "Potato is settling in with you."] },
        { above: 0.6, lines: ["Steady focus. One chunk at a time.", "You're in the groove now."] },
        { above: 0.35, lines: ["Past the halfway hill!", "Keep going — potato is cheering."] },
        { above: 0.12, lines: ["Final stretch! So close!", "Almost there, superstar."] },
        { above: 0, lines: ["Last few minutes — finish strong!", "Potato can smell victory."] },
      ],
      shortBreak: [
        { above: 0.5, lines: ["Enjoy this tiny reset.", "Potato says: rest is allowed."] },
        { above: 0, lines: ["Break ending soon — sip water?", "Ease back in when you're ready."] },
      ],
      longBreak: [
        { above: 0.5, lines: ["Proper rest mode activated.", "Potato approves of this nap energy."] },
        { above: 0, lines: ["Gather your energy for the next round.", "Soft landing back to study soon."] },
      ],
    },

    ACHIEVEMENTS: [
      { id: "first-spud", name: "First Spud", emoji: "🥔", desc: "Complete 1 study session", minPomodoros: 1 },
      { id: "five-pack", name: "Five Pack", emoji: "🍟", desc: "Complete 5 study sessions", minPomodoros: 5 },
      { id: "ten-tater", name: "Ten Tater", emoji: "🌟", desc: "Complete 10 study sessions", minPomodoros: 10 },
      { id: "hour-hero", name: "Hour Hero", emoji: "⏰", desc: "Study for 60+ minutes total", minStudyMinutes: 60 },
      { id: "deep-focus", name: "Deep Focus", emoji: "📚", desc: "Study for 300+ minutes total", minStudyMinutes: 300 },
      { id: "streak-starter", name: "Streak Starter", emoji: "🔥", desc: "2-day study streak", minStreak: 2 },
      { id: "week-warrior", name: "Week Warrior", emoji: "🏅", desc: "7-day study streak", minStreak: 7 },
      { id: "journal-keeper", name: "Journal Keeper", emoji: "📝", desc: "Write 3 completion notes", minNotes: 3 },
    ],
  };
})();
