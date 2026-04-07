/**
 * One-off generator: writes src/data/questions-extra-200.ts
 * Run: node scripts/generate-extra-questions.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(__dirname, "../src/data/questions-extra-200.ts");

const football = [
  ["fb-15", "How many substitutions are allowed in most top-flight league matches (normal time)?", ["2", "3", "4", "5"], 2],
  ["fb-16", "VAR in football stands for what?", ["Video Assistant Referee", "Virtual Action Replay", "Verified Attack Rule", "Victory Award Review"], 0],
  ["fb-17", "A direct free kick inside the box can be awarded for what inside the penalty area?", ["Any foul by defender", "Only handball by defender", "Only offside", "Never"], 1],
  ["fb-18", "The FIFA World Cup is held every how many years?", ["2", "3", "4", "5"], 2],
  ["fb-19", "Which country has won the most FIFA World Cup titles (men’s) as of common record?", ["Germany", "Italy", "Brazil", "Argentina"], 2],
  ["fb-20", "The Ballon d’Or primarily honours what?", ["Best coach", "Best goalkeeper", "Best individual player performance", "Fair play"], 2],
  ["fb-21", "A throw-in is taken with both hands from where?", ["Behind the head", "Chest height only", "Waist only", "Any height"], 0],
  ["fb-22", "How many minutes of added time can the fourth official display?", ["Only 1", "Only 3", "Variable at referee discretion", "Fixed 10"], 2],
  ["fb-23", "The Champions League is organised by which body?", ["FIFA", "UEFA", "CAF", "CONMEBOL"], 1],
  ["fb-24", "A goalkeeper cannot pick up a deliberate pass from which teammate’s body part?", ["Head", "Chest", "Foot", "Shoulder"], 2],
  ["fb-25", "AFCON is the flagship tournament for national teams in which continent?", ["Asia", "Europe", "Africa", "South America"], 2],
  ["fb-26", "The term ‘clean sheet’ in football means what?", ["No goals scored", "No goals conceded", "No cards", "No subs used"], 1],
  ["fb-27", "Nigeria’s Super Eagles home kit traditionally features which main colours?", ["Red and white", "Green and white", "Blue and yellow", "Black and gold"], 1],
  ["fb-28", "An indirect free kick inside the box is most commonly awarded for what?", ["Dangerous play inside area", "Penalty", "Corner", "Throw-in foul"], 0],
  ["fb-29", "How many players start on the field for one team?", ["10", "11", "12", "9"], 1],
  ["fb-30", "Extra time in a knockout match is usually how long total?", ["15 minutes", "20 minutes", "30 minutes", "45 minutes"], 2],
  ["fb-31", "A player sent off (red card) must do what?", ["Leave field of play", "Stand on touchline", "Swap with sub", "Wait 10 minutes"], 0],
  ["fb-32", "The offside rule applies when a player is nearer to which line than the ball and second-last opponent?", ["Goal line", "Halfway line", "Touchline", "Penalty spot"], 0],
  ["fb-33", "Which English club is nicknamed ‘The Red Devils’?", ["Liverpool", "Arsenal", "Manchester United", "Chelsea"], 2],
  ["fb-34", "The term ‘nutmeg’ in football describes the ball passing where?", ["Over the crossbar", "Between an opponent’s legs", "Into top corner", "Under the wall"], 1],
  ["fb-35", "A corner kick is awarded when the ball crosses which line last off a defender?", ["Goal line", "Touchline", "Halfway line", "Penalty arc"], 0],
  ["fb-36", "FIFA’s headquarters city is?", ["London", "Zurich", "Paris", "Geneva"], 1],
  ["fb-37", "The Europa League is roughly the tier below which competition in Europe?", ["Conference League", "Champions League", "World Cup", "Copa Libertadores"], 1],
  ["fb-38", "A penalty shootout begins with how many kicks per team in the first round?", ["3", "4", "5", "10"], 2],
  ["fb-39", "The ‘Sweeper’ role in defence is primarily meant to?", ["Attack wing", "Cover behind the line", "Take throw-ins", "Mark referee"], 1],
  ["fb-40", "Yellow card accumulation often leads to what in a tournament?", ["Bonus point", "Suspension next match", "Free substitution", "Nothing"], 1],
  ["fb-41", "Which surface is standard for professional outdoor football?", ["Sand", "Natural or approved artificial turf", "Ice", "Wood"], 1],
  ["fb-42", "The centre circle is used mainly for what restart?", ["Kick-off", "Penalty", "Corner", "Goal kick"], 0],
  ["fb-43", "A ‘brace’ means how many goals by one player in a match?", ["1", "2", "3", "4"], 1],
  ["fb-44", "The linesman/assistant referee primarily watches for what along the touchline?", ["Offside and out of play", "Only goals", "Only cards", "Only subs"], 0],
  ["fb-45", "Which Nigerian striker has been prominent in Serie A and the national team?", ["Thierry Henry", "Victor Osimhen", "Harry Kane", "Lewandowski"], 1],
  ["fb-46", "The FA Cup in England is a what-style tournament?", ["Only league", "Knockout cup", "Friendly only", "Youth only"], 1],
  ["fb-47", "Goal-line technology helps officials decide what?", ["Offside", "Ball wholly crossed line for goal", "Fouls", "Corners"], 1],
  ["fb-48", "A ‘through ball’ is a pass intended to do what?", ["Go backwards only", "Split defenders for a runner", "Go to goalkeeper only", "Exit play"], 1],
  ["fb-49", "The number on a substitute board shows what?", ["Minutes added", "Player number leaving/entering", "Score", "Cards"], 1],
  ["fb-50", "Which competition features Europe’s top clubs in a group stage then knockouts?", ["AFCON", "Copa América", "UEFA Champions League", "MLS Cup"], 2],
  ["fb-51", "A ‘bicycle kick’ is also informally called what?", ["Panenka", "Scissor/overhead kick", "Rabona", "Chip"], 1],
  ["fb-52", "The captain’s armband is worn to show what?", ["Sponsor", "Team leader on pitch", "Injury", "Youth player"], 1],
  ["fb-53", "Stoppage time is added mainly because of what?", ["Halftime length", "Wasted time and injuries", "TV ads", "Weather only"], 1],
  ["fb-54", "Which position often wears jersey number 1 traditionally?", ["Striker", "Goalkeeper", "Referee", "Coach"], 1],
];

const nollywood = [
  ["nl-13", "The film ‘Half of a Yellow Sun’ is adapted from a novel by whom?", ["Chimamanda Ngozi Adichie", "Wole Soyinka", "Chinua Achebe", "Ben Okri"], 0],
  ["nl-14", "Nollywood’s rapid video-film era in the 1990s was often shot on what format?", ["IMAX only", "VHS / video", "Only 70mm", "Only streaming"], 1],
  ["nl-15", "Which actress starred in ‘The Wedding Party’ as Dunni?", ["Adesua Etomi", "Genevieve Nnaji", "Rita Dominic", "Omotola Jalade"], 0],
  ["nl-16", "Kunle Afolayan is best known as what in Nigerian cinema?", ["Only musician", "Director and producer", "Only critic", "Sports host"], 1],
  ["nl-17", "‘Living in Bondage’ (1992) is often cited in histories of which industry?", ["Nollywood", "Bollywood", "Hollywood only", "Nigerian radio"], 0],
  ["nl-18", "EbonyLife Films is associated with which producer?", ["Mo Abudu", "Kunle Afolayan only", "Lancelot Oduwa", "Tunde Kelani only"], 0],
  ["nl-19", "Which city hosts the Africa International Film Festival (AFRIFF) prominently?", ["Abuja", "Lagos", "Kano", "Calabar"], 1],
  ["nl-20", "‘Citation’ (2020) deals with themes around what?", ["Space travel", "Academic harassment and justice", "Only comedy", "Only horror"], 1],
  ["nl-21", "RMD is a common shorthand for which veteran actor?", ["Ramsey Nouah", "Richard Mofe-Damijo", "Rita Dominic", "Olu Jacobs"], 1],
  ["nl-22", "‘October 1’ is set around which historical period?", ["2020 pandemic", "Pre-independence Nigeria", "Only futuristic", "Ancient Rome"], 1],
  ["nl-23", "Which platform acquired ‘Lionheart’ as an original in many regions?", ["Hulu only", "Netflix", "Disney only", "HBO only"], 1],
  ["nl-24", "Nollywood dialogue often mixes English with what?", ["Only Latin", "Pidgin and local languages", "Only French", "Only Arabic"], 1],
  ["nl-25", "‘The Figurine’ is directed by whom?", ["Kemi Adetiba", "Kunle Afolayan", "Tope Oshin", "Jadesola Osiberu"], 1],
  ["nl-26", "Which genre blend is common in mainstream Nollywood?", ["Only silent", "Drama, comedy, thriller mixes", "Only documentary", "Only animation"], 1],
  ["nl-27", "AMVCA stands for what awards show?", ["African Magic Viewers’ Choice Awards", "American Music Video", "Asian Movie", "Arab Music"], 0],
  ["nl-28", "‘King of Boys’ sequel is subtitled what?", ["Return of the King", "The Beginning", "The End", "Reloaded"], 0],
  ["nl-29", "Which veteran is known for ‘Osuofia’ comic roles?", ["Nkem Owoh", "Pete Edochie", "Sola Sobowale", "Bimbo Ademoye"], 0],
  ["nl-30", "‘Gangs of Lagos’ is primarily set in which city?", ["Abuja", "Lagos", "Enugu", "Ibadan"], 1],
  ["nl-31", "Anthill Studios is associated with which filmmaker?", ["Kemi Adetiba", "Niyi Akinmolayan", "Kunle Afolayan", "Tope Oshin"], 1],
  ["nl-32", "Which actress is known for ‘The Wedding Party’ and ‘King of Boys’?", ["Sola Sobowale", "Mercy Johnson only", "Ini Edo only", "Chioma Akpotha only"], 0],
  ["nl-33", "Nollywood distribution in the 2000s relied heavily on what?", ["Only cinemas", "DVD markets and informal trade", "Only satellite exclusive", "Only vinyl"], 1],
  ["nl-34", "‘Phone Swap’ is a comedy directed by whom?", ["Kunle Afolayan", "Kemi Adetiba", "Mildred Okwo", "Genevieve Nnaji"], 0],
  ["nl-35", "Which film festival is held in Port Harcourt?", ["AFRIFF", "Zuma Film Festival", "Port Harcourt International Film Festival", "Cannes"], 2],
  ["nl-36", "‘Up North’ explores themes of NYSC and identity in which region context?", ["Only UK", "Northern Nigeria", "Only Antarctica", "Only Brazil"], 1],
  ["nl-37", "Inkblot Productions has co-produced many titles with which focus?", ["Only horror", "Commercial Nigerian cinema", "Only silent", "Only opera"], 1],
  ["nl-38", "Which actor is known for ‘The Meeting’ and political satire roles?", ["Femi Branch", "Deyemi Okanlawon only", "Banky W only", "None"], 0],
  ["nl-39", "‘Namaste Wahala’ blends Nollywood with which industry?", ["Korean drama", "Bollywood influences", "Only Nollywood silent", "Only anime"], 1],
  ["nl-40", "Real-time streaming premieres became more common for Nollywood in which decade?", ["1980s", "1990s", "2010s–2020s", "1950s"], 2],
  ["nl-41", "Which director made ‘The CEO’?", ["Kunle Afolayan", "Kemi Adetiba", "Tope Oshin", "Izu Ojukwu"], 0],
  ["nl-42", "‘76’ is a historical drama set around which era?", ["Biafra war period", "Ancient Egypt", "2050 future", "Victorian England"], 0],
  ["nl-43", "Which platform is home to many Nollywood series in the 2020s?", ["Only Betamax", "Showmax, Netflix, Prime Video, etc.", "Only laserdisc", "Only fax"], 1],
  ["nl-44", "‘Oloture’ deals with subject matter around what?", ["Space travel", "Trafficking and exploitation", "Only slapstick", "Cooking"], 1],
  ["nl-45", "Which actress directed ‘Lionheart’?", ["Genevieve Nnaji", "Kemi Adetiba", "Funke Akindele", "Mo Abudu"], 0],
  ["nl-46", "‘Prophetess’ is primarily what genre?", ["Horror only", "Sports documentary", "Comedy", "Silent"], 2],
  ["nl-47", "Which veteran actress is known as ‘Omosexy’?", ["Omotola Jalade-Ekeinde", "Genevieve Nnaji", "Rita Dominic", "Stephanie Okereke"], 0],
  ["nl-48", "‘Sugar Rush’ is best described as?", ["Only horror", "Crime-comedy caper", "Only nature doc", "Silent film"], 1],
  ["nl-49", "Which writer is central to adapting ‘Half of a Yellow Sun’?", ["Biyi Bandele (screenplay)", "Only foreign only", "Only AI", "Unknown"], 0],
  ["nl-50", "Nollywood’s ‘Asabawood’ sometimes refers to production hub in which state area?", ["Lagos Island", "Delta / Asaba cluster", "Borno", "Sokoto"], 1],
  ["nl-51", "‘Mokalik’ by Kunle Afolayan focuses on what setting?", ["Mechanic village apprenticeship", "Only Mars", "Only submarine", "Only ballet"], 0],
  ["nl-52", "Which show helped popularise ‘Jenifa’ character on wider TV?", ["Jenifa’s Diary", "Breaking Bad", "Friends", "The Office"], 0],
];

const history = [
  ["nh-13", "Nigeria became a republic in which year (first republic)?", ["1959", "1960", "1963", "1966"], 2],
  ["nh-14", "The Sokoto Caliphate is most associated with which century expansion?", ["10th", "19th", "21st", "5th"], 1],
  ["nh-15", "Herbert Macaulay is remembered mainly as a Nigerian what?", ["Colonial governor", "Nationalist and politician", "Only musician", "Only athlete"], 1],
  ["nh-16", "The Amalgamation of Northern and Southern Protectorates was in which year?", ["1900", "1914", "1920", "1935"], 1],
  ["nh-17", "Which city was Nigeria’s capital before Abuja?", ["Kano", "Lagos", "Enugu", "Calabar"], 1],
  ["nh-18", "The Aba Women’s Riot is associated with which decade?", ["1880s", "1920s", "1980s", "2010s"], 1],
  ["nh-19", "Nigeria’s 1999 constitution marked the start of which republic?", ["Third", "Fourth", "Fifth", "Second"], 1],
  ["nh-20", "The Oyo Empire was prominent in which modern Nigerian region?", ["South-South only", "South-West", "North-East only", "South-East only"], 1],
  ["nh-21", "Which river forms part of Nigeria’s southern delta system?", ["Nile", "Niger", "Amazon", "Thames"], 1],
  ["nh-22", "The first Nigerian university opened in which city?", ["Abuja", "Ibadan", "Lagos", "Kano"], 1],
  ["nh-23", "Biafra declared independence in which year?", ["1960", "1967", "1970", "1976"], 1],
  ["nh-24", "Nigeria’s national anthem ‘Arise, O Compatriots’ replaced which older anthem?", ["God Save the Queen", "Nigeria We Hail Thee", "Only jazz", "Silent"], 1],
  ["nh-25", "Which ethnic group is predominantly in Nigeria’s South-East?", ["Hausa-Fulani", "Yoruba", "Igbo", "Kanuri"], 2],
  ["nh-26", "The Berlin Conference mainly affected African borders in which century?", ["16th", "19th", "21st", "12th"], 1],
  ["nh-27", "Nnamdi Azikiwe was Nigeria’s first what under republic structures?", ["Prime Minister", "President (ceremonial)", "Military head", "Governor of Lagos only"], 1],
  ["nh-28", "Which state is known as the ‘Centre of Excellence’?", ["Rivers", "Lagos", "Kano", "Plateau"], 1],
  ["nh-29", "The groundnut pyramids were historically linked to which region?", ["South-West", "North", "Delta only", "Cross River only"], 1],
  ["nh-30", "Oil was first discovered in commercial quantity in Nigeria around which decade?", ["1930s", "1950s", "1980s", "2000s"], 1],
  ["nh-31", "Which festival is famous in Calabar?", ["Durbar only", "Carnival Calabar", "Oktoberfest", "Mardi Gras only"], 1],
  ["nh-32", "The National Theatre in Lagos was built in the lead-up to which festival?", ["World Cup", "FESTAC 77", "Olympics 96", "AFCON 99"], 1],
  ["nh-33", "Which military leader transitioned Nigeria to civil rule in 1979?", ["Sani Abacha", "Olusegun Obasanjo", "Muhammadu Buhari", "Ibrahim Babangida"], 1],
  ["nh-34", "The Niger–Benue confluence is near which major city?", ["Lagos", "Lokoja", "Maiduguri", "Uyo"], 1],
  ["nh-35", "Which empire was centred in modern-day Edo State historically?", ["Oyo Empire", "Benin Kingdom", "Kanem-Bornu", "Songhai"], 1],
  ["nh-36", "Nigeria has how many states (as commonly referenced post-1996)?", ["19", "30", "36", "48"], 2],
  ["nh-37", "Which city is called the ‘Kano City Wall’ historic centre?", ["Lagos", "Kano", "Owerri", "Yenagoa"], 1],
  ["nh-38", "The Warri Kingdom is associated with which Niger Delta history?", ["Only Igbo", "Itsekiri and regional trade", "Only Fulani", "Only Berber"], 1],
  ["nh-39", "Which document ended military rule in 1999?", ["1999 Constitution", "1963 only", "1914 amalgamation", "Berlin act"], 0],
  ["nh-40", "Zuma Rock is a landmark near which corridor?", ["Lagos Island", "Abuja–Kaduna area", "Calabar beach", "Ogbomoso only"], 1],
  ["nh-41", "The Eyo festival is most associated with which city?", ["Kano", "Lagos (Eyo)", "Maiduguri", "Jos"], 1],
  ["nh-42", "Which Nigerian city was a major precolonial port for palm oil trade?", ["Abuja", "Bonny / Niger Delta ports", "Gusau", "Gombe"], 1],
  ["nh-43", "The Murtala Mohammed regime was noted for what in 1975–76?", ["Return to civil war", "Moving capital plans & reforms", "Joining EU", "Moon landing"], 1],
  ["nh-44", "Which group led the 1922 legislative elections under colonial rule?", ["Only women", "Elite Nigerian politicians in limited franchise", "Only military", "Only children"], 1],
  ["nh-45", "The Yoruba word ‘Oba’ generally means what?", ["Farmer", "Traditional ruler title", "Soldier", "Student"], 1],
  ["nh-46", "Nigeria joined OPEC in which decade?", ["1950s", "1971", "1999", "2010"], 1],
  ["nh-47", "Which plateau city is known for cooler climate and tin mining history?", ["Lagos", "Jos", "Warri", "Onitsha"], 1],
  ["nh-48", "The Arewa symbol is culturally linked to which broad region?", ["South-South", "Northern Nigeria", "Only abroad", "Only Antarctica"], 1],
  ["nh-49", "Which document created Nigeria’s federal structure in 1954?", ["Macpherson Constitution reforms", "US Constitution", "Magna Carta", "UN Charter"], 0],
  ["nh-50", "The ‘WAZOBIA’ trio of languages broadly refers to which three?", ["English, French, Latin", "Hausa, Yoruba, Igbo", "Arabic only", "Spanish only"], 1],
  ["nh-51", "Which city hosts Obudu Cattle Ranch (tourist site)?", ["Sokoto", "Cross River highlands", "Lagos", "Ilorin"], 1],
  ["nh-52", "The National Museum Lagos preserves mainly what?", ["Only cars", "Historical and cultural artefacts", "Only fish", "Only phones"], 1],
];

const music = [
  ["mu-13", "Grammy category ‘Best Global Music Album’ replaced older naming often called what?", ["World Music", "Only pop", "Only metal", "Only polka"], 0],
  ["mu-14", "Afrobeats spelling with an ‘s’ often distinguishes it from which older genre spelling?", ["Afrobeat (Fela era)", "Reggaeton", "K-pop", "Polka"], 0],
  ["mu-15", "Which Nigerian artist’s album ‘African Giant’ gained global acclaim?", ["Burna Boy", "Ed Sheeran", "BTS", "Madonna"], 0],
  ["mu-16", "The New Afrika Shrine is located in which city?", ["Abuja", "Lagos", "Port Harcourt", "London"], 1],
  ["mu-17", "‘Essence’ featuring Tems is a hit associated with which artist’s album?", ["Wizkid", "Davido", "Olamide", "Phyno"], 0],
  ["mu-18", "Which instrument is central to many Fuji music performances?", ["Violin only", "Talking drum / percussion", "Harp only", "Bagpipes"], 1],
  ["mu-19", "Mavin Records was founded by whom?", ["Don Jazzy", "2Baba", "D’banj only", "Banky W"], 0],
  ["mu-20", "Which city hosts Felabration annually?", ["Kano", "Lagos", "Yola", "Osogbo"], 1],
  ["mu-21", "‘Last Last’ by Burna Boy samples which famous guitar line (widely known)?", ["Sweet Home Alabama riff", "Only classical", "Only jazz", "Silent"], 0],
  ["mu-22", "Which Nigerian singer is known for ‘Try Me’ and soul-pop fusion?", ["Tems", "Adele", "Rihanna", "Beyoncé"], 0],
  ["mu-23", "Highlife music historically blended local rhythms with what?", ["Only techno", "Western instruments and jazz", "Only heavy metal", "Only opera"], 1],
  ["mu-24", "Which label is linked to Olamide’s street-pop success?", ["YBNL", "DMW", "Mavin", "Starboy"], 0],
  ["mu-25", "The Headies awards primarily celebrate what?", ["Only sports", "Nigerian and African popular music", "Only cooking", "Only coding"], 1],
  ["mu-26", "‘Unavailable’ is a hit associated with which artist (feat. Musa Keys)?", ["Davido", "Wizkid", "Asake", "Rema"], 0],
  ["mu-27", "Which female artist released ‘Celia’ album?", ["Tiwa Savage", "Simi", "Ayra Starr", "Seyi Shay"], 0],
  ["mu-28", "Jùjú music is strongly associated with which Nigerian city’s scene?", ["Lagos / Yoruba cultural base", "Maiduguri", "Yola", "Bauchi"], 0],
  ["mu-29", "Which streaming chart often features Nigerian artists globally in the 2020s?", ["Only Billboard excluded", "Billboard / Spotify global charts", "Only fax charts", "Only vinyl 1950"], 1],
  ["mu-30", "‘Ye’ by Burna Boy became a slogan partly meaning what in context?", ["Only goodbye", "Affirmation ‘I am’ / identity", "Only food", "Only traffic"], 1],
  ["mu-31", "Which duo had hit ‘Ada Ada’?", ["Flavour", "PSquare", "Bracket", "Skuki"], 0],
  ["mu-32", "Nigerian gospel crossover artist Sinach is known for which global worship hit?", ["Way Maker", "Bohemian Rhapsody", "Shape of You", "Stairway"], 0],
  ["mu-33", "Which producer is widely tagged on beats as ‘Masterkraft on the beat’?", ["Don Jazzy", "Masterkraft", "Young John", "Pheelz"], 1],
  ["mu-34", "‘Buga’ by Kizz Daniel encourages listeners to do what colloquially?", ["Sleep", "Show off / celebrate proudly", "Cook", "Drive slow"], 1],
  ["mu-35", "Which artist is nicknamed ‘OBO’?", ["Davido", "Wizkid", "Burna Boy", "Fireboy"], 0],
  ["mu-36", "Alté scene in Lagos blends Afrobeats with what?", ["Only polka", "Indie, R&B, alternative aesthetics", "Only classical opera", "Only sea shanties"], 1],
  ["mu-37", "Which festival is Nigeria’s large live music event in Lagos annually?", ["Glastonbury", "Flytime Fest / similar major concerts", "Coachella only in NG", "Tomorrowland NG"], 1],
  ["mu-38", "‘Johnny’ by Yemi Alade is primarily what genre blend?", ["Only metal", "Afropop", "Only country", "Only techno"], 1],
  ["mu-39", "Which rapper is known for ‘Igbo and Shayo’ and street hip-hop?", ["Phyno", "Drake", "Eminem", "Jay-Z"], 0],
  ["mu-40", "Asake’s breakout era is associated with which label synergy?", ["YBNL", "Mavin", "Starboy", "Chocolate City"], 0],
  ["mu-41", "Which instrument is iconic in Fuji percussion sections?", ["Triangle only", "Sakara / drums", "Harp only", "Oboe"], 1],
  ["mu-42", "‘KU LO SA’ by Oxlade gained traction partly through what?", ["Only radio 1920", "Social / streaming virality", "Only fax", "Silent film"], 1],
  ["mu-43", "Which Nigerian artist collaborated with Beyoncé on ‘The Lion King: The Gift’?", ["Wizkid", "Olamide", "Phyno", "Illbliss"], 0],
  ["mu-44", "Naija beats at 100–115 BPM often suit what dance context?", ["Only funeral only", "Club and party dancing", "Only library", "Only golf"], 1],
  ["mu-45", "Which singer uses stage name ‘Ayra Starr’?", ["Oyinkansola Sarah Aderibigbe", "Unknown", "Only fictional", "Only foreign"], 0],
  ["mu-46", "‘Ojuelegba’ by Wizkid references which Lagos area?", ["Victoria Island only", "Ojuelegba", "Lekki only", "Apapa only"], 1],
  ["mu-47", "Which band had hits ‘Do Me’ and ‘Chop My Money’?", ["PSquare", "The Beatles", "Coldplay", "Metallica"], 0],
  ["mu-48", "Nigerian music videos often premiere on which channels first?", ["Only cinema 1920", "YouTube / TV / streaming", "Only telegramgraph", "Only morse"], 1],
  ["mu-49", "Which artist is known for ‘Cash App’ street hit?", ["Bella Shmurda", "Adele", "Shakira", "Bono"], 0],
  ["mu-50", "Afrobeats collaborations with Western artists increased mainly in which era?", ["1950s radio", "2010s–2020s streaming era", "1800s", "Medieval"], 1],
  ["mu-51", "Which producer is nicknamed ‘Spellz’ for many pop hits?", ["Spellz (Ben’Jamin Obaje)", "Only AI", "Unknown", "Mozart"], 0],
  ["mu-52", "Rema’s ‘Calm Down’ original before remix was on which project context?", ["Bad Commando EP / era", "Only classical", "Only jazz 1920", "Silent"], 0],
];

const current = [
  ["ca-15", "HTTPS adds what to HTTP?", ["Slower speed only", "Encryption layer (TLS)", "More ads", "Black and white only"], 1],
  ["ca-16", "A password manager mainly helps users do what?", ["Share passwords publicly", "Store secrets securely", "Delete internet", "Print money"], 1],
  ["ca-17", "Phishing attacks often try to steal what?", ["Weather data", "Credentials and personal info", "Only music", "Only shoes"], 1],
  ["ca-18", "Two-factor authentication adds what beyond a password?", ["Slower login only", "A second proof factor", "Nothing", "Only emoji"], 1],
  ["ca-19", "Which company makes the Android operating system (owner)?", ["Apple", "Google", "Microsoft", "IBM"], 1],
  ["ca-20", "CPU stands for what?", ["Central Processing Unit", "Computer Personal Unit", "Central Personal Utility", "Core Power User"], 0],
  ["ca-21", "RAM is typically measured in what units today?", ["Kilometres", "Gigabytes", "Litres", "Horsepower"], 1],
  ["ca-22", "A PDF file is mainly used for what?", ["Only audio", "Portable documents", "Only 3D models", "Only games"], 1],
  ["ca-23", "Bluetooth is mainly used for what?", ["Cooking", "Short-range wireless links", "Long submarine cables", "Solar power"], 1],
  ["ca-24", "Wi‑Fi connects devices using mainly what?", ["Only copper wires only", "Wireless radio to router", "Only fax", "Only morse"], 1],
  ["ca-25", "Which app category includes WhatsApp and Signal?", ["Only games", "Messaging", "Only CAD", "Only spreadsheets"], 1],
  ["ca-26", "Cloud storage means files are kept where?", ["Only on paper", "On remote servers accessed online", "Only in RAM forever", "Only in BIOS"], 1],
  ["ca-27", "A virus in computing is a type of what?", ["Hardware fan", "Malicious software", "Good firewall", "Screen brightness"], 1],
  ["ca-28", "Which key combination often means ‘copy’ on many PCs?", ["Ctrl+C", "Alt+F4", "Win+L", "Shift+Tab"], 0],
  ["ca-29", "Screen resolution 1080p usually means how many vertical pixels?", ["480", "720", "1080", "2160"], 2],
  ["ca-30", "USB-C is mainly a type of what?", ["Cooking oil", "Connector / port standard", "Video game genre", "Car fuel"], 1],
  ["ca-31", "Which company makes iPhone hardware?", ["Samsung", "Apple", "Nokia only", "Sony only"], 1],
  ["ca-32", "Dark mode in apps mainly does what?", ["Increases blue light always", "Uses darker UI colours", "Deletes files", "Speeds up CPU always"], 1],
  ["ca-33", "A spreadsheet cell is identified by what?", ["Only colour", "Column letter + row number", "Only smell", "Only weight"], 1],
  ["ca-34", "Which of these is an open-source browser engine family?", ["DirectX", "Chromium/Blink lineage", "Only Flash", "Only COBOL"], 1],
  ["ca-35", "Email ‘CC’ means what?", ["Closed caption", "Carbon copy", "Cash card", "Core code"], 1],
  ["ca-36", "BCC in email hides recipients from whom?", ["From self", "From other BCC recipients typically", "From server", "From subject"], 1],
  ["ca-37", "A firewall primarily filters what?", ["Water", "Network traffic", "Sound waves", "Cooking heat"], 1],
  ["ca-38", "Which protocol is common for secure web browsing?", ["FTP only", "HTTPS", "Telnet only", "Morris code"], 1],
  ["ca-39", "NFC in phones is often used for what?", ["Only satellite TV", "Tap payments and tags", "Only welding", "Only farming"], 1],
  ["ca-40", "Machine learning is a subfield of what broader area?", ["Only carpentry", "Artificial intelligence", "Only geology", "Only sailing"], 1],
  ["ca-41", "A GPU accelerates mainly what workloads?", ["Cooking", "Graphics and parallel compute", "Typing only", "Paper printing only"], 1],
  ["ca-42", "Which company owns Instagram?", ["Google", "Meta", "Twitter", "Amazon"], 1],
  ["ca-43", "OpenAI’s ChatGPT is an example of what?", ["Spreadsheet", "Large language model assistant", "Video editor", "Database only"], 1],
  ["ca-44", "Which of these is a version control system?", ["Photoshop", "Git", "Excel", "PowerPoint"], 1],
  ["ca-45", "Docker is mainly used to package what?", ["Food", "Apps in containers", "Music albums", "Shoes"], 1],
  ["ca-46", "Linux is an example of what?", ["Only hardware", "Open-source kernel / OS family", "Only phone brand", "Only car"], 1],
  ["ca-47", "Which language often runs in browsers alongside HTML/CSS?", ["COBOL only", "JavaScript", "Punch cards only", "Latin only"], 1],
  ["ca-48", "A CAPTCHA tests that the user is likely what?", ["A chef", "Human (not a simple bot)", "A pilot", "A fish"], 1],
  ["ca-49", "Biometrics login may use what?", ["Only password on paper", "Fingerprint or face", "Only astrology", "Only shoe size"], 1],
  ["ca-50", "Which company makes Windows OS?", ["Apple", "Microsoft", "Adobe", "Oracle"], 1],
  ["ca-51", "A URL’s domain name is found where?", ["Only in trash", "After protocol in web address", "Only in RAM brand", "Only on TV antenna"], 1],
  ["ca-52", "SSD storage is usually faster than what older tech?", ["RAM", "HDD mechanical drives", "CPU cache", "GPU"], 1],
  ["ca-53", "Which port number is default for HTTPS?", ["21", "80", "443", "8080"], 2],
  ["ca-54", "End-to-end encrypted chat means messages are readable by whom?", ["Everyone on internet", "Only participating users ideally", "Only hackers", "Only printer"], 1],
];

function emitRow(id, cat, text, opts, ci) {
  return `  {\n    id: "${id}",\n    category: "${cat}",\n    text: ${JSON.stringify(text)},\n    options: ${JSON.stringify(opts)},\n    correctIndex: ${ci},\n  }`;
}

const footballRows = football.map((r) => emitRow(r[0], "football", r[1], r[2], r[3]));
const nollyRows = nollywood.map((r) => emitRow(r[0], "nollywood", r[1], r[2], r[3]));
const histRows = history.map((r) => emitRow(r[0], "nigerian_history", r[1], r[2], r[3]));
const musicRows = music.map((r) => emitRow(r[0], "afrobeats", r[1], r[2], r[3]));
const currRows = current.map((r) => emitRow(r[0], "current_affairs", r[1], r[2], r[3]));

const all = [...footballRows, ...nollyRows, ...histRows, ...musicRows, ...currRows].join(",\n");

const header = `import type { Question } from "@/lib/types";

/** Bulk pool: +200 questions (script-generated). */
export const QUESTIONS_EXTRA_200: Question[] = [
`;

const footer = `
];
`;

fs.writeFileSync(out, header + all + footer, "utf8");
console.log("Wrote", out, "count lines ~", all.split("\n").length);
