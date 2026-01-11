import { Modal, Badge, Label } from "flowbite-react";
import { ExtendedPlayer } from "../../types";

interface ViewPlayerStatsModalProps {
    isOpen: boolean;
    onClose: () => void;
    player: ExtendedPlayer | null;
}

export default function ViewPlayerStatsModal({
    isOpen,
    onClose,
    player
}: ViewPlayerStatsModalProps) {
    if (!player || !player.scoreData) return null;

    const renderPositionStats = () => {
        const { scoreData } = player;

        switch (player.position) {
            case "QB":
                return (
                    <div className="space-y-4">
                        <StatRow label="Passing Touchdowns" value={scoreData.touchdowns || '0'} />
                        <StatRow label="Total Passing Yards" value={scoreData.yards || '0'} />
                        <StatRow label="Interceptions" value={scoreData.interceptions || '0'} />
                        <StatRow label="Completions" value={scoreData.completions || '0'} />
                        <StatRow label="Rushing Touchdowns" value={scoreData.rushingTouchdowns || '0'} />
                        <StatRow label="Total Rushing Yards" value={scoreData.rushingYards || '0'} />
                        <StatRow label="Rushing Attempts" value={scoreData.rushingAttempts || '0'} />
                        <StatRow label="2-Point Conversions" value={scoreData.twoPointConversions || '0'} />
                        <StatRow label="Fumbles Lost" value={scoreData.fumblesLost || '0'} />
                    </div>
                );
            case "RB":
                return (
                    <div className="space-y-4">
                        <StatRow label="Rushing Touchdowns" value={scoreData.touchdowns || '0'} />
                        <StatRow label="Total Rushing Yards" value={scoreData.rushingYards || '0'} />
                        <StatRow label="Rushing Attempts" value={scoreData.rushingAttempts || '0'} />
                        <StatRow label="Receiving Touchdowns" value={scoreData.receivingTouchdowns || '0'} />
                        <StatRow label="Total Receiving Yards" value={scoreData.receivingYards || '0'} />
                        <StatRow label="Receptions" value={scoreData.receptions || '0'} />
                        <StatRow label="Fumbles Lost" value={scoreData.fumblesLost || '0'} />
                        <StatRow label="Passing Touchdowns" value={scoreData.passingTouchdowns || '0'} />
                        <StatRow label="2-Point Conversions" value={scoreData.twoPointConversions || '0'} />
                    </div>
                );
            case "WR":
            case "TE":
                return (
                    <div className="space-y-4">
                        <StatRow label="Receiving Touchdowns" value={scoreData.touchdowns || '0'} />
                        <StatRow label="Total Receiving Yards" value={scoreData.receivingYards || '0'} />
                        <StatRow label="Receptions" value={scoreData.receptions || '0'} />
                        <StatRow label="Rushing Touchdowns" value={scoreData.rushingTouchdowns || '0'} />
                        <StatRow label="Total Rushing Yards" value={scoreData.rushingYards || '0'} />
                        <StatRow label="Rushing Attempts" value={scoreData.rushingAttempts || '0'} />
                        <StatRow label="Fumbles Lost" value={scoreData.fumblesLost || '0'} />
                        <StatRow label="Passing Touchdowns" value={scoreData.passingTouchdowns || '0'} />
                        <StatRow label="2-Point Conversions" value={scoreData.twoPointConversions || '0'} />
                    </div>
                );
            case "K":
                return (
                    <div className="space-y-4">
                        <StatRow label="PAT" value={scoreData.pat || '0'} />
                        <StatRow label="FG/PAT Misses" value={scoreData.fgMisses || '0'} />
                        <StatRow label="Field Goals Made" value={scoreData.fg || '0'} />
                        {scoreData.fgYardages && scoreData.fgYardages.length > 0 && (
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-gray-900 dark:text-white">
                                    Field Goal Yardages
                                </Label>
                                <div className="flex flex-wrap gap-2">
                                    {scoreData.fgYardages.map((yardage, index) => (
                                        <Badge key={index} color="info" size="sm">
                                            {yardage} yds
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <Modal show={isOpen} size="md" onClose={onClose} popup>
            <Modal.Header />
            <Modal.Body>
                <div className="space-y-6">
                    <div>
                        <h3 className="text-xl font-medium text-gray-900 dark:text-white">
                            {player.name}
                        </h3>
                        {player.teamName && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {player.teamName} • {player.position}
                            </p>
                        )}
                    </div>

                    <div className="flex items-center justify-between border-b border-t border-gray-200 py-4 dark:border-gray-700">
                        <span className="text-base font-semibold text-gray-900 dark:text-white">
                            Total Score
                        </span>
                        <Badge color="success" size="lg">
                            {player.score} pts
                        </Badge>
                    </div>

                    {renderPositionStats()}
                </div>
            </Modal.Body>
        </Modal>
    );
}

// Helper component for displaying stat rows
function StatRow({ label, value }: { label: string; value?: string }) {
    if (value === undefined) return null;

    return (
        <div className="flex items-center justify-between">
            <Label className="text-sm text-gray-700 dark:text-gray-300">
                {label}
            </Label>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {value}
            </span>
        </div>
    );
}
