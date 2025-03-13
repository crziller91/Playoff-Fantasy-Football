import { Player } from "../types";

export const initialPlayers: Player[] = [
  { id: 1, name: "Josh Allen", position: "QB" }, // Bills - Elite rushing/passing combo
  { id: 2, name: "Lamar Jackson", position: "QB" }, // Ravens - Dual-threat superstar
  { id: 3, name: "Jalen Hurts", position: "QB" }, // Eagles - High TD ceiling
  { id: 4, name: "Patrick Mahomes", position: "QB" }, // Chiefs - Consistent QB1
  { id: 5, name: "Saquon Barkley", position: "RB" }, // Eagles - Top RB with massive volume
  { id: 6, name: "Jayden Daniels", position: "QB" }, // Commanders - Rising dual-threat
  { id: 7, name: "Jahmyr Gibbs", position: "RB" }, // Lions - Explosive RB with receiving upside
  { id: 8, name: "Justin Jefferson", position: "WR" }, // Vikings - WR1 with huge target share
  { id: 9, name: "Derrick Henry", position: "RB" }, // Ravens - Goal-line dominance
  { id: 10, name: "A.J. Brown", position: "WR" }, // Eagles - Elite WR with big-play ability
  { id: 11, name: "Kyren Williams", position: "RB" }, // Rams - Workhorse in potent offense
  { id: 12, name: "Amon-Ra St. Brown", position: "WR" }, // Lions - PPR machine
  { id: 13, name: "C.J. Stroud", position: "QB" }, // Texans - High-volume passer
  { id: 14, name: "Puka Nacua", position: "WR" }, // Rams - Breakout star with WR1 upside
  { id: 15, name: "Joe Mixon", position: "RB" }, // Texans - Reliable RB1
  { id: 16, name: "Josh Jacobs", position: "RB" }, // Packers - Steady volume
  { id: 17, name: "Cooper Kupp", position: "WR" }, // Rams - Elite when healthy
  { id: 18, name: "James Cook", position: "RB" }, // Bills - Rising with receiving skills
  { id: 19, name: "Travis Kelce", position: "TE" }, // Chiefs - Top TE with Mahomes
  { id: 20, name: "Aaron Jones", position: "RB" }, // Vikings - Efficient veteran
  { id: 21, name: "Sam LaPorta", position: "TE" }, // Lions - Emerging TE1
  { id: 22, name: "David Montgomery", position: "RB" }, // Lions - TD-heavy complement
  { id: 23, name: "Justin Herbert", position: "QB" }, // Chargers - High floor QB
  { id: 24, name: "DeVonta Smith", position: "WR" }, // Eagles - Strong WR2
  { id: 25, name: "Nico Collins", position: "WR" }, // Texans - Breakout continues
  { id: 26, name: "Mike Evans", position: "WR" }, // Buccaneers - TD machine
  { id: 27, name: "Jordan Love", position: "QB" }, // Packers - Emerging QB1
  { id: 28, name: "Isiah Pacheco", position: "RB" }, // Chiefs - Key RB in Chiefs offense
  { id: 29, name: "Mark Andrews", position: "TE" }, // Ravens - TD upside with Jackson
  { id: 30, name: "Terry McLaurin", position: "WR" }, // Commanders - Daniels’ top target
  { id: 31, name: "Chris Godwin", position: "WR" }, // Buccaneers - PPR stud
  { id: 32, name: "Najee Harris", position: "RB" }, // Steelers - Volume-driven
  { id: 33, name: "Rachaad White", position: "RB" }, // Buccaneers - Pass-catching RB
  { id: 34, name: "Bo Nix", position: "QB" }, // Broncos - Rookie with upside
  { id: 35, name: "Jared Goff", position: "QB" }, // Lions - Reliable in high-octane offense
  { id: 36, name: "Brian Robinson Jr.", position: "RB" }, // Commanders - Goal-line role
  { id: 37, name: "Javonte Williams", position: "RB" }, // Broncos - Lead back
  { id: 38, name: "J.K. Dobbins", position: "RB" }, // Chargers - Explosive when healthy
  { id: 39, name: "Stefon Diggs", position: "WR" }, // Texans - Veteran with targets
  { id: 40, name: "Baker Mayfield", position: "QB" }, // Buccaneers - Underrated producer
  { id: 41, name: "George Pickens", position: "WR" }, // Steelers - Big-play threat
  { id: 42, name: "Matthew Stafford", position: "QB" }, // Rams - Veteran with elite WRs
  { id: 43, name: "Dalton Kincaid", position: "TE" }, // Bills - Growing role
  { id: 44, name: "Courtland Sutton", position: "WR" }, // Broncos - Primary target
  { id: 45, name: "Dallas Goedert", position: "TE" }, // Eagles - Solid TE option
  { id: 46, name: "Jordan Addison", position: "WR" }, // Vikings - WR2 with upside
  { id: 47, name: "T.J. Hockenson", position: "TE" }, // Vikings - High-end TE when healthy
  { id: 48, name: "Christian Watson", position: "WR" }, // Packers - Deep threat
  { id: 49, name: "Jameson Williams", position: "WR" }, // Lions - Emerging speedster
  { id: 50, name: "Khalil Shakir", position: "WR" }, // Bills - Slot producer
  { id: 51, name: "Jaylen Warren", position: "RB" }, // Steelers - Receiving complement
  { id: 52, name: "Bucky Irving", position: "RB" }, // Buccaneers - Rookie with potential
  { id: 53, name: "Russell Wilson", position: "QB" }, // Steelers - Aging but viable
  { id: 54, name: "Tank Dell", position: "WR" }, // Texans - Explosive WR3
  { id: 55, name: "Pat Freiermuth", position: "TE" }, // Steelers - Steady TE
  { id: 56, name: "Keon Coleman", position: "WR" }, // Bills - Rookie with red-zone role
  { id: 57, name: "Sam Darnold", position: "QB" }, // Vikings - QB competition risk
  { id: 58, name: "Zay Flowers", position: "WR" }, // Ravens - Growing role
  { id: 59, name: "Ladd McConkey", position: "WR" }, // Chargers - Rookie breakout
  { id: 60, name: "Zach Ertz", position: "TE" }, // Commanders - Veteran target
  { id: 61, name: "Austin Ekeler", position: "RB" }, // Commanders - Receiving back
  { id: 62, name: "Cade Otton", position: "TE" }, // Buccaneers - Emerging TE
  { id: 63, name: "Xavier Worthy", position: "WR" }, // Chiefs - Speedy rookie
  { id: 64, name: "Ray Davis", position: "RB" }, // Bills - Backup with upside
  { id: 65, name: "Marquise Brown", position: "WR" }, // Chiefs - Deep threat
  { id: 66, name: "DeAndre Hopkins", position: "WR" }, // Chiefs - Veteran addition
  { id: 67, name: "Romeo Doubs", position: "WR" }, // Packers - Consistent WR2
  { id: 68, name: "Blake Corum", position: "RB" }, // Rams - Backup to Williams
  { id: 69, name: "Dawson Knox", position: "TE" }, // Bills - TD-dependent
  { id: 70, name: "Jaleel McLaughlin", position: "RB" }, // Broncos - Change-of-pace
  { id: 71, name: "Rashod Bateman", position: "WR" }, // Ravens - WR2 potential
  { id: 72, name: "Curtis Samuel", position: "WR" }, // Bills - Versatile option
  { id: 73, name: "Justice Hill", position: "RB" }, // Ravens - Receiving back
  { id: 74, name: "Jayden Reed", position: "WR" }, // Packers - Slot producer
  { id: 75, name: "Noah Brown", position: "WR" }, // Commanders - Reliable depth
  { id: 76, name: "Gus Edwards", position: "RB" }, // Chargers - Goal-line role
  { id: 77, name: "Quentin Johnston", position: "WR" }, // Chargers - Developing WR
  { id: 78, name: "Kenneth Gainwell", position: "RB" }, // Eagles - Backup with catches
  { id: 79, name: "Tyler Badie", position: "RB" }, // Broncos - Depth option
  { id: 80, name: "Josh Palmer", position: "WR" }, // Chargers - WR3 with upside
  { id: 81, name: "Clyde Edwards-Helaire", position: "RB" }, // Chiefs - Depth RB
  { id: 82, name: "Will Dissly", position: "TE" }, // Chargers - Blocking TE with catches
  { id: 83, name: "Jahan Dotson", position: "WR" }, // Eagles - Depth WR
  { id: 84, name: "Dameon Pierce", position: "RB" }, // Texans - Backup RB
  { id: 85, name: "Eagles DST", position: "DST" }, // Eagles - Top-tier defense
  { id: 86, name: "Ravens DST", position: "DST" }, // Ravens - Elite unit
  { id: 87, name: "Steelers DST", position: "DST" }, // Steelers - Strong pass rush
  { id: 88, name: "Chiefs DST", position: "DST" }, // Chiefs - Turnover creators
  { id: 89, name: "Lions DST", position: "DST" }, // Lions - Improving defense
  { id: 90, name: "Mecole Hardman", position: "WR" }, // Chiefs - Speed option
  { id: 91, name: "Kareem Hunt", position: "RB" }, // Chiefs - Veteran depth
  { id: 92, name: "Isaiah Likely", position: "TE" }, // Ravens - Backup with upside
  { id: 93, name: "Tim Patrick", position: "WR" }, // Lions - Veteran contributor
  { id: 94, name: "Demarcus Robinson", position: "WR" }, // Rams - WR3 with targets
  { id: 95, name: "JuJu Smith-Schuster", position: "WR" }, // Chiefs - Slot depth
  { id: 96, name: "Bills DST", position: "DST" }, // Bills - Solid unit
  { id: 97, name: "Broncos DST", position: "DST" }, // Broncos - Defensive strength
  { id: 98, name: "Troy Franklin", position: "WR" }, // Broncos - Rookie potential
  { id: 99, name: "Van Jefferson", position: "WR" }, // Steelers - Depth WR
  { id: 100, name: "Nelson Agholor", position: "WR" }, // Ravens - Veteran depth
  { id: 101, name: "Keaton Mitchell", position: "RB" }, // Ravens - Speedy backup
  { id: 102, name: "Craig Reynolds", position: "RB" }, // Lions - Depth RB
  { id: 103, name: "Kimani Vidal", position: "RB" }, // Chargers - Rookie depth
  { id: 104, name: "Tyler Johnson", position: "WR" }, // Rams - Depth option
  { id: 105, name: "Emanuel Wilson", position: "RB" }, // Packers - Backup RB
  { id: 106, name: "Cordarrelle Patterson", position: "RB" }, // Steelers - Utility player
  { id: 107, name: "Sean Tucker", position: "RB" }, // Buccaneers - Depth RB
  { id: 108, name: "Cam Akers", position: "RB" }, // Vikings - Backup RB
  { id: 109, name: "Ronnie Rivers", position: "RB" }, // Rams - Depth RB
  { id: 110, name: "Will Shipley", position: "RB" }, // Eagles - Rookie backup
  { id: 111, name: "Dare Ogunbowale", position: "RB" }, // Texans - Receiving depth
  { id: 112, name: "Dontayvion Wicks", position: "WR" }, // Packers - Depth WR
  { id: 113, name: "Marvin Mims Jr.", position: "WR" }, // Broncos - Speed option
  { id: 114, name: "Jalen McMillan", position: "WR" }, // Buccaneers - Rookie depth
  { id: 115, name: "Johnny Wilson", position: "WR" }, // Eagles - Tall rookie
  { id: 116, name: "Dyami Brown", position: "WR" }, // Commanders - Depth WR
  { id: 117, name: "Greg Dulcich", position: "TE" }, // Broncos - Pass-catching TE
  { id: 118, name: "Packers DST", position: "DST" }, // Packers - Improving unit
  { id: 119, name: "Commanders DST", position: "DST" }, // Commanders - Solid defense
  { id: 120, name: "Buccaneers DST", position: "DST" }, // Buccaneers - Turnover potential
  { id: 121, name: "Vikings DST", position: "DST" }, // Vikings - Aggressive defense
  { id: 122, name: "Texans DST", position: "DST" }, // Texans - Young talent
  { id: 123, name: "Chargers DST", position: "DST" }, // Chargers - Defensive upside
  { id: 124, name: "Rams DST", position: "DST" }, // Rams - Inconsistent but capable
  { id: 125, name: "Justin Tucker", position: "K" }, // Ravens - Elite kicker
  { id: 126, name: "Harrison Butker", position: "K" }, // Chiefs - High-scoring offense
  { id: 127, name: "Jake Elliott", position: "K" }, // Eagles - Reliable in potent offense
  { id: 128, name: "Chris Boswell", position: "K" }, // Steelers - Consistent veteran
  { id: 129, name: "Tyler Bass", position: "K" }, // Bills - Strong leg, good offense
  { id: 130, name: "Ka'imi Fairbairn", position: "K" }, // Texans - High accuracy
  { id: 131, name: "Cameron Dicker", position: "K" }, // Chargers - Rising kicker
  { id: 132, name: "Joshua Karty", position: "K" }, // Rams - Rookie in good offense
  { id: 133, name: "Chase McLaughlin", position: "K" }, // Buccaneers - Solid performer
  { id: 134, name: "Jake Bates", position: "K" }, // Lions - Emerging talent
  { id: 135, name: "Will Reichard", position: "K" }, // Vikings - Rookie with upside
  { id: 136, name: "Wil Lutz", position: "K" }, // Broncos - Veteran reliability
  { id: 137, name: "Austin Seibert", position: "K" }, // Commanders - Steady option
  { id: 138, name: "Brayden Narveson", position: "K" }, // Packers - Rookie kicker
  { id: 139, name: "Luke McCaffrey", position: "WR" }, // Commanders - Rookie depth
  { id: 140, name: "Kalif Raymond", position: "WR" }, // Lions - Depth WR
  { id: 141, name: "DJ Chark", position: "WR" }, // Chargers - Veteran depth
  { id: 142, name: "Devaughn Vele", position: "WR" }, // Broncos - Rookie depth
  { id: 143, name: "Jalen Nailor", position: "WR" }, // Vikings - Depth option
  { id: 144, name: "John Metchie III", position: "WR" }, // Texans - Developing WR
  { id: 145, name: "Sterling Shepard", position: "WR" }, // Buccaneers - Slot depth
  { id: 146, name: "Noah Gray", position: "TE" }, // Chiefs - Backup TE
  { id: 147, name: "Diontae Johnson", position: "WR" }, // Ravens - Depth WR
  { id: 148, name: "Hayden Hurst", position: "TE" }, // Chargers - Veteran TE
  { id: 149, name: "Calvin Austin III", position: "WR" }, // Steelers - Speed depth
  { id: 150, name: "Dalton Schultz", position: "TE" }, // Texans - Reliable TE
  { id: 151, name: "Jeremy McNichols", position: "RB" }, // Commanders - Depth RB
  { id: 152, name: "Mack Hollins", position: "WR" }, // Bills - Depth WR
  { id: 153, name: "Ty Johnson", position: "RB" }, // Bills - Depth RB
  { id: 154, name: "C.J. Ham", position: "RB" }, // Vikings - Fullback role
  { id: 155, name: "Robert Woods", position: "WR" }, // Texans - Veteran depth
  { id: 156, name: "Chris Brooks", position: "RB" }, // Packers - Depth RB
  { id: 157, name: "Trent Sherfield", position: "WR" }, // Vikings - Depth WR
  { id: 158, name: "Scotty Miller", position: "WR" }, // Steelers - Depth WR
  { id: 159, name: "Adam Trautman", position: "TE" }, // Broncos - Backup TE
  { id: 160, name: "Colby Parkinson", position: "TE" }, // Rams - Depth TE
  { id: 161, name: "Johnny Mundt", position: "TE" }, // Vikings - Backup TE
  { id: 162, name: "Darnell Washington", position: "TE" }, // Steelers - Blocking TE
  { id: 163, name: "Stone Smartt", position: "TE" }, // Chargers - Depth TE
  { id: 164, name: "Grant Calcaterra", position: "TE" }, // Eagles - Backup TE
  { id: 165, name: "Josh Oliver", position: "TE" }, // Vikings - Blocking TE
  { id: 166, name: "John Bates", position: "TE" }, // Commanders - Depth TE
  { id: 167, name: "Payne Durham", position: "TE" }, // Buccaneers - Backup TE
  { id: 168, name: "Charlie Kolar", position: "TE" }, // Ravens - Depth TE
  { id: 169, name: "Jared Wiley", position: "TE" }, // Chiefs - Rookie TE
  { id: 170, name: "Ko Kieft", position: "TE" }, // Buccaneers - Blocking TE
  { id: 171, name: "Davis Allen", position: "TE" }, // Rams - Depth TE
  { id: 172, name: "Ben Sinnott", position: "TE" }, // Commanders - Rookie TE
  { id: 173, name: "Lucas Krull", position: "TE" }, // Broncos - Depth TE
  { id: 174, name: "MyCole Pruitt", position: "TE" }, // Steelers - Veteran TE
  { id: 175, name: "Brock Wright", position: "TE" }, // Lions - Backup TE
  { id: 176, name: "Luke Musgrave", position: "TE" }, // Packers - Injury risk
  { id: 177, name: "Tucker Kraft", position: "TE" }, // Packers - Backup TE
  { id: 178, name: "Quintin Morris", position: "TE" }, // Bills - Depth TE
  { id: 179, name: "Hunter Long", position: "TE" }, // Rams - Depth TE
  { id: 180, name: "Shane Zylstra", position: "TE" }, // Lions - Depth TE
  { id: 181, name: "Jack Stoll", position: "TE" }, // Eagles - Blocking TE
  { id: 182, name: "Ben Sims", position: "TE" }, // Packers - Depth TE
  { id: 183, name: "Cade Stover", position: "TE" }, // Texans - Rookie TE
];
