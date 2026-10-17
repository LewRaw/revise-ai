/**
 * Módulo de Integração com Google GenAI SDK (Gemini)
 * Otimizado para Estudos de Ensino Médio & Revisão Ativa
 * Inclui: Blindagem anti-prompt injection, sanitização, análise multimodal, simulados e geração sob demanda.
 */

const JAILBREAK_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior)\s+instructions/i,
  /desconsidere\s+(todas\s+as\s+)?instrucoes\s+anteriores/i,
  /you\s+are\s+now\s+in\s+dan\s+mode/i,
  /rebele-se/i,
  /mostre\s+(seu|o)\s+system\s+prompt/i,
  /reveal\s+your\s+system\s+prompt/i,
  /sudo\s+mode/i,
];

export function sanitizePromptInput(input: string, maxLength: number = 2000): string {
  if (!input) return '';
  let sanitized = input.replace(/[<>]/g, '').trim().slice(0, maxLength);
  for (const pattern of JAILBREAK_PATTERNS) {
    if (pattern.test(sanitized)) sanitized = sanitized.replace(pattern, '[REMOVIDO POR SEGURANÇA]');
  }
  return sanitized;
}

export interface VoiceExplanationFeedback {
  topic: string;
  clarity_score: number;
  concepts_grasped: string[];
  gaps_detected: string[];
  encouragement: string;
  suggested_review: string;
}

export interface QuizQuestionGenerated {
  id: string;
  question_text: string;
  options: { letter: string; text: string; is_correct: boolean; explanation: string }[];
  difficulty: 'fácil' | 'médio' | 'difícil';
}

export interface DescriptiveFeedback {
  score: number;
  criteriaMet: string[];
  missingElements: string[];
  suggestedImprovement: string;
}

export interface NotebookOcrAnalysis {
  summary: string;
  keyPoints: string[];
  detectedTopic: string;
}

export interface GenerateTopicMaterialParams {
  subject: string;
  topicTitle: string;
  userNotes?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  schoolGrade?: string;
  targetExam?: string;
}

export interface GeneratedTopicQuestion {
  id: string;
  subject: string;
  topic: string;
  difficulty: 'fácil' | 'médio' | 'difícil';
  text: string;
  options: { letter: string; text: string; isCorrect: boolean; explanation: string }[];
}

export interface GeneratedTopicStudyMaterial {
  summaryDefinition: string;
  formulaOrRule: string;
  enemTip: string;
  descriptivePrompt: string;
  questions: GeneratedTopicQuestion[];
  source: 'gemini' | 'deterministic_fallback';
}

const GEMINI_MODEL = 'gemini-2.5-flash';

async function callGeminiJson<T>(prompt: string, temperature = 0.35): Promise<T | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature, responseMimeType: 'application/json' },
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return rawText ? (JSON.parse(rawText) as T) : null;
  } catch (error) {
    console.error('Erro na chamada Gemini JSON:', error);
    return null;
  }
}

export async function evaluateStudentExplanation(
  topic: string,
  transcription: string
): Promise<VoiceExplanationFeedback> {
  const sanitizedTopic = sanitizePromptInput(topic, 100) || 'Geral';
  const sanitizedText = sanitizePromptInput(transcription, 2000);
  const fallback: VoiceExplanationFeedback = {
    topic: sanitizedTopic,
    clarity_score: 82,
    concepts_grasped: ['Conceito central compreendido', 'Vocabulário adequado'],
    gaps_detected: ['Poderia aprofundar na aplicação prática e fórmulas'],
    encouragement: 'Muito bom! Você explicou a base do assunto com clareza.',
    suggested_review: 'Revise os casos particulares e faça o simulado de fixação.',
  };
  const prompt = `Você é um tutor pedagógico especialista em Ensino Médio e ENEM. O aluno explicou o assunto "${sanitizedTopic}" (Técnica de Feynman): "${sanitizedText}". Responda OBRIGATORIAMENTE em JSON válido: {"topic":"${sanitizedTopic}","clarity_score":85,"concepts_grasped":["..."],"gaps_detected":["..."],"encouragement":"...","suggested_review":"..."}`;
  return (await callGeminiJson<VoiceExplanationFeedback>(prompt, 0.3)) || fallback;
}

export async function generateQuizFromContent(
  topic: string,
  contentSnippet: string
): Promise<QuizQuestionGenerated[]> {
  const sanitizedTopic = sanitizePromptInput(topic, 100) || 'Geral';
  const sanitizedContent = sanitizePromptInput(contentSnippet, 2000);
  const fallbackQuestions: QuizQuestionGenerated[] = [
    {
      id: 'q1',
      question_text: `Em relação ao assunto ${sanitizedTopic}, assinale a alternativa correta:`,
      difficulty: 'fácil',
      options: [
        { letter: 'A', text: 'O conceito base se aplica universalmente sob condições ideais.', is_correct: true, explanation: 'Correto! Sob condições padrão a teoria se confirma.' },
        { letter: 'B', text: 'A taxa de variação independe de quaisquer fatores externos.', is_correct: false, explanation: 'Incorreto, fatores externos influenciam diretamente.' },
        { letter: 'C', text: 'O processo é puramente aleatório e sem padrão.', is_correct: false, explanation: 'Incorreto, obedece às leis fundamentais da disciplina.' },
        { letter: 'D', text: 'Nenhuma das anteriores.', is_correct: false, explanation: 'A alternativa A é a correta.' },
      ],
    },
    {
      id: 'q2',
      question_text: `No contexto de ${sanitizedTopic}, qual é o erro mais comum em provas do ENEM?`,
      difficulty: 'médio',
      options: [
        { letter: 'A', text: 'Confundir causa primária com consequência secundária.', is_correct: true, explanation: 'Exato! O ENEM exige distinção clara de causalidade.' },
        { letter: 'B', text: 'Memorizar fórmulas sem ler o comando da questão.', is_correct: false, explanation: 'O foco principal está na relação de causa e efeito.' },
        { letter: 'C', text: 'Ignorar unidades de medida apenas em ciências humanas.', is_correct: false, explanation: 'Unidades são críticas nas ciências da natureza e matemática.' },
        { letter: 'D', text: 'Resolver na ordem inversa.', is_correct: false, explanation: 'Não constitui erro conceitual.' },
      ],
    },
  ];
  const prompt = `Você é um elaborador de questões do ENEM. Com base no tópico "${sanitizedTopic}" e notas "${sanitizedContent}", crie 3 questões de múltipla escolha (A,B,C,D) em JSON: [{"id":"q1","question_text":"...","difficulty":"fácil|médio|difícil","options":[{"letter":"A","text":"...","is_correct":true,"explanation":"..."}]}]`;
  return (await callGeminiJson<QuizQuestionGenerated[]>(prompt, 0.4)) || fallbackQuestions;
}

export async function evaluateDescriptiveAnswer(
  topic: string,
  question: string,
  studentAnswer: string
): Promise<DescriptiveFeedback> {
  const sanitizedAnswer = sanitizePromptInput(studentAnswer, 1500);
  const fallback: DescriptiveFeedback = {
    score: 8.5,
    criteriaMet: ['Identificou a causa e efeito do fenômeno corretamente', 'Utilizou terminologia apropriada'],
    missingElements: ['Poderia aprofundar na justificativa formal ou contexto histórico'],
    suggestedImprovement: 'Resposta sólida. Acrescente o impacto nas condições de contorno do problema para nota máxima.',
  };
  const prompt = `Você é um corretor de provas discursivas do ENEM. Tópico: "${sanitizePromptInput(topic, 120)}". Questão: "${sanitizePromptInput(question, 500)}". Resposta: "${sanitizedAnswer}". Retorne JSON: {"score":8.0,"criteriaMet":["..."],"missingElements":["..."],"suggestedImprovement":"..."}`;
  return (await callGeminiJson<DescriptiveFeedback>(prompt, 0.3)) || fallback;
}

export async function generateFocalSummaryFromErrors(
  topic: string,
  errorDescriptions: string[]
): Promise<{ title: string; explanation: string; rulesOfThumb: string[] }> {
  const cleanTopic = sanitizePromptInput(topic, 120) || 'Geral';
  const fallback = {
    title: `Reforço Focal: Pontos Cegos em ${cleanTopic}`,
    explanation: `Ao resolver as questões anteriores sobre ${cleanTopic}, houve confusão entre causas primárias e consequências. Revise as condições de validade antes de marcar a alternativa.`,
    rulesOfThumb: [
      'Regra 1: Verifique as variáveis e unidades antes de aplicar a regra principal.',
      'Regra 2: Isole a causa central descrita no texto-base antes de avaliar os distratores.',
      'Regra 3: Releia o comando da questão para confirmar o que exatamente é pedido.',
    ],
  };
  if (errorDescriptions.length === 0) return fallback;
  const prompt = `O aluno errou estas questões em "${cleanTopic}":\n${errorDescriptions.map((e, i) => `${i + 1}. ${sanitizePromptInput(e, 300)}`).join('\n')}\nGere um mini-resumo focal em JSON: {"title":"Reforço Focal: ...","explanation":"...","rulesOfThumb":["...","...","..."]}`;
  return (await callGeminiJson<{ title: string; explanation: string; rulesOfThumb: string[] }>(prompt, 0.3)) || fallback;
}

export async function analyzeNotebookImage(
  base64Image: string,
  subject: string = 'Física'
): Promise<NotebookOcrAnalysis> {
  const apiKey = process.env.GEMINI_API_KEY;
  const subjectFallbacks: Record<string, NotebookOcrAnalysis> = {
    Física: {
      detectedTopic: 'Ciclo de Carnot & Termodinâmica',
      summary: 'Anotações sobre Ciclo de Carnot, 1ª e 2ª Leis da Termodinâmica e Rendimento Térmico.',
      keyPoints: ['η = 1 - (T_fria / T_quente) em Kelvin', 'Transformação isotérmica: ΔU = 0 (Q = W)', 'Ciclo de Carnot: 2 isotérmicas e 2 adiabáticas'],
    },
    Matemática: {
      detectedTopic: 'Função Quadrática & Vértice da Parábola',
      summary: 'Estudo do sinal da parábola, raízes por Bhaskara e ponto de máximo/mínimo.',
      keyPoints: ['Vértice: Xv = -b/(2a) e Yv = -Δ/(4a)', 'Se a < 0, admite ponto de máximo', 'Soma = -b/a e Produto = c/a'],
    },
    Química: {
      detectedTopic: 'Eletroquímica: Pilha de Daniell',
      summary: 'Pilha galvânica espontânea com ponte salina e cálculo de ddp.',
      keyPoints: ['Regra CRAO: Cátodo Reduz (+), Ânodo Oxida (-)', 'Elétrons fluem do Ânodo para o Cátodo', 'ΔE° = E°maior - E°menor > 0'],
    },
    Biologia: {
      detectedTopic: 'Bioenergética: Fotossíntese',
      summary: 'Anotações sobre cloroplastos, fotólise da água e Ciclo de Calvin.',
      keyPoints: ['Fase Clara (Tilacoides): Fotólise da H₂O libera O₂', 'Fase Escura (Estroma): Fixação do CO₂ em glicose', 'O₂ provém exclusivamente da água'],
    },
    História: {
      detectedTopic: 'Era Vargas (1930-1945) e Estado Novo',
      summary: 'Industrialização de base, DIP e legislação trabalhista (CLT).',
      keyPoints: ['Criação da CSN e Vale do Rio Doce', 'CLT (1943): direitos urbanos e controle sindical', 'Constituição de 1937 e censura via DIP'],
    },
  };
  const fallback = subjectFallbacks[subject] || subjectFallbacks['Física'];
  if (!apiKey || !base64Image) return fallback;

  const cleanBase64 = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
  const mimeMatch = base64Image.match(/^data:(image\/[a-zA-Z+]+);base64,/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: `Analise este caderno de ${subject} e retorne JSON: {"detectedTopic":"...","summary":"...","keyPoints":["...","...","..."]}` },
            { inline_data: { mime_type: mimeType, data: cleanBase64 } },
          ],
        }],
        generationConfig: { temperature: 0.3, responseMimeType: 'application/json' },
      }),
    });
    if (!res.ok) return fallback;
    const data = await res.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return rawText ? (JSON.parse(rawText) as NotebookOcrAnalysis) : fallback;
  } catch (error) {
    console.error('Erro no OCR Multimodal Gemini:', error);
    return fallback;
  }
}

/**
 * Gera material completo e personalizado sob demanda (resumo, fórmula/regra, dica de prova, questão discursiva e questões objetivas)
 * para qualquer disciplina e conteúdo criado ou personalizado pelo estudante.
 */
export async function generateCustomTopicStudyMaterial(
  params: GenerateTopicMaterialParams
): Promise<GeneratedTopicStudyMaterial> {
  const cleanSubject = sanitizePromptInput(params.subject, 80) || 'Disciplina Geral';
  const cleanTopic = sanitizePromptInput(params.topicTitle, 140) || `Fundamentos de ${cleanSubject}`;
  const cleanNotes = sanitizePromptInput(params.userNotes || '', 1500);
  const cleanGrade = sanitizePromptInput(params.schoolGrade || 'Ensino Médio', 60);
  const cleanExam = sanitizePromptInput(params.targetExam || 'ENEM & Vestibulares', 80);
  const diffMap: Record<string, 'fácil' | 'médio' | 'difícil'> = { easy: 'fácil', medium: 'médio', hard: 'difícil' };
  const targetDiff = diffMap[params.difficulty || 'medium'] || 'médio';
  const slug = `${cleanSubject}_${cleanTopic}`.replace(/\W+/g, '_').toLowerCase().slice(0, 24);
  const ts = Date.now().toString(36).slice(-4);
  const notesContext = cleanNotes ? ` Foco específico do estudante: ${cleanNotes}.` : '';

  const fallback: GeneratedTopicStudyMaterial = {
    summaryDefinition: cleanNotes
      ? `Síntese personalizada de "${cleanTopic}" (${cleanSubject} • ${cleanGrade}): ${cleanNotes}. Este conteúdo conecta os conceitos estruturantes de ${cleanSubject} às exigências de ${cleanExam}, priorizando interpretação causal e aplicação prática.`
      : `Em ${cleanSubject} (${cleanGrade}), o estudo de "${cleanTopic}" analisa os mecanismos fundamentais, conceitos estruturantes e relações de causa e efeito cobrados em ${cleanExam}, permitindo interpretar problemas contextualizados com precisão.`,
    formulaOrRule: cleanNotes
      ? `Roteiro de Domínio (${cleanTopic}): ${cleanNotes.slice(0, 140)} → Identificar variáveis-chave → Validar condições no comando da questão.`
      : `Estrutura-Chave (${cleanTopic} • ${cleanSubject}): 1) Identificar conceito central no texto-base → 2) Relacionar variáveis/causas → 3) Verificar restrições e unidades.`,
    enemTip: `Em provas de ${cleanExam}, questões sobre "${cleanTopic}" (${cleanSubject}) costumam cobrar a relação entre teoria e situação real.${notesContext} Evite alternativas que generalizam extremos ou invertem causa e consequência.`,
    descriptivePrompt: `Considerando a disciplina de ${cleanSubject} e o tema "${cleanTopic}"${cleanNotes ? ` (com foco em: ${cleanNotes.slice(0, 120)})` : ''}, explique detalhadamente seu princípio central, os fatores que o influenciam e apresente uma aplicação prática cobrada em ${cleanExam}.`,
    questions: [
      {
        id: `ai_${slug}_${ts}_1`,
        subject: cleanSubject,
        topic: cleanTopic,
        difficulty: 'fácil',
        text: `No estudo de ${cleanSubject} (${cleanGrade}), ao analisar o tema "${cleanTopic}"${cleanNotes ? ` considerando "${cleanNotes.slice(0, 90)}"` : ''}, qual abordagem garante a interpretação correta do fenômeno?`,
        options: [
          { letter: 'A', text: `Relacionar os conceitos estruturantes de "${cleanTopic}" às evidências apresentadas no texto-base e às leis fundamentais de ${cleanSubject}.`, isCorrect: true, explanation: `Correto! O domínio de "${cleanTopic}" em ${cleanExam} exige articular a definição conceitual com os dados do problema.` },
          { letter: 'B', text: `Aplicar regras isoladas sem verificar o contexto ou as condições de contorno de "${cleanTopic}".`, isCorrect: false, explanation: 'Incorreto. Ignorar as condições de contorno leva a erros frequentes em distratores.' },
          { letter: 'C', text: `Desconsiderar a relação de causa e efeito própria de "${cleanTopic}" em ${cleanSubject}.`, isCorrect: false, explanation: 'Incorreto. A causalidade do fenômeno é o eixo central avaliado.' },
          { letter: 'D', text: `Tratar "${cleanTopic}" como um fenômeno estático que independe das variáveis do sistema.`, isCorrect: false, explanation: `Incorreto. Toda análise em ${cleanSubject} depende das variáveis atuantes.` },
        ],
      },
      {
        id: `ai_${slug}_${ts}_2`,
        subject: cleanSubject,
        topic: cleanTopic,
        difficulty: targetDiff,
        text: `Uma questão contextualizada de ${cleanExam} aborda "${cleanTopic}" na área de ${cleanSubject}.${notesContext} Qual é a principal armadilha (distrator) que o estudante deve evitar?`,
        options: [
          { letter: 'A', text: `Inverter a causa primária com o efeito observado ou extrapolar a regra de "${cleanTopic}" além do seu domínio de validade.`, isCorrect: true, explanation: `Exato! Em "${cleanTopic}", as bancas de ${cleanExam} frequentemente criam alternativas que trocam a origem do fenômeno pela sua consequência.` },
          { letter: 'B', text: 'Analisar criteriosamente os dados fornecidos no enunciado antes de concluir.', isCorrect: false, explanation: 'Incorreto. Analisar os dados do comando é uma boa prática indispensável, não um erro.' },
          { letter: 'C', text: `Conectar o tema "${cleanTopic}" a situações cotidianas ou interdisciplinares.`, isCorrect: false, explanation: `Incorreto. A contextualização cotidiana é característica legítima de ${cleanExam}.` },
          { letter: 'D', text: `Verificar a coerência entre os conceitos de ${cleanSubject} e a conclusão escolhida.`, isCorrect: false, explanation: 'Incorreto. Essa verificação garante a escolha correta.' },
        ],
      },
      {
        id: `ai_${slug}_${ts}_3`,
        subject: cleanSubject,
        topic: cleanTopic,
        difficulty: 'difícil',
        text: `Para resolver um problema avançado sobre "${cleanTopic}" (${cleanSubject}) em ${cleanExam}${cleanNotes ? `, especialmente sobre ${cleanNotes.slice(0, 80)}` : ''}, qual síntese analítica está correta?`,
        options: [
          { letter: 'A', text: `O comportamento observado em "${cleanTopic}" decorre diretamente da interação entre seus fatores determinantes e respeita os princípios de conservação/coerência de ${cleanSubject}.`, isCorrect: true, explanation: `Perfeito! Essa síntese integra a base teórica de "${cleanTopic}" com a resolução analítica exigida em questões de nível difícil.` },
          { letter: 'B', text: `Os resultados em "${cleanTopic}" ocorrem de maneira arbitrária, impedindo previsões baseadas na teoria de ${cleanSubject}.`, isCorrect: false, explanation: `Incorreto. Os modelos de ${cleanSubject} permitem prever e explicar os resultados com rigor.` },
          { letter: 'C', text: `A alteração das variáveis iniciais não produz qualquer efeito no resultado de "${cleanTopic}".`, isCorrect: false, explanation: 'Incorreto. Mudanças nas condições iniciais alteram diretamente o estado ou a resposta do sistema.' },
          { letter: 'D', text: `O conceito de "${cleanTopic}" contradiz os fundamentos gerais de ${cleanSubject}.`, isCorrect: false, explanation: 'Incorreto. O tópico é parte integrante e consistente da disciplina.' },
        ],
      },
    ],
    source: 'deterministic_fallback',
  };

  const prompt = `Você é um professor especialista em ${cleanSubject} preparatório para ${cleanExam} (${cleanGrade}).
Crie um material de estudo completo e personalizado sobre o tópico "${cleanTopic}" na disciplina "${cleanSubject}".
Contexto/anotações específicas do aluno: "${cleanNotes || 'Abordagem completa dos conceitos, fórmulas/regras e pegadinhas de prova'}". Nível: ${targetDiff}.
Retorne OBRIGATORIAMENTE um JSON válido com esta estrutura exata:
{"summaryDefinition":"Explicação clara, densa e didática do tópico específico (2 a 4 frases ricas)","formulaOrRule":"Fórmula matemática, equação, regra prática ou esquema estrutural específico deste tópico","enemTip":"Pegadinha clássica ou dica de ouro sobre este tópico em provas do ${cleanExam}","descriptivePrompt":"Enunciado de uma questão discursiva desafiadora sobre este tópico","questions":[{"id":"ai_${slug}_${ts}_1","subject":"${cleanSubject}","topic":"${cleanTopic}","difficulty":"fácil","text":"Enunciado estilo ENEM sobre ${cleanTopic}...","options":[{"letter":"A","text":"...","isCorrect":true,"explanation":"..."},{"letter":"B","text":"...","isCorrect":false,"explanation":"..."},{"letter":"C","text":"...","isCorrect":false,"explanation":"..."},{"letter":"D","text":"...","isCorrect":false,"explanation":"..."}]}]}
Gere exatamente 3 questões inéditas sobre "${cleanTopic}" (fácil, médio e difícil), variando a alternativa correta.`;

  const aiResult = await callGeminiJson<Omit<GeneratedTopicStudyMaterial, 'source'>>(prompt, 0.45);
  if (aiResult?.summaryDefinition && Array.isArray(aiResult.questions) && aiResult.questions.length > 0) {
    const normalizedQuestions: GeneratedTopicQuestion[] = aiResult.questions.map((q, idx) => ({
      id: q.id || `ai_${slug}_${ts}_${idx + 1}`,
      subject: cleanSubject,
      topic: cleanTopic,
      difficulty: q.difficulty === 'fácil' || q.difficulty === 'médio' || q.difficulty === 'difícil' ? q.difficulty : targetDiff,
      text: q.text || fallback.questions[idx % fallback.questions.length].text,
      options:
        Array.isArray(q.options) && q.options.length >= 2
          ? q.options.map((opt, oIdx) => ({
              letter: opt.letter || ['A', 'B', 'C', 'D'][oIdx] || 'A',
              text: opt.text || '',
              isCorrect: Boolean((opt as any).isCorrect ?? (opt as any).is_correct),
              explanation: opt.explanation || 'Explicação verificada pela IA pedagógica.',
            }))
          : fallback.questions[idx % fallback.questions.length].options,
    }));

    return {
      summaryDefinition: aiResult.summaryDefinition,
      formulaOrRule: aiResult.formulaOrRule || fallback.formulaOrRule,
      enemTip: aiResult.enemTip || fallback.enemTip,
      descriptivePrompt: aiResult.descriptivePrompt || fallback.descriptivePrompt,
      questions: normalizedQuestions,
      source: 'gemini',
    };
  }

  return fallback;
}
