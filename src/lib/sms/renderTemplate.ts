import type { RenderContext } from "./types";

// safe string
const s = (v: unknown) => (typeof v === "string" ? v : v == null ? "" : String(v));

export function renderTemplate(templateBody: string, ctx: RenderContext): string {
    let out = templateBody;

    out = out.replaceAll("[coaching-name]", s(ctx.coachingName));

    // student
    out = out.replaceAll("[student-name]", s(ctx.student?.name));
    out = out.replaceAll("[student-id]", s(ctx.student?.studentId));
    out = out.replaceAll("[student-roll]", s(ctx.student?.roll));

    // single-subject style (compatible with older single-subject results)
    // Gain/Total (overall)
    let gainTotal = "";
    let subject = "";
    let examType = "";
    let examDate = "";
    if (ctx.result) {
        examType = ctx.result.resultType ?? "";
        examDate = ctx.result.examDate ?? "";

        const totalMarks =
            ctx.result.totalMarks ??
            ctx.result.subjects?.reduce((acc, it) => acc + (it.totalMarks ?? 0), 0) ??
            0;
        const totalGain =
            ctx.result.totalGain ??
            ctx.result.subjects?.reduce((acc, it) => acc + (it.totalGain ?? 0), 0) ??
            0;
        gainTotal = `${totalGain}/${totalMarks}`;

        // if there is exactly one subject, expose as single [subject]
        if (ctx.result.subjects && ctx.result.subjects.length === 1) {
            subject = ctx.result.subjects[0].className ?? "";
        }
    }
    out = out.replaceAll("[gain-mark/total-mark]", gainTotal);
    out = out.replaceAll("[exam-type]", examType);
    out = out.replaceAll("[exam-date]", examDate);
    out = out.replaceAll("[subject]", subject);

    // multi-subject list: Physics-50/100, Chemistry-70/100
    let subjectsList = "";
    if (ctx.result?.subjects?.length) {
        subjectsList = ctx.result.subjects
            .map((it) => {
                const t = it.totalMarks ?? ((it.mcqTotal ?? 0) + (it.quesTotal ?? 0));
                const g = it.totalGain ?? ((it.mcqGain ?? 0) + (it.quesGain ?? 0));
                return `${it.className}-${g}/${t}`;
            })
            .join(", ");
    }
    out = out.replaceAll("[subjects]", subjectsList);

    return out.trim();
}
