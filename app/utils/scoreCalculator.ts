import { ExtendedPlayer, ScoreForm, FormErrors } from "../types/index";

// Helper function to safely parse numbers
export const parseNum = (val: string | undefined): number => parseInt(val || "0", 10) || 0;

// Calculate score based on player position
export const calculatePlayerScore = (player: ExtendedPlayer, form: ScoreForm): number => {
    let score = 0;

    switch (player.position) {
        case "QB":
            score += parseNum(form.touchdowns) * 4; // 4 pts per passing TD
            score += Math.round(parseNum(form.yards) / 25); // 1 pt per 25 yards
            score += parseNum(form.twoPtConversions) * 2; // 2 pts per 2-pt conversion
            score -= parseNum(form.interceptions) * 2; // -2 per INT
            score += Math.round(parseNum(form.completions) / 10); // 1 pt per 10 completions
            break;
        case "RB":
            score += parseNum(form.touchdowns) * 6; // 6 pts per TD
            score += Math.floor(parseNum(form.rushingYards) / 10); // 1 pt per 10 rushing yards
            score += Math.floor(parseNum(form.rushingAttempts) / 5); // 1 pt per 5 attempts
            score += parseNum(form.twoPtConversions) * 2; // 2 pts per 2-pt conversion
            break;
        case "WR":
        case "TE":
            score += parseNum(form.touchdowns) * 6; // 6 pts per TD
            score += Math.floor(parseNum(form.receivingYards) / 10); // 1 pt per 10 receiving yards
            score += parseNum(form.receptions); // 1 pt per reception
            score += parseNum(form.twoPtConversions) * 2; // 2 pts per 2-pt conversion
            break;
        case "K":
            score += parseNum(form.pat); // 1 pt per PAT
            score -= parseNum(form.fgMisses); // -1 per FG/PAT miss
            if (form.fgYardages) {
                form.fgYardages.forEach((yardage) => {
                    const yards = parseNum(yardage);
                    if (yards >= 60) score += 6;
                    else if (yards >= 50) score += 5;
                    else if (yards >= 40) score += 4;
                    else if (yards >= 0) score += 3;
                });
            }
            break;
        case "DST":
            score += parseNum(form.touchdowns) * 6; // 6 pts per TD
            score += parseNum(form.sacks) * 2; // 2 pts per sack
            score += parseNum(form.blockedKicks) * 2; // 2 pts per blocked kick
            score += parseNum(form.interceptions) * 2; // 2 pts per INT
            score += parseNum(form.fumblesRecovered) * 2; // 2 pts per fumble recovered
            score += parseNum(form.safeties) * 2; // 2 pts per safety

            // Points allowed scoring
            const points = parseNum(form.pointsAllowed);
            if (points === 0) score += 10;
            else if (points <= 6) score += 5;
            else if (points <= 13) score += 3;
            else if (points <= 17) score += 1;
            else if (points <= 34) score += -1;
            else if (points <= 45) score += -3;
            else score += -5;

            // Yards allowed scoring
            const yards = parseNum(form.yardsAllowed);
            if (yards < 100) score += 5;
            else if (yards <= 199) score += 3;
            else if (yards <= 299) score += 2;
            else if (yards <= 399) score += -1;
            else if (yards <= 449) score += -3;
            else if (yards <= 499) score += -4;
            else score += -5;
            break;
        default:
            break;
    }
    return score;
};

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