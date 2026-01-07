import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 2025-26 NFL Playoff Teams Roster Data - Ranked by ESPN Fantasy Value (Best to Worst)
const playerData = [
    // Elite Tier (Ranks 1-10)
    { id: 1, name: "Josh Allen", position: "QB", teamName: "Buffalo Bills" },
    { id: 2, name: "Jalen Hurts", position: "QB", teamName: "Philadelphia Eagles" },
    { id: 3, name: "Saquon Barkley", position: "RB", teamName: "Philadelphia Eagles" },
    { id: 4, name: "Christian McCaffrey", position: "RB", teamName: "San Francisco 49ers" },
    { id: 5, name: "Puka Nacua", position: "WR", teamName: "Los Angeles Rams" },
    { id: 6, name: "Brian Thomas Jr.", position: "WR", teamName: "Jacksonville Jaguars" },
    { id: 7, name: "Nico Collins", position: "WR", teamName: "Houston Texans" },
    { id: 8, name: "A.J. Brown", position: "WR", teamName: "Philadelphia Eagles" },
    { id: 9, name: "Ladd McConkey", position: "WR", teamName: "Los Angeles Chargers" },
    { id: 10, name: "Jaxon Smith-Njigba", position: "WR", teamName: "Seattle Seahawks" },

    // High Value Players (Ranks 11-30)
    { id: 11, name: "Bo Nix", position: "QB", teamName: "Denver Broncos" },
    { id: 12, name: "C.J. Stroud", position: "QB", teamName: "Houston Texans" },
    { id: 13, name: "Justin Herbert", position: "QB", teamName: "Los Angeles Chargers" },
    { id: 14, name: "Drake Maye", position: "QB", teamName: "New England Patriots" },
    { id: 15, name: "Trevor Lawrence", position: "QB", teamName: "Jacksonville Jaguars" },
    { id: 16, name: "Sam Darnold", position: "QB", teamName: "Seattle Seahawks" },
    { id: 17, name: "Josh Jacobs", position: "RB", teamName: "Green Bay Packers" },
    { id: 18, name: "Kyren Williams", position: "RB", teamName: "Los Angeles Rams" },
    { id: 19, name: "James Cook III", position: "RB", teamName: "Buffalo Bills" },
    { id: 20, name: "Kenneth Walker III", position: "RB", teamName: "Seattle Seahawks" },
    { id: 21, name: "Omarion Hampton", position: "RB", teamName: "Los Angeles Chargers" },
    { id: 22, name: "TreVeyon Henderson", position: "RB", teamName: "New England Patriots" },
    { id: 23, name: "Courtland Sutton", position: "WR", teamName: "Denver Broncos" },
    { id: 24, name: "DK Metcalf", position: "WR", teamName: "Pittsburgh Steelers" },
    { id: 25, name: "Tetairoa McMillan", position: "WR", teamName: "Carolina Panthers" },
    { id: 26, name: "DJ Moore", position: "WR", teamName: "Chicago Bears" },
    { id: 27, name: "Davante Adams", position: "WR", teamName: "Los Angeles Rams" },
    { id: 28, name: "DeVonta Smith", position: "WR", teamName: "Philadelphia Eagles" },
    { id: 29, name: "Rome Odunze", position: "WR", teamName: "Chicago Bears" },
    { id: 30, name: "Stefon Diggs", position: "WR", teamName: "New England Patriots" },

    // Solid Starters (Ranks 31-60)
    { id: 31, name: "Matthew Golden", position: "WR", teamName: "Green Bay Packers" },
    { id: 32, name: "Khalil Shakir", position: "WR", teamName: "Buffalo Bills" },
    { id: 33, name: "Ricky Pearsall", position: "WR", teamName: "San Francisco 49ers" },
    { id: 34, name: "Marvin Mims Jr.", position: "WR", teamName: "Denver Broncos" },
    { id: 35, name: "Christian Kirk", position: "WR", teamName: "Houston Texans" },
    { id: 36, name: "Jayden Higgins", position: "WR", teamName: "Houston Texans" },
    { id: 37, name: "Keon Coleman", position: "WR", teamName: "Buffalo Bills" },
    { id: 38, name: "Jayden Reed", position: "WR", teamName: "Green Bay Packers" },
    { id: 39, name: "Keenan Allen", position: "WR", teamName: "Los Angeles Chargers" },
    { id: 40, name: "Luther Burden III", position: "WR", teamName: "Chicago Bears" },
    { id: 41, name: "Xavier Legette", position: "WR", teamName: "Carolina Panthers" },
    { id: 42, name: "Romeo Doubs", position: "WR", teamName: "Green Bay Packers" },
    { id: 43, name: "Joshua Palmer", position: "WR", teamName: "Buffalo Bills" },
    { id: 44, name: "Tre' Harris", position: "WR", teamName: "Los Angeles Chargers" },
    { id: 45, name: "George Kittle", position: "TE", teamName: "San Francisco 49ers" },
    { id: 46, name: "Evan Engram", position: "TE", teamName: "Denver Broncos" },
    { id: 47, name: "Tucker Kraft", position: "TE", teamName: "Green Bay Packers" },
    { id: 48, name: "Colston Loveland", position: "TE", teamName: "Chicago Bears" },
    { id: 49, name: "Dalton Kincaid", position: "TE", teamName: "Buffalo Bills" },
    { id: 50, name: "Dallas Goedert", position: "TE", teamName: "Philadelphia Eagles" },
    { id: 51, name: "Jonnu Smith", position: "TE", teamName: "Pittsburgh Steelers" },
    { id: 52, name: "Hunter Henry", position: "TE", teamName: "New England Patriots" },
    { id: 53, name: "Brenton Strange", position: "TE", teamName: "Jacksonville Jaguars" },
    { id: 54, name: "Brock Purdy", position: "QB", teamName: "San Francisco 49ers" },
    { id: 55, name: "Caleb Williams", position: "QB", teamName: "Chicago Bears" },
    { id: 56, name: "Jordan Love", position: "QB", teamName: "Green Bay Packers" },
    { id: 57, name: "Matthew Stafford", position: "QB", teamName: "Los Angeles Rams" },
    { id: 58, name: "Bryce Young", position: "QB", teamName: "Carolina Panthers" },
    { id: 59, name: "Aaron Rodgers", position: "QB", teamName: "Pittsburgh Steelers" },
    { id: 60, name: "RJ Harvey", position: "RB", teamName: "Denver Broncos" },

    // Mid-Tier Players (Ranks 61-100)
    { id: 61, name: "D'Andre Swift", position: "RB", teamName: "Chicago Bears" },
    { id: 62, name: "Chuba Hubbard", position: "RB", teamName: "Carolina Panthers" },
    { id: 63, name: "Jaylen Warren", position: "RB", teamName: "Pittsburgh Steelers" },
    { id: 64, name: "Travis Etienne Jr.", position: "RB", teamName: "Jacksonville Jaguars" },
    { id: 65, name: "Zach Charbonnet", position: "RB", teamName: "Seattle Seahawks" },
    { id: 66, name: "Rhamondre Stevenson", position: "RB", teamName: "New England Patriots" },
    { id: 67, name: "Brian Robinson Jr.", position: "RB", teamName: "San Francisco 49ers" },
    { id: 68, name: "Ray Davis", position: "RB", teamName: "Buffalo Bills" },
    { id: 69, name: "Tank Bigsby", position: "RB", teamName: "Philadelphia Eagles" },
    { id: 70, name: "Nick Chubb", position: "RB", teamName: "Houston Texans" },
    { id: 71, name: "Rico Dowdle", position: "RB", teamName: "Carolina Panthers" },
    { id: 72, name: "Bhayshul Tuten", position: "RB", teamName: "Jacksonville Jaguars" },
    { id: 73, name: "Blake Corum", position: "RB", teamName: "Los Angeles Rams" },
    { id: 74, name: "Kimani Vidal", position: "RB", teamName: "Los Angeles Chargers" },
    { id: 75, name: "Emanuel Wilson", position: "RB", teamName: "Green Bay Packers" },
    { id: 76, name: "Jaleel McLaughlin", position: "RB", teamName: "Denver Broncos" },
    { id: 77, name: "Troy Franklin", position: "WR", teamName: "Denver Broncos" },
    { id: 78, name: "Cooper Kupp", position: "WR", teamName: "Seattle Seahawks" },
    { id: 79, name: "Quentin Johnston", position: "WR", teamName: "Los Angeles Chargers" },
    { id: 80, name: "Christian Watson", position: "WR", teamName: "Green Bay Packers" },
    { id: 81, name: "DeMario Douglas", position: "WR", teamName: "New England Patriots" },
    { id: 82, name: "Jahan Dotson", position: "WR", teamName: "Philadelphia Eagles" },
    { id: 83, name: "Dontayvion Wicks", position: "WR", teamName: "Green Bay Packers" },
    { id: 84, name: "Jalen Coker", position: "WR", teamName: "Carolina Panthers" },
    { id: 85, name: "Tutu Atwell", position: "WR", teamName: "Los Angeles Rams" },
    { id: 86, name: "Dyami Brown", position: "WR", teamName: "Jacksonville Jaguars" },
    { id: 87, name: "Tim Patrick", position: "WR", teamName: "Jacksonville Jaguars" },
    { id: 88, name: "Jakobi Meyers", position: "WR", teamName: "Jacksonville Jaguars" },
    { id: 89, name: "Kendrick Bourne", position: "WR", teamName: "San Francisco 49ers" },
    { id: 90, name: "Brandin Cooks", position: "WR", teamName: "Buffalo Bills" },
    { id: 91, name: "Jake Bobo", position: "WR", teamName: "Seattle Seahawks" },
    { id: 92, name: "Rashid Shaheed", position: "WR", teamName: "Seattle Seahawks" },
    { id: 93, name: "Xavier Hutchinson", position: "WR", teamName: "Houston Texans" },
    { id: 94, name: "Calvin Austin III", position: "WR", teamName: "Pittsburgh Steelers" },
    { id: 95, name: "Marquez Valdes-Scantling", position: "WR", teamName: "Pittsburgh Steelers" },
    { id: 96, name: "Jimmy Horn Jr.", position: "WR", teamName: "Carolina Panthers" },
    { id: 97, name: "Olamide Zaccheaus", position: "WR", teamName: "Chicago Bears" },
    { id: 98, name: "Darius Cooper", position: "WR", teamName: "Philadelphia Eagles" },
    { id: 99, name: "Britain Covey", position: "WR", teamName: "Philadelphia Eagles" },
    { id: 100, name: "Skyy Moore", position: "WR", teamName: "San Francisco 49ers" },

    // Backup & Depth Players (Ranks 101-150)
    { id: 101, name: "Pat Freiermuth", position: "TE", teamName: "Pittsburgh Steelers" },
    { id: 102, name: "Cole Kmet", position: "TE", teamName: "Chicago Bears" },
    { id: 103, name: "Colby Parkinson", position: "TE", teamName: "Los Angeles Rams" },
    { id: 104, name: "Dalton Schultz", position: "TE", teamName: "Houston Texans" },
    { id: 105, name: "Dawson Knox", position: "TE", teamName: "Buffalo Bills" },
    { id: 106, name: "Luke Musgrave", position: "TE", teamName: "Green Bay Packers" },
    { id: 107, name: "Will Dissly", position: "TE", teamName: "Los Angeles Chargers" },
    { id: 108, name: "AJ Barner", position: "TE", teamName: "Seattle Seahawks" },
    { id: 109, name: "Adam Trautman", position: "TE", teamName: "Denver Broncos" },
    { id: 110, name: "Grant Calcaterra", position: "TE", teamName: "Philadelphia Eagles" },
    { id: 111, name: "Tommy Tremble", position: "TE", teamName: "Carolina Panthers" },
    { id: 112, name: "Tyler Conklin", position: "TE", teamName: "Los Angeles Chargers" },
    { id: 113, name: "Cameron Dicker", position: "K", teamName: "Los Angeles Chargers" },
    { id: 114, name: "Chris Boswell", position: "K", teamName: "Pittsburgh Steelers" },
    { id: 115, name: "Ka'imi Fairbairn", position: "K", teamName: "Houston Texans" },
    { id: 116, name: "Wil Lutz", position: "K", teamName: "Denver Broncos" },
    { id: 117, name: "Jake Elliott", position: "K", teamName: "Philadelphia Eagles" },
    { id: 118, name: "Matt Prater", position: "K", teamName: "Buffalo Bills" },
    { id: 119, name: "Mitchell Trubisky", position: "QB", teamName: "Buffalo Bills" },
    { id: 120, name: "Jarrett Stidham", position: "QB", teamName: "Denver Broncos" },
    { id: 121, name: "Joshua Dobbs", position: "QB", teamName: "New England Patriots" },
    { id: 122, name: "Mason Rudolph", position: "QB", teamName: "Pittsburgh Steelers" },
    { id: 123, name: "Davis Mills", position: "QB", teamName: "Houston Texans" },
    { id: 124, name: "Trey Lance", position: "QB", teamName: "Los Angeles Chargers" },
    { id: 125, name: "Drew Lock", position: "QB", teamName: "Seattle Seahawks" },
    { id: 126, name: "Tyson Bagent", position: "QB", teamName: "Chicago Bears" },
    { id: 127, name: "Tanner McKee", position: "QB", teamName: "Philadelphia Eagles" },
    { id: 128, name: "Andy Dalton", position: "QB", teamName: "Carolina Panthers" },
    { id: 129, name: "Jimmy Garoppolo", position: "QB", teamName: "Los Angeles Rams" },
    { id: 130, name: "Mac Jones", position: "QB", teamName: "San Francisco 49ers" },
    { id: 131, name: "Malik Willis", position: "QB", teamName: "Green Bay Packers" },
    { id: 132, name: "Nick Mullens", position: "QB", teamName: "Jacksonville Jaguars" },
    { id: 133, name: "Will Shipley", position: "RB", teamName: "Philadelphia Eagles" },
    { id: 134, name: "Kyle Monangai", position: "RB", teamName: "Chicago Bears" },
    { id: 135, name: "Ty Johnson", position: "RB", teamName: "Buffalo Bills" },
    { id: 136, name: "Trevor Etienne", position: "RB", teamName: "Carolina Panthers" },
    { id: 137, name: "Woody Marks", position: "RB", teamName: "Houston Texans" },
    { id: 138, name: "Tyler Badie", position: "RB", teamName: "Denver Broncos" },
    { id: 139, name: "Jordan James", position: "RB", teamName: "San Francisco 49ers" },
    { id: 140, name: "Isaac Guerendo", position: "RB", teamName: "San Francisco 49ers" },
    { id: 141, name: "Kenneth Gainwell", position: "RB", teamName: "Pittsburgh Steelers" },
    { id: 142, name: "LeQuint Allen Jr.", position: "RB", teamName: "Jacksonville Jaguars" },
    { id: 143, name: "Hassan Haskins", position: "RB", teamName: "Los Angeles Chargers" },
    { id: 144, name: "Ronnie Rivers", position: "RB", teamName: "Los Angeles Rams" },
    { id: 145, name: "Chris Brooks", position: "RB", teamName: "Green Bay Packers" },
    { id: 146, name: "D'Ernest Johnson", position: "RB", teamName: "New England Patriots" },
    { id: 147, name: "AJ Dillon", position: "RB", teamName: "Philadelphia Eagles" },
    { id: 148, name: "Jarquez Hunter", position: "RB", teamName: "Los Angeles Rams" },
    { id: 149, name: "Travis Homer", position: "RB", teamName: "Chicago Bears" },
    { id: 150, name: "Kaleb Johnson", position: "RB", teamName: "Pittsburgh Steelers" },

    // Deep Depth Players (Ranks 151-200)
    { id: 151, name: "Jawhar Jordan", position: "RB", teamName: "Houston Texans" },
    { id: 152, name: "DeeJay Dallas", position: "RB", teamName: "Jacksonville Jaguars" },
    { id: 153, name: "Jaret Patterson", position: "RB", teamName: "Los Angeles Chargers" },
    { id: 154, name: "Dare Ogunbowale", position: "RB", teamName: "Houston Texans" },
    { id: 155, name: "Parker Washington", position: "WR", teamName: "Jacksonville Jaguars" },
    { id: 156, name: "Roman Wilson", position: "WR", teamName: "Pittsburgh Steelers" },
    { id: 157, name: "Scotty Miller", position: "WR", teamName: "Pittsburgh Steelers" },
    { id: 158, name: "Jahdae Walker", position: "WR", teamName: "Chicago Bears" },
    { id: 159, name: "Devin Duvernay", position: "WR", teamName: "Chicago Bears" },
    { id: 160, name: "David Moore", position: "WR", teamName: "Carolina Panthers" },
    { id: 161, name: "Brycen Tremayne", position: "WR", teamName: "Carolina Panthers" },
    { id: 162, name: "Konata Mumpfield", position: "WR", teamName: "Los Angeles Rams" },
    { id: 163, name: "Dareke Young", position: "WR", teamName: "Seattle Seahawks" },
    { id: 164, name: "Tyrell Shavers", position: "WR", teamName: "Buffalo Bills" },
    { id: 165, name: "Gabe Davis", position: "WR", teamName: "Buffalo Bills" },
    { id: 166, name: "Derius Davis", position: "WR", teamName: "Los Angeles Chargers" },
    { id: 167, name: "KeAndre Lambert-Smith", position: "WR", teamName: "Los Angeles Chargers" },
    { id: 168, name: "Lil'Jordan Humphrey", position: "WR", teamName: "Denver Broncos" },
    { id: 169, name: "Pat Bryant", position: "WR", teamName: "Denver Broncos" },
    { id: 170, name: "Braxton Berrios", position: "WR", teamName: "Houston Texans" },
    { id: 171, name: "Jaylin Noel", position: "WR", teamName: "Houston Texans" },
    { id: 172, name: "Justin Watson", position: "WR", teamName: "Houston Texans" },
    { id: 173, name: "Kayshon Boutte", position: "WR", teamName: "New England Patriots" },
    { id: 174, name: "Efton Chism III", position: "WR", teamName: "New England Patriots" },
    { id: 175, name: "Jakobie Keeney-James", position: "WR", teamName: "Green Bay Packers" },
    { id: 176, name: "Connor Heyward", position: "TE", teamName: "Pittsburgh Steelers" },
    { id: 177, name: "Durham Smythe", position: "TE", teamName: "Chicago Bears" },
    { id: 178, name: "Kylen Granson", position: "TE", teamName: "Philadelphia Eagles" },
    { id: 179, name: "Cameron Latu", position: "TE", teamName: "Philadelphia Eagles" },
    { id: 180, name: "Mitchell Evans", position: "TE", teamName: "Carolina Panthers" },
    { id: 181, name: "James Mitchell", position: "TE", teamName: "Carolina Panthers" },
    { id: 182, name: "Tyler Higbee", position: "TE", teamName: "Los Angeles Rams" },
    { id: 183, name: "Terrance Ferguson", position: "TE", teamName: "Los Angeles Rams" },
    { id: 184, name: "Davis Allen", position: "TE", teamName: "Los Angeles Rams" },
    { id: 185, name: "Jake Tonges", position: "TE", teamName: "San Francisco 49ers" },
    { id: 186, name: "Luke Farrell", position: "TE", teamName: "San Francisco 49ers" },
    { id: 187, name: "Josh Whyle", position: "TE", teamName: "Green Bay Packers" },
    { id: 188, name: "Cade Stover", position: "TE", teamName: "Houston Texans" },
    { id: 189, name: "Harrison Bryant", position: "TE", teamName: "Houston Texans" },
    { id: 190, name: "Jackson Hawes", position: "TE", teamName: "Buffalo Bills" },
    { id: 191, name: "Keleki Latu", position: "TE", teamName: "Buffalo Bills" },
    { id: 192, name: "Scott Matlock", position: "TE", teamName: "Los Angeles Chargers" },
    { id: 193, name: "Eric Saubert", position: "TE", teamName: "Seattle Seahawks" },
    { id: 194, name: "Nick Kallerup", position: "TE", teamName: "Seattle Seahawks" },
    { id: 195, name: "Austin Hooper", position: "TE", teamName: "New England Patriots" },
    { id: 196, name: "CJ Dippre", position: "TE", teamName: "New England Patriots" },
    { id: 197, name: "Johnny Mundt", position: "TE", teamName: "Jacksonville Jaguars" },
    { id: 198, name: "Quintin Morris", position: "TE", teamName: "Jacksonville Jaguars" },
    { id: 199, name: "Hunter Long", position: "TE", teamName: "Jacksonville Jaguars" },
    { id: 200, name: "Nate Adkins", position: "TE", teamName: "Denver Broncos" },

    // Bottom Tier (Ranks 201-217)
    { id: 201, name: "Jason Myers", position: "K", teamName: "Seattle Seahawks" },
    { id: 202, name: "Cairo Santos", position: "K", teamName: "Chicago Bears" },
    { id: 203, name: "Ryan Fitzgerald", position: "K", teamName: "Carolina Panthers" },
    { id: 204, name: "Harrison Mevis", position: "K", teamName: "Los Angeles Rams" },
    { id: 205, name: "Eddy Pineiro", position: "K", teamName: "San Francisco 49ers" },
    { id: 206, name: "Brandon McManus", position: "K", teamName: "Green Bay Packers" },
    { id: 207, name: "Cam Little", position: "K", teamName: "Jacksonville Jaguars" },
    { id: 208, name: "Andy Borregales", position: "K", teamName: "New England Patriots" },
    { id: 209, name: "Maddux Trujillo", position: "K", teamName: "Buffalo Bills" },
    { id: 210, name: "Sam Ehlinger", position: "QB", teamName: "Denver Broncos" },
    { id: 211, name: "Tommy DeVito", position: "QB", teamName: "New England Patriots" },
    { id: 212, name: "Will Howard", position: "QB", teamName: "Pittsburgh Steelers" },
    { id: 213, name: "Graham Mertz", position: "QB", teamName: "Houston Texans" },
    { id: 214, name: "Jalen Milroe", position: "QB", teamName: "Seattle Seahawks" },
    { id: 215, name: "Case Keenum", position: "QB", teamName: "Chicago Bears" },
    { id: 216, name: "Sam Howell", position: "QB", teamName: "Philadelphia Eagles" },
    { id: 217, name: "Stetson Bennett IV", position: "QB", teamName: "Los Angeles Rams" },
]

const teamNames = [
    "Alan",
    "Peter",
    "JT",
    "Christian",
    "Connor",
    "Joe",
    "Victor",
    "Rohan",
    "Chris",
    "Vince",
    "Luis",
    "Hunter & Julie",
    "Victoria"
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
                budget: 100 // Initialize each team with a budget of $100
            })),
        });
        console.log(`Created ${teamNames.length} teams with $100 budget each`);

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
