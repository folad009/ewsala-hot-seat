import type { Question } from "@/lib/types";

/**
 * HOW TO ADD MORE QUESTIONS
 * --------------------------
 * 1. Push a new object into QUESTION_BANK below with:
 *    - id: unique string (e.g. "fb-9")
 *    - category: "football" | "nollywood" | "nigerian_history" | "afrobeats" | "current_affairs"
 *    - text: the question (string)
 *    - options: exactly four strings [A, B, C, D]
 *    - correctIndex: 0–3 (index of the correct option)
 * 2. Add the same id to QUESTION_DIFFICULTY in src/lib/question-difficulty.ts
 *    with 1 (easier), 2 (medium), or 3 (harder) so the daily ladder can ramp difficulty.
 * 3. Rebuild / restart dev server. The daily picker will include new items automatically.
 *
 * Curated pool; daily quiz picks a deterministic subset per Lagos calendar day.
 */
export const QUESTION_BANK: Question[] = [
  // Football — EPL & AFCON
  {
    id: "fb-1",
    category: "football",
    text: "Which club won the English Premier League in the 2023–24 season?",
    options: ["Arsenal", "Manchester City", "Liverpool", "Chelsea"],
    correctIndex: 1,
  },
  {
    id: "fb-2",
    category: "football",
    text: "Nigeria’s men’s national team is nicknamed what?",
    options: ["The Eagles", "Super Eagles", "Green Eagles", "Flying Eagles"],
    correctIndex: 1,
  },
  {
    id: "fb-3",
    category: "football",
    text: "Which country hosted AFCON 2023 (played in 2024)?",
    options: ["Cameroon", "Egypt", "Ivory Coast", "Senegal"],
    correctIndex: 2,
  },
  {
    id: "fb-4",
    category: "football",
    text: "Victor Osimhen won which major individual award in 2023?",
    options: ["Ballon d’Or", "African Footballer of the Year", "Golden Boot (EPL)", "Puskás Award"],
    correctIndex: 1,
  },
  {
    id: "fb-5",
    category: "football",
    text: "How many players are on the pitch for one team at kick-off?",
    options: ["10", "11", "12", "9"],
    correctIndex: 1,
  },
  {
    id: "fb-6",
    category: "football",
    text: "The Premier League was founded in which year?",
    options: ["1990", "1992", "1996", "1988"],
    correctIndex: 1,
  },
  {
    id: "fb-7",
    category: "football",
    text: "Which of these is a London-based Premier League club?",
    options: ["Everton", "West Ham United", "Leeds United", "Newcastle United"],
    correctIndex: 1,
  },
  {
    id: "fb-8",
    category: "football",
    text: "A standard football match has how many halves?",
    options: ["1", "2", "3", "4"],
    correctIndex: 1,
  },
  // Nollywood
  {
    id: "nl-1",
    category: "nollywood",
    text: "Which film is widely cited as helping launch modern Nollywood in the 1990s?",
    options: ["October 1", "Living in Bondage", "The Wedding Party", "Half of a Yellow Sun"],
    correctIndex: 1,
  },
  {
    id: "nl-2",
    category: "nollywood",
    text: "Genevieve Nnaji directed which Netflix-acquired film?",
    options: ["Lionheart", "King of Boys", "Citation", "The Milkmaid"],
    correctIndex: 0,
  },
  {
    id: "nl-3",
    category: "nollywood",
    text: "Kunle Afolayan’s thriller set on a flight is titled what?",
    options: ["The Figurine", "October 1", "Citation", "Phone Swap"],
    correctIndex: 1,
  },
  {
    id: "nl-4",
    category: "nollywood",
    text: "Which city is often considered the hub of Nollywood production?",
    options: ["Abuja", "Lagos", "Port Harcourt", "Kano"],
    correctIndex: 1,
  },
  {
    id: "nl-5",
    category: "nollywood",
    text: "Ramsey Nouah is best known as what kind of performer?",
    options: ["Musician", "Actor", "Director only", "Sports presenter"],
    correctIndex: 1,
  },
  {
    id: "nl-6",
    category: "nollywood",
    text: "“The Wedding Party” was produced by which collective?",
    options: ["EbonyLife Films", "Anthill Studios", "Kemi Adetiba Productions", "Inkblot Productions"],
    correctIndex: 0,
  },
  {
    id: "nl-7",
    category: "nollywood",
    text: "Nollywood roughly refers to Nigeria’s what industry?",
    options: ["Music videos", "Film industry", "Radio drama", "Fashion"],
    correctIndex: 1,
  },
  // Nigerian history
  {
    id: "nh-1",
    category: "nigerian_history",
    text: "Nigeria gained independence from Britain in which year?",
    options: ["1957", "1960", "1963", "1970"],
    correctIndex: 1,
  },
  {
    id: "nh-2",
    category: "nigerian_history",
    text: "Who was Nigeria’s first Prime Minister?",
    options: ["Nnamdi Azikiwe", "Abubakar Tafawa Balewa", "Obafemi Awolowo", "Ahmadu Bello"],
    correctIndex: 1,
  },
  {
    id: "nh-3",
    category: "nigerian_history",
    text: "The Nigerian Civil War is often dated from 1967 to which year?",
    options: ["1969", "1970", "1971", "1973"],
    correctIndex: 1,
  },
  {
    id: "nh-4",
    category: "nigerian_history",
    text: "Lagos was Nigeria’s capital until it moved to Abuja in which year?",
    options: ["1989", "1991", "1993", "1999"],
    correctIndex: 1,
  },
  {
    id: "nh-5",
    category: "nigerian_history",
    text: "The Niger River flows into the Gulf of Guinea through which massive delta?",
    options: ["Okavango Delta", "Niger Delta", "Danube Delta", "Ganges Delta"],
    correctIndex: 1,
  },
  {
    id: "nh-6",
    category: "nigerian_history",
    text: "Which ancient African kingdom was centred in what is now north-western Nigeria?",
    options: ["Benin Empire", "Kanem–Bornu", "Songhai only", "Mali Empire only"],
    correctIndex: 1,
  },
  {
    id: "nh-7",
    category: "nigerian_history",
    text: "Nigeria’s national coat of arms features an eagle and what floral emblem?",
    options: ["Rose", "Hibiscus (national flower)", "Lily", "Sunflower"],
    correctIndex: 1,
  },
  // Afrobeats / Music
  {
    id: "mu-1",
    category: "afrobeats",
    text: "Burna Boy’s album “Twice as Tall” won which major Grammy category in 2021?",
    options: ["Best New Artist", "Best Global Music Album", "Album of the Year", "Best Rap Album"],
    correctIndex: 1,
  },
  {
    id: "mu-2",
    category: "afrobeats",
    text: "Wizkid’s global hit featuring Drake is titled what?",
    options: ["Ojuelegba", "Come Closer", "Essence", "Joro"],
    correctIndex: 1,
  },
  {
    id: "mu-3",
    category: "afrobeats",
    text: "Fela Kuti pioneered which Afrocentric genre from Nigeria?",
    options: ["Highlife", "Afrobeat", "Jùjú only", "Fuji only"],
    correctIndex: 1,
  },
  {
    id: "mu-4",
    category: "afrobeats",
    text: "Rema’s “Calm Down” remix with which artist became a worldwide smash?",
    options: ["Beyoncé", "Selena Gomez", "Dua Lipa", "Rihanna"],
    correctIndex: 1,
  },
  {
    id: "mu-5",
    category: "afrobeats",
    text: "Davido is associated with which record label he founded?",
    options: ["Mavin Records", "DMW / Davido Music Worldwide", "Chocolate City", "Starboy Entertainment"],
    correctIndex: 1,
  },
  {
    id: "mu-6",
    category: "afrobeats",
    text: "Tiwa Savage is often called the “Queen” of what Nigerian pop scene?",
    options: ["Gospel", "Afrobeats / Afropop", "Reggae", "Fuji"],
    correctIndex: 1,
  },
  {
    id: "mu-7",
    category: "afrobeats",
    text: "The New Afrika Shrine in Lagos honours which legendary family?",
    options: ["The Kutis", "The Adeles", "The Okoyes", "The Oyekans"],
    correctIndex: 0,
  },
  // Current affairs (time-sensitive items kept general or verified broad facts)
  {
    id: "ca-1",
    category: "current_affairs",
    text: "Nigeria’s currency is abbreviated as what internationally?",
    options: ["NGN", "NGR", "NIA", "NGA"],
    correctIndex: 0,
  },
  {
    id: "ca-2",
    category: "current_affairs",
    text: "The African Union (AU) headquarters is in which city?",
    options: ["Nairobi", "Addis Ababa", "Cairo", "Accra"],
    correctIndex: 1,
  },
  {
    id: "ca-3",
    category: "current_affairs",
    text: "ECOWAS is a regional bloc focused on which continent?",
    options: ["Asia", "Africa", "South America", "Europe"],
    correctIndex: 1,
  },
  {
    id: "ca-4",
    category: "current_affairs",
    text: "Lagos State is on Nigeria’s what coast?",
    options: ["Mediterranean", "Atlantic / Gulf of Guinea", "Indian Ocean", "Pacific"],
    correctIndex: 1,
  },
  {
    id: "ca-5",
    category: "current_affairs",
    text: "Which body organises the FIFA World Cup?",
    options: ["IOC", "FIFA", "UEFA only", "CAF only"],
    correctIndex: 1,
  },
  {
    id: "ca-6",
    category: "current_affairs",
    text: "Solar energy is considered renewable because it relies on what?",
    options: ["Coal", "The sun", "Natural gas", "Uranium"],
    correctIndex: 1,
  },
  {
    id: "ca-7",
    category: "current_affairs",
    text: "The United Nations (UN) headquarters is in which city?",
    options: ["Geneva", "New York City", "Paris", "Vienna"],
    correctIndex: 1,
  },
];
