import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Enhanced player data with team names
const playerData = [
    { id: 1, name: "Josh Allen", position: "QB", teamName: "Buffalo Bills" },
    { id: 2, name: "Lamar Jackson", position: "QB", teamName: "Baltimore Ravens" },
    { id: 3, name: "Jalen Hurts", position: "QB", teamName: "Philadelphia Eagles" },
    { id: 4, name: "Patrick Mahomes", position: "QB", teamName: "Kansas City Chiefs" },
    { id: 5, name: "Saquon Barkley", position: "RB", teamName: "Philadelphia Eagles" },
    { id: 6, name: "Jayden Daniels", position: "QB", teamName: "Washington Commanders" },
    { id: 7, name: "Jahmyr Gibbs", position: "RB", teamName: "Detroit Lions" },
    { id: 8, name: "Justin Jefferson", position: "WR", teamName: "Minnesota Vikings" },
    { id: 9, name: "Derrick Henry", position: "RB", teamName: "Baltimore Ravens" },
    { id: 10, name: "A.J. Brown", position: "WR", teamName: "Philadelphia Eagles" },
    { id: 11, name: "Kyren Williams", position: "RB", teamName: "Los Angeles Rams" },
    { id: 12, name: "Amon-Ra St. Brown", position: "WR", teamName: "Detroit Lions" },
    { id: 13, name: "C.J. Stroud", position: "QB", teamName: "Houston Texans" },
    { id: 14, name: "Puka Nacua", position: "WR", teamName: "Los Angeles Rams" },
    { id: 15, name: "Joe Mixon", position: "RB", teamName: "Houston Texans" },
    { id: 16, name: "Josh Jacobs", position: "RB", teamName: "Green Bay Packers" },
    { id: 17, name: "Cooper Kupp", position: "WR", teamName: "Los Angeles Rams" },
    { id: 18, name: "James Cook", position: "RB", teamName: "Buffalo Bills" },
    { id: 19, name: "Travis Kelce", position: "TE", teamName: "Kansas City Chiefs" },
    { id: 20, name: "Aaron Jones", position: "RB", teamName: "Minnesota Vikings" },
    { id: 21, name: "Sam LaPorta", position: "TE", teamName: "Detroit Lions" },
    { id: 22, name: "David Montgomery", position: "RB", teamName: "Detroit Lions" },
    { id: 23, name: "Justin Herbert", position: "QB", teamName: "Los Angeles Chargers" },
    { id: 24, name: "DeVonta Smith", position: "WR", teamName: "Philadelphia Eagles" },
    { id: 25, name: "Nico Collins", position: "WR", teamName: "Houston Texans" },
    { id: 26, name: "Mike Evans", position: "WR", teamName: "Tampa Bay Buccaneers" },
    { id: 27, name: "Jordan Love", position: "QB", teamName: "Green Bay Packers" },
    { id: 28, name: "Isiah Pacheco", position: "RB", teamName: "Kansas City Chiefs" },
    { id: 29, name: "Mark Andrews", position: "TE", teamName: "Baltimore Ravens" },
    { id: 30, name: "Terry McLaurin", position: "WR", teamName: "Washington Commanders" },
    { id: 31, name: "Chris Godwin", position: "WR", teamName: "Tampa Bay Buccaneers" },
    { id: 32, name: "Najee Harris", position: "RB", teamName: "Los Angeles Chargers" },
    { id: 33, name: "Rachaad White", position: "RB", teamName: "Tampa Bay Buccaneers" },
    { id: 34, name: "Bo Nix", position: "QB", teamName: "Denver Broncos" },
    { id: 35, name: "Jared Goff", position: "QB", teamName: "Detroit Lions" },
    { id: 36, name: "Brian Robinson Jr.", position: "RB", teamName: "Washington Commanders" },
    { id: 37, name: "Javonte Williams", position: "RB", teamName: "Dallas Cowboys" },
    { id: 38, name: "J.K. Dobbins", position: "RB", teamName: "Free Agent" },
    { id: 39, name: "Stefon Diggs", position: "WR", teamName: "Free Agent" },
    { id: 40, name: "Baker Mayfield", position: "QB", teamName: "Tampa Bay Buccaneers" },
    { id: 41, name: "George Pickens", position: "WR", teamName: "Pittsburgh Steelers" },
    { id: 42, name: "Matthew Stafford", position: "QB", teamName: "Los Angeles Rams" },
    { id: 43, name: "Dalton Kincaid", position: "TE", teamName: "Buffalo Bills" },
    { id: 44, name: "Courtland Sutton", position: "WR", teamName: "Denver Broncos" },
    { id: 45, name: "Dallas Goedert", position: "TE", teamName: "Philadelphia Eagles" },
    { id: 46, name: "Jordan Addison", position: "WR", teamName: "Minnesota Vikings" },
    { id: 47, name: "T.J. Hockenson", position: "TE", teamName: "Minnesota Vikings" },
    { id: 48, name: "Christian Watson", position: "WR", teamName: "Green Bay Packers" },
    { id: 49, name: "Jameson Williams", position: "WR", teamName: "Detroit Lions" },
    { id: 50, name: "Khalil Shakir", position: "WR", teamName: "Buffalo Bills" },
    { id: 51, name: "Jaylen Warren", position: "RB", teamName: "Pittsburgh Steelers" },
    { id: 52, name: "Bucky Irving", position: "RB", teamName: "Tampa Bay Buccaneers" },
    { id: 53, name: "Russell Wilson", position: "QB", teamName: "New York Giants" },
    { id: 54, name: "Tank Dell", position: "WR", teamName: "Houston Texans" },
    { id: 55, name: "Pat Freiermuth", position: "TE", teamName: "Pittsburgh Steelers" },
    { id: 56, name: "Keon Coleman", position: "WR", teamName: "Buffalo Bills" },
    { id: 57, name: "Sam Darnold", position: "QB", teamName: "Minnesota Vikings" },
    { id: 58, name: "Zay Flowers", position: "WR", teamName: "Baltimore Ravens" },
    { id: 59, name: "Ladd McConkey", position: "WR", teamName: "Los Angeles Chargers" },
    { id: 60, name: "Zach Ertz", position: "TE", teamName: "Washington Commanders" },
    { id: 61, name: "Austin Ekeler", position: "RB", teamName: "Washington Commanders" },
    { id: 62, name: "Cade Otton", position: "TE", teamName: "Tampa Bay Buccaneers" },
    { id: 63, name: "Xavier Worthy", position: "WR", teamName: "Kansas City Chiefs" },
    { id: 64, name: "Ray Davis", position: "RB", teamName: "Buffalo Bills" },
    { id: 65, name: "Marquise Brown", position: "WR", teamName: "Kansas City Chiefs" },
    { id: 66, name: "DeAndre Hopkins", position: "WR", teamName: "Baltimore Ravens" },
    { id: 67, name: "Romeo Doubs", position: "WR", teamName: "Green Bay Packers" },
    { id: 68, name: "Blake Corum", position: "RB", teamName: "Los Angeles Rams" },
    { id: 69, name: "Dawson Knox", position: "TE", teamName: "Buffalo Bills" },
    { id: 70, name: "Jaleel McLaughlin", position: "RB", teamName: "Denver Broncos" },
    { id: 71, name: "Rashod Bateman", position: "WR", teamName: "Baltimore Ravens" },
    { id: 72, name: "Curtis Samuel", position: "WR", teamName: "Pittsburgh Steelers" },
    { id: 73, name: "Justice Hill", position: "RB", teamName: "Baltimore Ravens" },
    { id: 74, name: "Jayden Reed", position: "WR", teamName: "Green Bay Packers" },
    { id: 75, name: "Noah Brown", position: "WR", teamName: "Houston Texans" },
    { id: 76, name: "Gus Edwards", position: "RB", teamName: "Los Angeles Chargers" },
    { id: 77, name: "Quentin Johnston", position: "WR", teamName: "Los Angeles Chargers" },
    { id: 78, name: "Kenneth Gainwell", position: "RB", teamName: "Philadelphia Eagles" },
    { id: 79, name: "Tyler Badie", position: "RB", teamName: "Denver Broncos" },
    { id: 80, name: "Josh Palmer", position: "WR", teamName: "Los Angeles Chargers" },
    { id: 81, name: "Clyde Edwards-Helaire", position: "RB", teamName: "Kansas City Chiefs" },
    { id: 82, name: "Will Dissly", position: "TE", teamName: "Los Angeles Chargers" },
    { id: 83, name: "Jahan Dotson", position: "WR", teamName: "Philadelphia Eagles" },
    { id: 84, name: "Dameon Pierce", position: "RB", teamName: "Houston Texans" },
    { id: 85, name: "Eagles DST", position: "DST", teamName: "Philadelphia Eagles" },
    { id: 86, name: "Ravens DST", position: "DST", teamName: "Baltimore Ravens" },
    { id: 87, name: "Steelers DST", position: "DST", teamName: "Pittsburgh Steelers" },
    { id: 88, name: "Chiefs DST", position: "DST", teamName: "Kansas City Chiefs" },
    { id: 89, name: "Lions DST", position: "DST", teamName: "Detroit Lions" },
    { id: 90, name: "Mecole Hardman", position: "WR", teamName: "Kansas City Chiefs" },
    { id: 91, name: "Kareem Hunt", position: "RB", teamName: "Kansas City Chiefs" },
    { id: 92, name: "Isaiah Likely", position: "TE", teamName: "Baltimore Ravens" },
    { id: 93, name: "Tim Patrick", position: "WR", teamName: "Detroit Lions" },
    { id: 94, name: "Demarcus Robinson", position: "WR", teamName: "Los Angeles Rams" },
    { id: 95, name: "JuJu Smith-Schuster", position: "WR", teamName: "Kansas City Chiefs" },
    { id: 96, name: "Bills DST", position: "DST", teamName: "Buffalo Bills" },
    { id: 97, name: "Broncos DST", position: "DST", teamName: "Denver Broncos" },
    { id: 98, name: "Troy Franklin", position: "WR", teamName: "Denver Broncos" },
    { id: 99, name: "Van Jefferson", position: "WR", teamName: "Atlanta Falcons" },
    { id: 100, name: "Nelson Agholor", position: "WR", teamName: "Baltimore Ravens" },
    { id: 101, name: "Keaton Mitchell", position: "RB", teamName: "Baltimore Ravens" },
    { id: 102, name: "Craig Reynolds", position: "RB", teamName: "Detroit Lions" },
    { id: 103, name: "Kimani Vidal", position: "RB", teamName: "Los Angeles Chargers" },
    { id: 104, name: "Tyler Johnson", position: "WR", teamName: "Los Angeles Rams" },
    { id: 105, name: "Emanuel Wilson", position: "RB", teamName: "Green Bay Packers" },
    { id: 106, name: "Cordarrelle Patterson", position: "RB", teamName: "Pittsburgh Steelers" },
    { id: 107, name: "Sean Tucker", position: "RB", teamName: "Tampa Bay Buccaneers" },
    { id: 108, name: "Cam Akers", position: "RB", teamName: "Houston Texans" },
    { id: 109, name: "Ronnie Rivers", position: "RB", teamName: "Los Angeles Rams" },
    { id: 110, name: "Will Shipley", position: "RB", teamName: "Philadelphia Eagles" },
    { id: 111, name: "Dare Ogunbowale", position: "RB", teamName: "Houston Texans" },
    { id: 112, name: "Dontayvion Wicks", position: "WR", teamName: "Green Bay Packers" },
    { id: 113, name: "Marvin Mims Jr.", position: "WR", teamName: "Denver Broncos" },
    { id: 114, name: "Jalen McMillan", position: "WR", teamName: "Tampa Bay Buccaneers" },
    { id: 115, name: "Johnny Wilson", position: "WR", teamName: "Pittsburgh Steelers" },
    { id: 116, name: "Dyami Brown", position: "WR", teamName: "Washington Commanders" },
    { id: 117, name: "Greg Dulcich", position: "TE", teamName: "Denver Broncos" },
    { id: 118, name: "Packers DST", position: "DST", teamName: "Green Bay Packers" },
    { id: 119, name: "Commanders DST", position: "DST", teamName: "Washington Commanders" },
    { id: 120, name: "Buccaneers DST", position: "DST", teamName: "Tampa Bay Buccaneers" },
    { id: 121, name: "Vikings DST", position: "DST", teamName: "Minnesota Vikings" },
    { id: 122, name: "Texans DST", position: "DST", teamName: "Houston Texans" },
    { id: 123, name: "Chargers DST", position: "DST", teamName: "Los Angeles Chargers" },
    { id: 124, name: "Rams DST", position: "DST", teamName: "Los Angeles Rams" },
    { id: 125, name: "Justin Tucker", position: "K", teamName: "Baltimore Ravens" },
    { id: 126, name: "Harrison Butker", position: "K", teamName: "Kansas City Chiefs" },
    { id: 127, name: "Jake Elliott", position: "K", teamName: "Philadelphia Eagles" },
    { id: 128, name: "Chris Boswell", position: "K", teamName: "Pittsburgh Steelers" },
    { id: 129, name: "Tyler Bass", position: "K", teamName: "Buffalo Bills" },
    { id: 130, name: "Ka'imi Fairbairn", position: "K", teamName: "Houston Texans" },
    { id: 131, name: "Cameron Dicker", position: "K", teamName: "Los Angeles Chargers" },
    { id: 132, name: "Joshua Karty", position: "K", teamName: "Green Bay Packers" },
    { id: 133, name: "Chase McLaughlin", position: "K", teamName: "Tampa Bay Buccaneers" },
    { id: 134, name: "Jake Bates", position: "K", teamName: "Detroit Lions" },
    { id: 135, name: "Will Reichard", position: "K", teamName: "Minnesota Vikings" },
    { id: 136, name: "Wil Lutz", position: "K", teamName: "Denver Broncos" },
    { id: 137, name: "Austin Seibert", position: "K", teamName: "Washington Commanders" },
    { id: 138, name: "Brayden Narveson", position: "K", teamName: "Los Angeles Rams" },
    { id: 139, name: "Luke McCaffrey", position: "WR", teamName: "Washington Commanders" },
    { id: 140, name: "Kalif Raymond", position: "WR", teamName: "Detroit Lions" },
    { id: 141, name: "DJ Chark", position: "WR", teamName: "San Francisco 49ers" },
    { id: 142, name: "Devaughn Vele", position: "WR", teamName: "New England Patriots" },
    { id: 143, name: "Jalen Nailor", position: "WR", teamName: "Minnesota Vikings" },
    { id: 144, name: "John Metchie III", position: "WR", teamName: "Houston Texans" },
    { id: 145, name: "Sterling Shepard", position: "WR", teamName: "Tampa Bay Buccaneers" },
    { id: 146, name: "Noah Gray", position: "TE", teamName: "Kansas City Chiefs" },
    { id: 147, name: "Diontae Johnson", position: "WR", teamName: "Free Agent" },
    { id: 148, name: "Hayden Hurst", position: "TE", teamName: "Los Angeles Chargers" },
    { id: 149, name: "Calvin Austin III", position: "WR", teamName: "Pittsburgh Steelers" },
    { id: 150, name: "Dalton Schultz", position: "TE", teamName: "Houston Texans" },
    { id: 151, name: "Jeremy McNichols", position: "RB", teamName: "Washington Commanders" },
    { id: 152, name: "Mack Hollins", position: "WR", teamName: "Buffalo Bills" },
    { id: 153, name: "Ty Johnson", position: "RB", teamName: "Buffalo Bills" },
    { id: 154, name: "C.J. Ham", position: "RB", teamName: "Minnesota Vikings" },
    { id: 155, name: "Robert Woods", position: "WR", teamName: "Houston Texans" },
    { id: 156, name: "Chris Brooks", position: "RB", teamName: "Miami Dolphins" },
    { id: 157, name: "Trent Sherfield", position: "WR", teamName: "Buffalo Bills" },
    { id: 158, name: "Scotty Miller", position: "WR", teamName: "Atlanta Falcons" },
    { id: 159, name: "Adam Trautman", position: "TE", teamName: "Denver Broncos" },
    { id: 160, name: "Colby Parkinson", position: "TE", teamName: "Los Angeles Rams" },
    { id: 161, name: "Johnny Mundt", position: "TE", teamName: "Minnesota Vikings" },
    { id: 162, name: "Darnell Washington", position: "TE", teamName: "Pittsburgh Steelers" },
    { id: 163, name: "Stone Smartt", position: "TE", teamName: "Los Angeles Chargers" },
    { id: 164, name: "Grant Calcaterra", position: "TE", teamName: "Philadelphia Eagles" },
    { id: 165, name: "Josh Oliver", position: "TE", teamName: "Minnesota Vikings" },
    { id: 166, name: "John Bates", position: "TE", teamName: "Washington Commanders" },
    { id: 167, name: "Payne Durham", position: "TE", teamName: "Tampa Bay Buccaneers" },
    { id: 168, name: "Charlie Kolar", position: "TE", teamName: "Baltimore Ravens" },
    { id: 169, name: "Jared Wiley", position: "TE", teamName: "Los Angeles Chargers" },
    { id: 170, name: "Ko Kieft", position: "TE", teamName: "Tampa Bay Buccaneers" },
    { id: 171, name: "Davis Allen", position: "TE", teamName: "Los Angeles Rams" },
    { id: 172, name: "Ben Sinnott", position: "TE", teamName: "Washington Commanders" },
    { id: 173, name: "Lucas Krull", position: "TE", teamName: "Denver Broncos" },
    { id: 174, name: "MyCole Pruitt", position: "TE", teamName: "Atlanta Falcons" },
    { id: 175, name: "Brock Wright", position: "TE", teamName: "Detroit Lions" },
    { id: 176, name: "Luke Musgrave", position: "TE", teamName: "Green Bay Packers" },
    { id: 177, name: "Tucker Kraft", position: "TE", teamName: "Green Bay Packers" },
    { id: 178, name: "Quintin Morris", position: "TE", teamName: "Buffalo Bills" },
    { id: 179, name: "Hunter Long", position: "TE", teamName: "Los Angeles Rams" },
    { id: 180, name: "Shane Zylstra", position: "TE", teamName: "Detroit Lions" },
    { id: 181, name: "Jack Stoll", position: "TE", teamName: "New York Giants" },
    { id: 182, name: "Ben Sims", position: "TE", teamName: "Green Bay Packers" },
    { id: 183, name: "Cade Stover", position: "TE", teamName: "Cleveland Browns" },
]

const teamNames = [
    "Christian",
    "Peter",
    "Sill",
    "Dougie"
]

async function seedDatabase() {
    console.log("Start seeding...");

    try {
        // Clean existing data
        console.log("Cleaning existing data...");
        await prisma.draftPick.deleteMany();
        await prisma.player.deleteMany();
        await prisma.team.deleteMany();
        await prisma.draftStatus.deleteMany();

        // Seed players
        console.log(`Creating ${playerData.length} players...`);
        await prisma.player.createMany({
            data: playerData.map((player) => ({
                id: player.id,
                name: player.name,
                position: player.position,
                teamName: player.teamName,
            })),
        });
        console.log(`Created ${playerData.length} players`);

        // Seed teams with budget
        console.log(`Creating ${teamNames.length} teams...`);
        await prisma.team.createMany({
            data: teamNames.map((name) => ({ 
                name,
                budget: 200 // Initialize each team with a budget of $200
            })),
        });
        console.log(`Created ${teamNames.length} teams with $200 budget each`);

        // Initialize draft status
        console.log("Initializing draft status...");
        await prisma.draftStatus.create({
            data: {
                isDraftFinished: false
            }
        });
        console.log("Draft status initialized");

        console.log("Seeding finished.");
    } catch (error) {
        console.error("Error during seeding:", error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

seedDatabase().catch(async (e) => {
    console.error("Seeding failed:", e);
    await prisma.$disconnect();
    process.exit(1);
});