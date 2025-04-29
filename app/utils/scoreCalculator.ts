import { ExtendedPlayer, ScoreForm, FormErrors } from "../types/index";
import { getScoringRule } from "../services/scoringRulesService";

// Helper function to safely parse numbers
export const parseNum = (val: string | undefined): number => parseInt(val || "0", 10) || 0;

// Calculate score based on player position
export const calculatePlayerScore = async (player: ExtendedPlayer, form: ScoreForm): Promise<number> => {
    let score = 0;
    console.log(`Calculating score for ${player.name} (${player.position})`);

    switch (player.position) {
        case "QB":
            // Use dynamic scoring rules from database
            const passingTDValue = await getScoringRule("QB", "passingTouchdown");
            const passingYardDivisor = await getScoringRule("QB", "passingYardDivisor");
            const qbTwoPtValue = await getScoringRule("QB", "twoPtConversion");
            const interceptionValue = await getScoringRule("QB", "interception");
            const completionDivisor = await getScoringRule("QB", "completionDivisor");

            score += parseNum(form.touchdowns) * passingTDValue; // Points per passing TD
            score += Math.round(parseNum(form.yards) / passingYardDivisor); // Points per yards divisor
            score += parseNum(form.twoPtConversions) * qbTwoPtValue; // Points per 2-pt conversion
            score += parseNum(form.interceptions) * interceptionValue; // Points per INT
            score += Math.round(parseNum(form.completions) / completionDivisor); // Points per completions divisor
            break;

        case "RB":
            // Use dynamic scoring rules from database
            const rushingTDValue = await getScoringRule("RB", "rushingTouchdown");
            const rushingYardDivisor = await getScoringRule("RB", "rushingYardDivisor");
            const rushingAttemptDivisor = await getScoringRule("RB", "rushingAttemptDivisor");
            const rbTwoPtValue = await getScoringRule("RB", "twoPtConversion");

            score += parseNum(form.touchdowns) * rushingTDValue; // Points per TD
            score += Math.floor(parseNum(form.rushingYards) / rushingYardDivisor); // Points per rushing yards divisor
            score += Math.floor(parseNum(form.rushingAttempts) / rushingAttemptDivisor); // Points per attempts divisor
            score += parseNum(form.twoPtConversions) * rbTwoPtValue; // Points per 2-pt conversion
            break;

        case "WR":
        case "TE":
            // Use dynamic scoring rules from database
            const receivingTDValue = await getScoringRule(player.position, "receivingTouchdown");
            const receivingYardDivisor = await getScoringRule(player.position, "receivingYardDivisor");
            const receptionValue = await getScoringRule(player.position, "reception");
            const wrTePtValue = await getScoringRule(player.position, "twoPtConversion");

            score += parseNum(form.touchdowns) * receivingTDValue; // Points per TD
            score += Math.floor(parseNum(form.receivingYards) / receivingYardDivisor); // Points per receiving yards divisor
            score += parseNum(form.receptions) * receptionValue; // Points per reception
            score += parseNum(form.twoPtConversions) * wrTePtValue; // Points per 2-pt conversion
            break;

        case "K":
            // Use dynamic scoring rules from database
            const patValue = await getScoringRule("K", "pat");
            const fgMissValue = await getScoringRule("K", "fgMiss");
            const fg0to39Value = await getScoringRule("K", "fg0to39");
            const fg40to49Value = await getScoringRule("K", "fg40to49");
            const fg50to59Value = await getScoringRule("K", "fg50to59");
            const fg60plusValue = await getScoringRule("K", "fg60plus");

            score += parseNum(form.pat) * patValue; // Points per PAT
            score += parseNum(form.fgMisses) * fgMissValue; // Points per FG/PAT miss

            if (form.fgYardages) {
                form.fgYardages.forEach((yardage) => {
                    const yards = parseNum(yardage);
                    if (yards >= 60) score += fg60plusValue;
                    else if (yards >= 50) score += fg50to59Value;
                    else if (yards >= 40) score += fg40to49Value;
                    else if (yards >= 0) score += fg0to39Value;
                });
            }
            break;

        case "DST":
            // Use dynamic scoring rules from database
            const tdValue = await getScoringRule("DST", "touchdown");
            const sackValue = await getScoringRule("DST", "sack");
            const blockedKickValue = await getScoringRule("DST", "blockedKick");
            const intValue = await getScoringRule("DST", "interception");
            const fumbleRecoveryValue = await getScoringRule("DST", "fumbleRecovery");
            const safetyValue = await getScoringRule("DST", "safety");

            // Points allowed values
            const points0Value = await getScoringRule("DST", "points0");
            const points1to6Value = await getScoringRule("DST", "points1to6");
            const points7to13Value = await getScoringRule("DST", "points7to13");
            const points14to17Value = await getScoringRule("DST", "points14to17");
            const points18to27Value = await getScoringRule("DST", "points18to27");
            const points28to34Value = await getScoringRule("DST", "points28to34");
            const points35to45Value = await getScoringRule("DST", "points35to45");
            const pointsOver45Value = await getScoringRule("DST", "pointsOver45");

            // Yards allowed values
            const yards0to99Value = await getScoringRule("DST", "yards0to99");
            const yards100to199Value = await getScoringRule("DST", "yards100to199");
            const yards200to299Value = await getScoringRule("DST", "yards200to299");
            const yards300to399Value = await getScoringRule("DST", "yards300to399");
            const yards400to449Value = await getScoringRule("DST", "yards400to449");
            const yards450to499Value = await getScoringRule("DST", "yards450to499");
            const yards500plusValue = await getScoringRule("DST", "yards500plus");

            score += parseNum(form.touchdowns) * tdValue; // Points per TD
            score += parseNum(form.sacks) * sackValue; // Points per sack
            score += parseNum(form.blockedKicks) * blockedKickValue; // Points per blocked kick
            score += parseNum(form.interceptions) * intValue; // Points per INT
            score += parseNum(form.fumblesRecovered) * fumbleRecoveryValue; // Points per fumble recovered
            score += parseNum(form.safeties) * safetyValue; // Points per safety

            // Points allowed scoring
            const points = parseNum(form.pointsAllowed);
            if (points === 0) score += points0Value;
            else if (points <= 6) score += points1to6Value;
            else if (points <= 13) score += points7to13Value;
            else if (points <= 17) score += points14to17Value;
            else if (points <= 27) score += points18to27Value;
            else if (points <= 34) score += points28to34Value;
            else if (points <= 45) score += points35to45Value;
            else score += pointsOver45Value;

            // Yards allowed scoring
            const yards = parseNum(form.yardsAllowed);
            if (yards < 100) score += yards0to99Value;
            else if (yards <= 199) score += yards100to199Value;
            else if (yards <= 299) score += yards200to299Value;
            else if (yards <= 399) score += yards300to399Value;
            else if (yards <= 449) score += yards400to449Value;
            else if (yards <= 499) score += yards450to499Value;
            else score += yards500plusValue;
            break;

        default:
            break;
    }
    return score;
};

// Rest of the file remains the same

// Get team picks in a specific order by position
export const getOrderedTeamPicks = (team: string, draftPicks: any) => {
    const positionOrder = ["QB", "RB", "WR", "TE", "DST", "K"];
    const teamPicks = Object.entries(draftPicks[team] || {})
        .filter(([_, player]) => player !== null)
        .map(([pick, player]) => ({ pick: Number(pick), player: player as ExtendedPlayer }));

    return teamPicks.sort((a, b) => {
        const posA = positionOrder.indexOf(a.player.position);
        const posB = positionOrder.indexOf(b.player.position);
        if (posA !== posB) return posA - posB;
        return a.pick - b.pick;
    });
};

// Calculate total team score
export const getTeamScore = (team: string, draftPicks: any, playerScores: { [key: string]: ExtendedPlayer }): number => {
    return getOrderedTeamPicks(team, draftPicks).reduce((total, { player }) => {
        // Skip disabled players when calculating team score
        if (playerScores[player.name]?.isDisabled) {
            return total;
        }
        return total + (playerScores[player.name]?.score || 0);
    }, 0);
};

// Validate if input is a valid whole number (including negative numbers)
export const isValidWholeNumber = (value: string | undefined): boolean => {
    if (value === undefined || value === "") return false;
    return /^-?\d+$/.test(value);
};

// Validate form fields based on player position
export const validateForm = (selectedPlayer: ExtendedPlayer | null, scoreForm: ScoreForm, fgCount: number): FormErrors => {
    if (!selectedPlayer) return {};

    const errors: FormErrors = {};

    const validateField = (field: keyof ScoreForm) => {
        // Skip array fields which should be handled separately
        if (field === "fgYardages") return;

        const value = scoreForm[field];
        if (!isValidWholeNumber(value as string | undefined)) {
            errors[field] = true;
        }
    };

    // Validate fields based on player position
    switch (selectedPlayer.position) {
        case "QB":
            validateField("touchdowns");
            validateField("yards");
            validateField("twoPtConversions");
            validateField("interceptions");
            validateField("completions");
            break;
        case "RB":
            validateField("touchdowns");
            validateField("rushingYards");
            validateField("rushingAttempts");
            validateField("twoPtConversions");
            break;
        case "WR":
        case "TE":
            validateField("touchdowns");
            validateField("receivingYards");
            validateField("receptions");
            validateField("twoPtConversions");
            break;
        case "K":
            validateField("pat");
            validateField("fgMisses");
            validateField("fg");
            // Validate each field goal yardage if there are any
            if (fgCount > 0) {
                if (!scoreForm.fgYardages || scoreForm.fgYardages.length !== fgCount) {
                    errors["fgYardages"] = true;
                } else {
                    scoreForm.fgYardages.forEach((yardage, index) => {
                        if (!isValidWholeNumber(yardage)) {
                            errors[`fgYardage${index}`] = true;
                        }
                    });
                }
            }
            break;
        case "DST":
            validateField("touchdowns");
            validateField("sacks");
            validateField("blockedKicks");
            validateField("interceptions");
            validateField("fumblesRecovered");
            validateField("safeties");
            validateField("pointsAllowed");
            validateField("yardsAllowed");
            break;
        default:
            break;
    }

    return errors;
};