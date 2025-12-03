import React from 'react';
import { motion } from 'framer-motion';

interface PlantProps {
    type: 'flower' | 'tree';
    stage: number; // 1, 2, 3
    x: number; // percentage
    y: number; // percentage
}

export const Plant: React.FC<PlantProps> = ({ type, stage, x, y }) => {
    // Simple SVG placeholders for plants that grow
    // In a real app, these would be the nice 3D assets provided

    const variants = {
        initial: { scale: 0, opacity: 0, y: 20 },
        animate: { scale: 1, opacity: 1, y: 0, transition: { type: 'spring', bounce: 0.5 } }
    };

    return (
        <motion.div
            className="absolute transform -translate-x-1/2 -translate-y-full"
            style={{ left: `${x}%`, top: `${y}%` }}
            initial="initial"
            animate="animate"
            variants={variants}
        >
            {type === 'flower' ? (
                <FlowerSVG stage={stage} />
            ) : (
                <TreeSVG stage={stage} />
            )}
        </motion.div>
    );
};

const FlowerSVG = ({ stage }: { stage: number }) => (
    <svg width={50 * stage} height={50 * stage} viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="20" fill="#F472B6" />
        <circle cx="50" cy="50" r="10" fill="#FCD34D" />
        <path d="M50 70 L50 100" stroke="#4ADE80" strokeWidth="4" />
        {stage > 1 && <circle cx="30" cy="30" r="15" fill="#F472B6" />}
        {stage > 2 && <circle cx="70" cy="30" r="15" fill="#F472B6" />}
    </svg>
);

const TreeSVG = ({ stage }: { stage: number }) => (
    <svg width={80 * stage} height={100 * stage} viewBox="0 0 100 120" fill="none">
        <rect x="40" y="60" width="20" height="60" fill="#8B4513" />
        <circle cx="50" cy="50" r="40" fill="#22C55E" />
        {stage > 1 && <circle cx="30" cy="40" r="20" fill="#4ADE80" />}
        {stage > 2 && <circle cx="70" cy="40" r="20" fill="#4ADE80" />}
    </svg>
);
