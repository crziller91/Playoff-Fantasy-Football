import React from "react";

interface RoundDisabledMessageProps {
    round: string;
}

/**
 * Component to display a message when a playoff round is disabled
 */
export default function RoundDisabledMessage({ round }: RoundDisabledMessageProps) {
    return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="mb-4 text-xl font-semibold text-gray-700">
                {round} Round Locked
            </div>
            <div className="text-gray-500">
                {round === "Divisional" && (
                    <p>Complete all Wild Card player scores first.</p>
                )}
                {round === "Conference" && (
                    <p>Complete all Wild Card and Divisional player scores first.</p>
                )}
                {round === "Superbowl" && (
                    <p>Complete all Wild Card, Divisional, and Conference player scores first.</p>
                )}
            </div>
        </div>
    );
}