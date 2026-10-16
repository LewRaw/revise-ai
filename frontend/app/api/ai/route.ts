import { NextRequest, NextResponse } from 'next/server';
import {
  evaluateStudentExplanation,
  analyzeNotebookImage,
  evaluateDescriptiveAnswer,
  generateFocalSummaryFromErrors,
  generateQuizFromContent,
} from '@/lib/ai_service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, topic, subject, transcription, base64Image, question, studentAnswer, errorDescriptions, contentSnippet } = body;

    switch (action) {
      case 'evaluate_voice': {
        const result = await evaluateStudentExplanation(topic || 'Geral', transcription || '');
        return NextResponse.json({ ok: true, data: result });
      }
      case 'analyze_notebook': {
        const result = await analyzeNotebookImage(base64Image || '', subject || 'Física');
        return NextResponse.json({ ok: true, data: result });
      }
      case 'evaluate_descriptive': {
        const result = await evaluateDescriptiveAnswer(topic || 'Geral', question || '', studentAnswer || '');
        return NextResponse.json({ ok: true, data: result });
      }
      case 'focal_summary': {
        const result = await generateFocalSummaryFromErrors(topic || 'Geral', errorDescriptions || []);
        return NextResponse.json({ ok: true, data: result });
      }
      case 'generate_quiz': {
        const result = await generateQuizFromContent(topic || 'Geral', contentSnippet || '');
        return NextResponse.json({ ok: true, data: result });
      }
      default:
        return NextResponse.json({ ok: false, error: 'Ação de IA desconhecida' }, { status: 400 });
    }
  } catch (error) {
    console.error('Erro na rota /api/ai:', error);
    return NextResponse.json({ ok: false, error: 'Falha interna ao processar requisição de IA' }, { status: 500 });
  }
}
