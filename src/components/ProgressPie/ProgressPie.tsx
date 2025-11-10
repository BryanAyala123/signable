// components/ProgressPie/ProgressPie.tsx
import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface ProgressPieProps {
    masteredTotal: number;
    learningTotal: number;
    totalCards: number;
}

const ProgressPie: React.FC<ProgressPieProps> = ({ masteredTotal, learningTotal, totalCards }) => {
    const remaining = totalCards - masteredTotal - learningTotal;

    const data = {
    datasets: [
        {
            data: [masteredTotal, learningTotal, remaining],
            backgroundColor: ['#6FB892', '#F25749', '#E8E4D8'],
            borderWidth: 0,
        },
    ],
    };

    const options = {
        plugins: {
        legend: {
            position: 'bottom' as const,
        },
        tooltip: {
            callbacks: {
            label: (context: any) => `${context.label}: ${context.raw} cards`,
            },
        },
        },
        animation: {
        animateRotate: true,
        duration: 800,
        },
    };

    return <Pie data={data} options={options} />;
};

export default ProgressPie;
