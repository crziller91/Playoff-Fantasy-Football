import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Add complete player data from 1-183 (include all players from the original initialPlayers.ts file)
const playerData = [
    { id: 1, name: "Josh Allen", position: "QB" },
    { id: 2, name: "Lamar Jackson", position: "QB" },
    { id: 3, name: "Jalen Hurts", position: "QB" },
    { id: 4, name: "Patrick Mahomes", position: "QB" },
    { id: 5, name: "Saquon Barkley", position: "RB" },
    { id: 6, name: "Jayden Daniels", position: "QB" },
    { id: 7, name: "Jahmyr Gibbs", position: "RB" },
    { id: 8, name: "Justin Jefferson", position: "WR" },
    { id: 9, name: "Derrick Henry", position: "RB" },
    { id: 10, name: "A.J. Brown", position: "WR" },
    { id: 11, name: "Kyren Williams", position: "RB" },
    { id: 12, name: "Amon-Ra St. Brown", position: "WR" },
    { id: 13, name: "C.J. Stroud", position: "QB" },
    { id: 14, name: "Puka Nacua", position: "WR" },
    { id: 15, name: "Joe Mixon", position: "RB" },
    { id: 16, name: "Josh Jacobs", position: "RB" },
    { id: 17, name: "Cooper Kupp", position: "WR" },
    { id: 18, name: "James Cook", position: "RB" },
    { id: 19, name: "Travis Kelce", position: "TE" },
    { id: 20, name: "Aaron Jones", position: "RB" },
    { id: 21, name: "Sam LaPorta", position: "TE" },
    { id: 22, name: "David Montgomery", position: "RB" },
    { id: 23, name: "Justin Herbert", position: "QB" },
    { id: 24, name: "DeVonta Smith", position: "WR" },
    { id: 25, name: "Nico Collins", position: "WR" },
    { id: 26, name: "Mike Evans", position: "WR" },
    { id: 27, name: "Jordan Love", position: "QB" },
    { id: 28, name: "Isiah Pacheco", position: "RB" },
    { id: 29, name: "Mark Andrews", position: "TE" },
    { id: 30, name: "Terry McLaurin", position: "WR" },
    { id: 31, name: "Chris Godwin", position: "WR" },
    { id: 32, name: "Najee Harris", position: "RB" },
    { id: 33, name: "Rachaad White", position: "RB" },
    { id: 34, name: "Bo Nix", position: "QB" },
    { id: 35, name: "Jared Goff", position: "QB" },
    { id: 36, name: "Brian Robinson Jr.", position: "RB" },
    { id: 37, name: "Javonte Williams", position: "RB" },
    { id: 38, name: "J.K. Dobbins", position: "RB" },
    { id: 39, name: "Stefon Diggs", position: "WR" },
    { id: 40, name: "Baker Mayfield", position: "QB" },
    { id: 41, name: "George Pickens", position: "WR" },
    { id: 42, name: "Matthew Stafford", position: "QB" },
    { id: 43, name: "Dalton Kincaid", position: "TE" },
    { id: 44, name: "Courtland Sutton", position: "WR" },
    { id: 45, name: "Dallas Goedert", position: "TE" },
    { id: 46, name: "Jordan Addison", position: "WR" },
    { id: 47, name: "T.J. Hockenson", position: "TE" },
    { id: 48, name: "Christian Watson", position: "WR" },
    { id: 49, name: "Jameson Williams", position: "WR" },
    { id: 50, name: "Khalil Shakir", position: "WR" },
    { id: 51, name: "Jaylen Warren", position: "RB" },
    { id: 52, name: "Bucky Irving", position: "RB" },
    { id: 53, name: "Russell Wilson", position: "QB" },
    { id: 54, name: "Tank Dell", position: "WR" },
    { id: 55, name: "Pat Freiermuth", position: "TE" },
    { id: 56, name: "Keon Coleman", position: "WR" },
    { id: 57, name: "Sam Darnold", position: "QB" },
    { id: 58, name: "Zay Flowers", position: "WR" },
    { id: 59, name: "Ladd McConkey", position: "WR" },
    { id: 60, name: "Zach Ertz", position: "TE" },
    { id: 61, name: "Austin Ekeler", position: "RB" },
    { id: 62, name: "Cade Otton", position: "TE" },
    { id: 63, name: "Xavier Worthy", position: "WR" },
    { id: 64, name: "Ray Davis", position: "RB" },
    { id: 65, name: "Marquise Brown", position: "WR" },
    { id: 66, name: "DeAndre Hopkins", position: "WR" },
    { id: 67, name: "Romeo Doubs", position: "WR" },
    { id: 68, name: "Blake Corum", position: "RB" },
    { id: 69, name: "Dawson Knox", position: "TE" },
    { id: 70, name: "Jaleel McLaughlin", position: "RB" },
    { id: 71, name: "Rashod Bateman", position: "WR" },
    { id: 72, name: "Curtis Samuel", position: "WR" },
    { id: 73, name: "Justice Hill", position: "RB" },
    { id: 74, name: "Jayden Reed", position: "WR" },
    { id: 75, name: "Noah Brown", position: "WR" },
    { id: 76, name: "Gus Edwards", position: "RB" },
    { id: 77, name: "Quentin Johnston", position: "WR" },
    { id: 78, name: "Kenneth Gainwell", position: "RB" },
    { id: 79, name: "Tyler Badie", position: "RB" },
    { id: 80, name: "Josh Palmer", position: "WR" },
    { id: 81, name: "Clyde Edwards-Helaire", position: "RB" },
    { id: 82, name: "Will Dissly", position: "TE" },
    { id: 83, name: "Jahan Dotson", position: "WR" },
    { id: 84, name: "Dameon Pierce", position: "RB" },
    { id: 85, name: "Eagles DST", position: "DST" },
    { id: 86, name: "Ravens DST", position: "DST" },
    { id: 87, name: "Steelers DST", position: "DST" },
    { id: 88, name: "Chiefs DST", position: "DST" },
    { id: 89, name: "Lions DST", position: "DST" },
    { id: 90, name: "Mecole Hardman", position: "WR" },
    { id: 91, name: "Kareem Hunt", position: "RB" },
    { id: 92, name: "Isaiah Likely", position: "TE" },
    { id: 93, name: "Tim Patrick", position: "WR" },
    { id: 94, name: "Demarcus Robinson", position: "WR" },
    { id: 95, name: "JuJu Smith-Schuster", position: "WR" },
    { id: 96, name: "Bills DST", position: "DST" },
    { id: 97, name: "Broncos DST", position: "DST" },
    { id: 98, name: "Troy Franklin", position: "WR" },
    { id: 99, name: "Van Jefferson", position: "WR" },
    { id: 100, name: "Nelson Agholor", position: "WR" },
    { id: 101, name: "Keaton Mitchell", position: "RB" },
    { id: 102, name: "Craig Reynolds", position: "RB" },
    { id: 103, name: "Kimani Vidal", position: "RB" },
    { id: 104, name: "Tyler Johnson", position: "WR" },
    { id: 105, name: "Emanuel Wilson", position: "RB" },
    { id: 106, name: "Cordarrelle Patterson", position: "RB" },
    { id: 107, name: "Sean Tucker", position: "RB" },
    { id: 108, name: "Cam Akers", position: "RB" },
    { id: 109, name: "Ronnie Rivers", position: "RB" },
    { id: 110, name: "Will Shipley", position: "RB" },
    { id: 111, name: "Dare Ogunbowale", position: "RB" },
    { id: 112, name: "Dontayvion Wicks", position: "WR" },
    { id: 113, name: "Marvin Mims Jr.", position: "WR" },
    { id: 114, name: "Jalen McMillan", position: "WR" },
    { id: 115, name: "Johnny Wilson", position: "WR" },
    { id: 116, name: "Dyami Brown", position: "WR" },
    { id: 117, name: "Greg Dulcich", position: "TE" },
    { id: 118, name: "Packers DST", position: "DST" },
    { id: 119, name: "Commanders DST", position: "DST" },
    { id: 120, name: "Buccaneers DST", position: "DST" },
    { id: 121, name: "Vikings DST", position: "DST" },
    { id: 122, name: "Texans DST", position: "DST" },
    { id: 123, name: "Chargers DST", position: "DST" },
    { id: 124, name: "Rams DST", position: "DST" },
    { id: 125, name: "Justin Tucker", position: "K" },
    { id: 126, name: "Harrison Butker", position: "K" },
    { id: 127, name: "Jake Elliott", position: "K" },
    { id: 128, name: "Chris Boswell", position: "K" },
    { id: 129, name: "Tyler Bass", position: "K" },
    { id: 130, name: "Ka'imi Fairbairn", position: "K" },
    { id: 131, name: "Cameron Dicker", position: "K" },
    { id: 132, name: "Joshua Karty", position: "K" },
    { id: 133, name: "Chase McLaughlin", position: "K" },
    { id: 134, name: "Jake Bates", position: "K" },
    { id: 135, name: "Will Reichard", position: "K" },
    { id: 136, name: "Wil Lutz", position: "K" },
    { id: 137, name: "Austin Seibert", position: "K" },
    { id: 138, name: "Brayden Narveson", position: "K" },
    { id: 139, name: "Luke McCaffrey", position: "WR" },
    { id: 140, name: "Kalif Raymond", position: "WR" },
    { id: 141, name: "DJ Chark", position: "WR" },
    { id: 142, name: "Devaughn Vele", position: "WR" },
    { id: 143, name: "Jalen Nailor", position: "WR" },
    { id: 144, name: "John Metchie III", position: "WR" },
    { id: 145, name: "Sterling Shepard", position: "WR" },
    { id: 146, name: "Noah Gray", position: "TE" },
    { id: 147, name: "Diontae Johnson", position: "WR" },
    { id: 148, name: "Hayden Hurst", position: "TE" },
    { id: 149, name: "Calvin Austin III", position: "WR" },
    { id: 150, name: "Dalton Schultz", position: "TE" },
    { id: 151, name: "Jeremy McNichols", position: "RB" },
    { id: 152, name: "Mack Hollins", position: "WR" },
    { id: 153, name: "Ty Johnson", position: "RB" },
    { id: 154, name: "C.J. Ham", position: "RB" },
    { id: 155, name: "Robert Woods", position: "WR" },
    { id: 156, name: "Chris Brooks", position: "RB" },
    { id: 157, name: "Trent Sherfield", position: "WR" },
    { id: 158, name: "Scotty Miller", position: "WR" },
    { id: 159, name: "Adam Trautman", position: "TE" },
    { id: 160, name: "Colby Parkinson", position: "TE" },
    { id: 161, name: "Johnny Mundt", position: "TE" },
    { id: 162, name: "Darnell Washington", position: "TE" },
    { id: 163, name: "Stone Smartt", position: "TE" },
    { id: 164, name: "Grant Calcaterra", position: "TE" },
    { id: 165, name: "Josh Oliver", position: "TE" },
    { id: 166, name: "John Bates", position: "TE" },
    { id: 167, name: "Payne Durham", position: "TE" },
    { id: 168, name: "Charlie Kolar", position: "TE" },
    { id: 169, name: "Jared Wiley", position: "TE" },
    { id: 170, name: "Ko Kieft", position: "TE" },
    { id: 171, name: "Davis Allen", position: "TE" },
    { id: 172, name: "Ben Sinnott", position: "TE" },
    { id: 173, name: "Lucas Krull", position: "TE" },
    { id: 174, name: "MyCole Pruitt", position: "TE" },
    { id: 175, name: "Brock Wright", position: "TE" },
    { id: 176, name: "Luke Musgrave", position: "TE" },
    { id: 177, name: "Tucker Kraft", position: "TE" },
    { id: 178, name: "Quintin Morris", position: "TE" },
    { id: 179, name: "Hunter Long", position: "TE" },
    { id: 180, name: "Shane Zylstra", position: "TE" },
    { id: 181, name: "Jack Stoll", position: "TE" },
    { id: 182, name: "Ben Sims", position: "TE" },
    { id: 183, name: "Cade Stover", position: "TE" },
]

const teamNames = [
    "Luis",
    "Sill",
    "Hunter & Julie",
    "Joe",
    "Peter",
    "Alan",
    "Rohan",
    "JT",
    "Christian",
    "Dougie",
]

async function main() {
    console.log(`Start seeding ...`)

    try {
        // Clean existing data
        console.log('Cleaning existing data...');
        // Check if the draftPick model exists and delete records if it does
        try {
            // @ts-ignore - handle this dynamically since the model might not exist yet
            await prisma.$executeRawUnsafe('DELETE FROM "DraftPick"');
        } catch (e) {
            console.log('No DraftPick table exists yet, skipping deletion');
        }
        await prisma.player.deleteMany();
        await prisma.team.deleteMany();

        // Create players
        console.log(`Creating ${playerData.length} players...`);
        await prisma.player.createMany({
            data: playerData,
        });

        console.log(`Created ${playerData.length} players`);

        // Create teams
        console.log(`Creating ${teamNames.length} teams...`);
        for (let i = 0; i < teamNames.length; i++) {
            await prisma.team.create({
                data: {
                    name: teamNames[i],
                },
            });
        }

        console.log(`Created ${teamNames.length} teams`);

        console.log(`Seeding finished.`);
    } catch (error) {
        console.error('Error during seeding:', error);
        throw error;
    }
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    }) 