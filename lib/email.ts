import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM = process.env.EMAIL_FROM || 'TLM Results <onboarding@resend.dev>';

export async function sendResultsEmail(params: {
  to: string;
  studentName: string;
  courseName: string;
  totalScore: number;
  maxTotal: number;
  feedback?: string;
  scoreBreakdown: Array<{ question: string; score: number; max: number }>;
}) {
  if (!resend) {
    console.log('[EMAIL DISABLED] Would have sent results to', params.to);
    console.log(params);
    return { skipped: true };
  }

  const percentage = Math.round((params.totalScore / params.maxTotal) * 100);
  const grade =
    percentage >= 70 ? 'Excellent' : percentage >= 50 ? 'Good' : 'Needs Improvement';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #0F4C81; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0;">TLM Assessment Results</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
        <p>Hi ${params.studentName},</p>
        <p>Your results for the <strong>${params.courseName}</strong> assessment are now available.</p>

        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <div style="font-size: 48px; font-weight: bold; color: #0F4C81;">
            ${params.totalScore} / ${params.maxTotal}
          </div>
          <div style="font-size: 18px; color: #666; margin-top: 5px;">
            ${percentage}% &mdash; ${grade}
          </div>
        </div>

        <h3>Score Breakdown</h3>
        <table style="width: 100%; border-collapse: collapse; background: white;">
          <thead>
            <tr style="background: #0F4C81; color: white;">
              <th style="padding: 10px; text-align: left;">Question</th>
              <th style="padding: 10px; text-align: right;">Score</th>
            </tr>
          </thead>
          <tbody>
            ${params.scoreBreakdown
              .map(
                (s, i) => `
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px;">Q${i + 1}: ${s.question.slice(0, 80)}${
                  s.question.length > 80 ? '...' : ''
                }</td>
                <td style="padding: 10px; text-align: right;"><strong>${s.score} / ${s.max}</strong></td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>

        ${
          params.feedback
            ? `
          <h3>Instructor Feedback</h3>
          <div style="background: white; padding: 15px; border-left: 4px solid #F4A261; border-radius: 4px;">
            ${params.feedback}
          </div>
        `
            : ''
        }

        <p style="margin-top: 30px; color: #666; font-size: 14px;">
          Thank you for participating in the TLM assessment program.
        </p>
      </div>
    </div>
  `;

  try {
    const result = await resend.emails.send({
      from: FROM,
      to: params.to,
      subject: `Your TLM ${params.courseName} Results`,
      html,
    });
    return { success: true, result };
  } catch (err) {
    console.error('Email send failed:', err);
    return { error: String(err) };
  }
}
