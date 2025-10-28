export function getGpa(percent: number) {
    if (percent >= 80 && percent <= 100) return { grade: "A+", point: 5.0 };
    if (percent >= 70) return { grade: "A", point: 4.0 };
    if (percent >= 60) return { grade: "A-", point: 3.5 };
    if (percent >= 50) return { grade: "B", point: 3.0 };
    if (percent >= 40) return { grade: "C", point: 2.0 };
    if (percent >= 33) return { grade: "D", point: 1.0 };
    return { grade: "F", point: 0.0 };
}
