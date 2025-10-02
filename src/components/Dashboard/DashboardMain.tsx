import React from 'react'
import StatisticsCard from './StatisticsCard'
import StudentAttendanceChart from './StudentAttendanceChart'

function DashboardMain() {
    return (
        <div>
            <StatisticsCard/>
            <StudentAttendanceChart/>
        </div>
    )
}

export default DashboardMain