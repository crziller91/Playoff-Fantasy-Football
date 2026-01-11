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
            const interceptionValue = await getScoringRule("QB", "interception");
            const completionDivisor = await getScoringRule("QB", "completionDivisor");
            const qbRushingTDValue = await getScoringRule("QB", "rushingTouchdown");
            const qbRushingYardDivisor = await getScoringRule("QB", "rushingYardDivisor");
            const qbRushingAttemptDivisor = await getScoringRule("QB", "rushingAttemptDivisor");
            const qbTwoPointValue = await getScoringRule("QB", "twoPtConversion");
            const qbFumbleLostValue = await getScoringRule("QB", "fumbleLost");

            score += parseNum(form.touchdowns) * passingTDValue; // Points per passing TD
            score += Math.round(parseNum(form.yards) / passingYardDivisor); // Points per yards divisor
            score += parseNum(form.interceptions) * interceptionValue; // Points per INT
            score += Math.round(parseNum(form.completions) / completionDivisor); // Points per completions divisor
            score += parseNum(form.rushingTouchdowns) * qbRushingTDValue; // Points per rushing TD
            score += Math.max(0, Math.floor(parseNum(form.rushingYards) / qbRushingYardDivisor)); // Points per rushing yards divisor (no penalty for negative)
            score += Math.floor(parseNum(form.rushingAttempts) / qbRushingAttemptDivisor); // Points per rushing attempts divisor
            score += parseNum(form.twoPointConversions) * qbTwoPointValue; // Points per 2-pt conversion
            score += parseNum(form.fumblesLost) * qbFumbleLostValue; // Points per fumble lost
            break;

        case "RB":
            // Use dynamic scoring rules from database
            const rushingTDValue = await getScoringRule("RB", "rushingTouchdown");
            const rushingYardDivisor = await getScoringRule("RB", "rushingYardDivisor");
            const rushingAttemptDivisor = await getScoringRule("RB", "rushingAttemptDivisor");
            const rbReceivingTDValue = await getScoringRule("RB", "receivingTouchdown");
            const rbReceivingYardDivisor = await getScoringRule("RB", "receivingYardDivisor");
            const rbReceptionValue = await getScoringRule("RB", "reception");
            const rbFumbleLostValue = await getScoringRule("RB", "fumbleLost");
            const rbPassingTDValue = await getScoringRule("RB", "passingTouchdown");
            const rbTwoPointValue = await getScoringRule("RB", "twoPtConversion");

            score += parseNum(form.touchdowns) * rushingTDValue; // Points per rushing TD
            score += Math.max(0, Math.floor(parseNum(form.rushingYards) / rushingYardDivisor)); // Points per rushing yards divisor (no penalty for negative)
            score += Math.floor(parseNum(form.rushingAttempts) / rushingAttemptDivisor); // Points per attempts divisor
            score += parseNum(form.receivingTouchdowns) * rbReceivingTDValue; // Points per receiving TD
            score += Math.max(0, Math.floor(parseNum(form.receivingYards) / rbReceivingYardDivisor)); // Points per receiving yards divisor (no penalty for negative)
            score += parseNum(form.receptions) * rbReceptionValue; // Points per reception
            score += parseNum(form.fumblesLost) * rbFumbleLostValue; // Points per fumble lost
            score += parseNum(form.passingTouchdowns) * rbPassingTDValue; // Points per passing TD
            score += parseNum(form.twoPointConversions) * rbTwoPointValue; // Points per 2-pt conversion
            break;

        case "WR":
        case "TE":
            // Use dynamic scoring rules from database
            const receivingTDValue = await getScoringRule(player.position, "receivingTouchdown");
            const receivingYardDivisor = await getScoringRule(player.position, "receivingYardDivisor");
            const receptionValue = await getScoringRule(player.position, "reception");
            const wrTeRushingTDValue = await getScoringRule(player.position, "rushingTouchdown");
            const wrTeRushingYardDivisor = await getScoringRule(player.position, "rushingYardDivisor");
            const wrTeRushingAttemptDivisor = await getScoringRule(player.position, "rushingAttemptDivisor");
            const wrTeFumbleLostValue = await getScoringRule(player.position, "fumbleLost");
            const wrTePassingTDValue = await getScoringRule(player.position, "passingTouchdown");
            const wrTeTwoPointValue = await getScoringRule(player.position, "twoPtConversion");

            score += parseNum(form.touchdowns) * receivingTDValue; // Points per receiving TD
            score += Math.max(0, Math.floor(parseNum(form.receivingYards) / receivingYardDivisor)); // Points per receiving yards divisor (no penalty for negative)
            score += parseNum(form.receptions) * receptionValue; // Points per reception
            score += parseNum(form.rushingTouchdowns) * wrTeRushingTDValue; // Points per rushing TD
            score += Math.max(0, Math.floor(parseNum(form.rushingYards) / wrTeRushingYardDivisor)); // Points per rushing yards divisor (no penalty for negative)
            score += Math.floor(parseNum(form.rushingAttempts) / wrTeRushingAttemptDivisor); // Points per rushing attempts divisor
            score += parseNum(form.fumblesLost) * wrTeFumbleLostValue; // Points per fumble lost
            score += parseNum(form.passingTouchdowns) * wrTePassingTDValue; // Points per passing TD
            score += parseNum(form.twoPointConversions) * wrTeTwoPointValue; // Points per 2-pt conversion
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

        default:
            break;
    }
    return score;
};

// Rest of the file remains the same

// Get team picks in a specific order by position
export const getOrderedTeamPicks = (team: string, draftPicks: any) => {
    const positionOrder = ["QB", "RB", "WR", "TE", "K"];
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
            validateField("interceptions");
            validateField("completions");
            validateField("rushingTouchdowns");
            validateField("rushingYards");
            validateField("rushingAttempts");
            validateField("twoPointConversions");
            validateField("fumblesLost");
            break;
        case "RB":
            validateField("touchdowns");
            validateField("rushingYards");
            validateField("rushingAttempts");
            validateField("receivingTouchdowns");
            validateField("receivingYards");
            validateField("receptions");
            validateField("fumblesLost");
            validateField("passingTouchdowns");
            validateField("twoPointConversions");
            break;
        case "WR":
        case "TE":
            validateField("touchdowns");
            validateField("receivingYards");
            validateField("receptions");
            validateField("rushingTouchdowns");
            validateField("rushingYards");
            validateField("rushingAttempts");
            validateField("fumblesLost");
            validateField("passingTouchdowns");
            validateField("twoPointConversions");
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
        default:
            break;
    }

    return errors;
};