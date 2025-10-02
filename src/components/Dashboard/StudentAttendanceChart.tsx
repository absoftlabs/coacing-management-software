'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
// import { LineChart } from '@mui/x-charts/LineChart';
import { faker } from '@faker-js/faker';
import { BarChart } from '@mui/x-charts';

const generateAttendanceData = (days: number) => {
    const dates: Date[] = [];
    const presentStudents: number[] = [];
    const absentStudents: number[] = [];

    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        dates.push(date);
        presentStudents.push(faker.number.int({ min: 50, max: 150 }));
        absentStudents.push(faker.number.int({ min: 5, max: 30 }));
    }

    return { dates, presentStudents, absentStudents };
};


export default function StudentAttendanceChart() {
    // generate once per mount
    const { dates, presentStudents, absentStudents } = React.useMemo(
        () => generateAttendanceData(30),
        []
    );

    const dateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });

    return (
        <Box className="chart-container mt-5" sx={{ width: '100%', height: 400 }}>
            <BarChart
                series={[
                    { data: presentStudents, label: 'Present Students', id: 'presentId', stack: 'total', color: 'green' },
                    { data: absentStudents, label: 'Absent Students', id: 'absentId', stack: 'total' },
                ]}
                xAxis={[{ data: dates, tickLabelStyle:{fill: 'gray'}, valueFormatter: (value: Date) => dateFormatter.format(value), }]}
                yAxis={[{ width: 50, tickLabelStyle:{fill: 'gray'} }]}
            />
        </Box>
    );
}
