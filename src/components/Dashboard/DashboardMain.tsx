"use client";

import StatisticsCard from "./StatisticsCard";
import StudentAttendanceChart from "./StudentAttendanceChart";

function DashboardMain() {
    return (
        <div className="space-y-5">
            <StatisticsCard />
            <StudentAttendanceChart />
        </div>
    );
}

export default DashboardMain;
