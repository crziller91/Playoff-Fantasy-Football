// Service for fetching and caching scoring rules

// Store scoring rules by position and category for fast lookup
type ScoringRulesMap = {
    [position: string]: {
        [category: string]: number;
    };
};

// Default values in case the database is unavailable
const DEFAULT_SCORING_RULES: ScoringRulesMap = {
    QB: {
        passingTouchdown: 4,
        passingYardDivisor: 25,
        twoPtConversion: 2,
        interception: -2,
        completionDivisor: 10
    },
    RB: {
        rushingTouchdown: 6,
        rushingYardDivisor: 10,
        rushingAttemptDivisor: 5,
        twoPtConversion: 2
    },
    WR: {
        receivingTouchdown: 6,
        receivingYardDivisor: 10,
        reception: 1,
        twoPtConversion: 2
    },
    TE: {
        receivingTouchdown: 6,
        receivingYardDivisor: 10,
        reception: 1,
        twoPtConversion: 2
    },
    K: {
        pat: 1,
        fgMiss: -1,
        fg0to39: 3,
        fg40to49: 4,
        fg50to59: 5,
        fg60plus: 6
    },
    DST: {
        touchdown: 6,
        sack: 2,
        blockedKick: 2,
        interception: 2,
        fumbleRecovery: 2,
        safety: 2,
        points0: 10,
        points1to6: 5,
        points7to13: 3,
        points14to17: 1,
        points18to27: 0,
        points28to34: -1,
        points35to45: -3,
        pointsOver45: -5,
        yards0to99: 5,
        yards100to199: 3,
        yards200to299: 2,
        yards300to399: 0,
        yards400to449: -1,
        yards450to499: -3,
        yards500plus: -5
    }
};

// Internal cache of scoring rules - will be populated from the database
let scoringRulesCache: ScoringRulesMap | null = null;
let lastFetchTime: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

// Function to fetch scoring rules from the API
export const fetchScoringRules = async (): Promise<ScoringRulesMap> => {
    try {
        // Check if cache is still valid
        const now = Date.now();
        if (scoringRulesCache && (now - lastFetchTime < CACHE_TTL)) {
            return scoringRulesCache;
        }

        // Fetch fresh rules from the API
        const response = await fetch('/api/scoring-rules');
        if (!response.ok) {
            throw new Error(`Failed to fetch scoring rules: ${response.status}`);
        }

        const rulesArray = await response.json();

        // Convert the array to our map format
        const rulesMap: ScoringRulesMap = {};

        rulesArray.forEach((rule: any) => {
            if (!rulesMap[rule.position]) {
                rulesMap[rule.position] = {};
            }
            rulesMap[rule.position][rule.category] = rule.value;
        });

        // Update cache
        scoringRulesCache = rulesMap;
        lastFetchTime = now;

        return rulesMap;
    } catch (error) {
        console.error('Error fetching scoring rules:', error);
        // Return default values as fallback
        return DEFAULT_SCORING_RULES;
    }
};

// Function to get a specific rule value
export const getScoringRule = async (position: string, category: string): Promise<number> => {
    const rules = await fetchScoringRules();

    if (rules[position] && rules[position][category] !== undefined) {
        return rules[position][category];
    }

    // Fallback to default
    return DEFAULT_SCORING_RULES[position]?.[category] ?? 0;
};

// Function to get all rules for a position
export const getPositionScoringRules = async (position: string): Promise<{ [category: string]: number } | null> => {
    const rules = await fetchScoringRules();
    return rules[position] || DEFAULT_SCORING_RULES[position] || null;
};