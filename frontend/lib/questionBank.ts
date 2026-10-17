/**
 * Banco Estruturado & Gerador Dinâmico Multi-Disciplinas e Multi-Conteúdos (SaaS)
 * Suporta disciplinas padrão do Ensino Médio/ENEM e qualquer disciplina/conteúdo customizado pelo estudante.
 */

export interface BankQuestion {
  id: string;
  subject: string;
  topic: string;
  difficulty: 'fácil' | 'médio' | 'difícil';
  text: string;
  options: { letter: string; text: string; isCorrect: boolean; explanation: string }[];
  selectedLetter?: string;
}

export interface SubjectStudyData {
  subject: string;
  defaultTopic: string;
  suggestedTopics: string[];
  generalSummary: { definition: string; formulaOrRule: string; enemTip: string };
  descriptivePrompt: string;
  questions: BankQuestion[];
}

export interface TopicStudyOverride {
  id?: string;
  title?: string;
  summaryText?: string;
  formulaOrRule?: string;
  enemTip?: string;
  descriptivePrompt?: string;
  customQuestions?: BankQuestion[];
  generatedStudyData?: {
    summaryDefinition?: string;
    formulaOrRule?: string;
    enemTip?: string;
    descriptivePrompt?: string;
    questions?: BankQuestion[];
  };
}

export const SUBJECT_STUDY_BANK: Record<string, SubjectStudyData> = {
  'Física': {
    subject: 'Física',
    defaultTopic: 'Termodinâmica & Conservação de Energia',
    suggestedTopics: ['Termodinâmica & Conservação de Energia', 'Cinemática & Leis de Newton', 'Eletrodinâmica & Circuitos Elétricos', 'Ondulatória & Óptica Geométrica'],
    generalSummary: {
      definition: 'As leis da Termodinâmica descrevem como o calor (Q), o trabalho mecânico (W) e a energia interna (ΔU) interagem em sistemas físicos.',
      formulaOrRule: '1ª Lei: ΔU = Q - W  |  Rendimento de Carnot: η = 1 - (T_fria / T_quente)',
      enemTip: 'No ENEM, diferencie sempre transformação isotérmica (temperatura constante, ΔU = 0) de adiabática (sem troca de calor, Q = 0, como em aerossóis).',
    },
    descriptivePrompt: 'Explique por que a conservação da energia mecânica só é válida na ausência de forças dissipativas e como a 2ª Lei da Termodinâmica impede máquinas térmicas com 100% de eficiência.',
    questions: [
      {
        id: 'fis_1', subject: 'Física', topic: 'Termodinâmica & Conservação de Energia', difficulty: 'fácil',
        text: 'Na Primeira Lei da Termodinâmica (ΔU = Q - W), se um gás ideal sofre uma transformação isotérmica e realiza 300 J de trabalho, quanto de calor ele trocou com o meio?',
        options: [
          { letter: 'A', text: 'Recebeu 300 J de calor.', isCorrect: true, explanation: 'Correto! Em transformações isotérmicas a temperatura não varia (ΔU = 0), logo Q = W = 300 J.' },
          { letter: 'B', text: 'Perdeu 300 J de calor.', isCorrect: false, explanation: 'Incorreto. Para expandir mantendo a temperatura constante, o gás precisa receber calor.' },
          { letter: 'C', text: 'A troca de calor foi nula (adiabática).', isCorrect: false, explanation: 'Incorreto. Q = 0 ocorre em transformações adiabáticas, não isotérmicas.' },
          { letter: 'D', text: 'Recebeu 600 J de calor.', isCorrect: false, explanation: 'Incorreto. Como ΔU = 0, o calor recebido iguala exatamente o trabalho.' },
        ],
      },
      {
        id: 'fis_2', subject: 'Física', topic: 'Termodinâmica & Conservação de Energia', difficulty: 'médio',
        text: 'Qual das alternativas descreve corretamente a Segunda Lei da Termodinâmica (Enunciado de Clausius)?',
        options: [
          { letter: 'A', text: 'A energia total do universo é sempre constante.', isCorrect: false, explanation: 'Incorreto. Este é o princípio da conservação da energia (1ª Lei).' },
          { letter: 'B', text: 'O calor flui espontaneamente de corpos frios para corpos quentes.', isCorrect: false, explanation: 'Incorreto. O fluxo espontâneo é sempre do corpo de maior para o de menor temperatura.' },
          { letter: 'C', text: 'É impossível transferir calor de um corpo frio para um quente sem trabalho externo.', isCorrect: true, explanation: 'Exato! Refrigeradores e aparelhos de ar-condicionado exigem trabalho elétrico do compressor.' },
          { letter: 'D', text: 'O rendimento de qualquer máquina térmica atinge 100% no vácuo.', isCorrect: false, explanation: 'Incorreto. Pelo teorema de Carnot, nenhuma máquina térmica atinge 100% de rendimento.' },
        ],
      },
      {
        id: 'fis_3', subject: 'Física', topic: 'Termodinâmica & Conservação de Energia', difficulty: 'médio',
        text: 'Ao pressionar a válvula de um desodorante aerossol, o gás expande muito rapidamente e o frasco esfria. Esse resfriamento ocorre porque a expansão é:',
        options: [
          { letter: 'A', text: 'Adiabática, realizando trabalho à custa da própria energia interna.', isCorrect: true, explanation: 'Perfeito! Como é rápida demais para trocar calor (Q ≈ 0), ΔU = -W, reduzindo a temperatura.' },
          { letter: 'B', text: 'Isovolumétrica, reduzindo a pressão sem realizar trabalho.', isCorrect: false, explanation: 'Incorreto. O gás se expande para fora do frasco, portanto há variação de volume.' },
          { letter: 'C', text: 'Isotérmica, absorvendo calor latente da mão do usuário.', isCorrect: false, explanation: 'Incorreto. A queda de temperatura mostra que não é isotérmica.' },
          { letter: 'D', text: 'Isobárica, mantendo a pressão interna constante.', isCorrect: false, explanation: 'Incorreto. A pressão interna cai com a saída do gás.' },
        ],
      },
      {
        id: 'fis_4', subject: 'Física', topic: 'Eletrodinâmica & Circuitos Elétricos', difficulty: 'fácil',
        text: 'Um chuveiro elétrico de potência 4400 W é utilizado durante 15 minutos (0,25 h) por dia. Qual é o consumo diário de energia elétrica em kWh?',
        options: [
          { letter: 'A', text: '1,1 kWh', isCorrect: true, explanation: 'Correto! E = P × Δt = 4,4 kW × 0,25 h = 1,1 kWh.' },
          { letter: 'B', text: '4,4 kWh', isCorrect: false, explanation: 'Incorreto. 4,4 kWh seria o consumo em 1 hora inteira de uso.' },
          { letter: 'C', text: '66,0 kWh', isCorrect: false, explanation: 'Incorreto. É necessário converter minutos para horas (15 min = 0,25 h).' },
          { letter: 'D', text: '0,44 kWh', isCorrect: false, explanation: 'Incorreto. 4,4 × 0,25 resulta em 1,1 kWh.' },
        ],
      },
    ],
  },
  'Matemática': {
    subject: 'Matemática',
    defaultTopic: 'Funções, Geometria & Análise Combinatória',
    suggestedTopics: ['Funções, Geometria & Análise Combinatória', 'Matemática Financeira & Porcentagem', 'Probabilidade & Estatística ENEM', 'Trigonometria & Geometria Espacial'],
    generalSummary: {
      definition: 'Funções descrevem relações de dependência entre grandezas: a função afim modela crescimento linear e a quadrática modela trajetórias parabólicas e otimização (máximos/mínimos).',
      formulaOrRule: 'Afim: f(x) = ax + b  |  Vértice da Parábola: Xv = -b / (2a), Yv = -Δ / (4a)',
      enemTip: 'Quando a questão pedir "lucro máximo" ou "custo mínimo" em uma função do 2º grau, verifique se ela pede o valor de x (use Xv) ou o valor máximo atingido (use Yv).',
    },
    descriptivePrompt: 'Explique a diferença geométrica e algébrica entre progressão aritmética (crescimento linear/função afim) e progressão geométrica (crescimento exponencial), citando um exemplo prático.',
    questions: [
      {
        id: 'mat_1', subject: 'Matemática', topic: 'Funções, Geometria & Análise Combinatória', difficulty: 'médio',
        text: 'O lucro mensal L(x) de uma startup, em milhares de reais, em função do preço x de assinatura é dado por L(x) = -x² + 20x - 60. Qual deve ser o preço x para que o lucro seja máximo?',
        options: [
          { letter: 'A', text: 'R$ 10,00', isCorrect: true, explanation: 'Correto! O preço que maximiza é o X do vértice: Xv = -b / (2a) = -20 / (2 × -1) = 10.' },
          { letter: 'B', text: 'R$ 40,00', isCorrect: false, explanation: 'Incorreto. 40 milhares de reais é o lucro máximo (Yv), não o preço x.' },
          { letter: 'C', text: 'R$ 20,00', isCorrect: false, explanation: 'Incorreto. Lembre-se de dividir por 2a na fórmula Xv = -b / (2a).' },
          { letter: 'D', text: 'R$ 60,00', isCorrect: false, explanation: 'Incorreto. -60 é o termo independente (custo fixo).' },
        ],
      },
      {
        id: 'mat_2', subject: 'Matemática', topic: 'Probabilidade & Estatística ENEM', difficulty: 'fácil',
        text: 'Em uma sala de Ensino Médio com 40 alunos, 24 praticam esportes e 16 tocam algum instrumento musical, sendo que 8 fazem ambos. Escolhendo um aluno ao acaso, qual a probabilidade de ele praticar esporte OU tocar instrumento?',
        options: [
          { letter: 'A', text: '80% (32/40)', isCorrect: true, explanation: 'Correto! Pelo princípio da inclusão-exclusão: 24 + 16 - 8 = 32 alunos. 32 / 40 = 0,80 = 80%.' },
          { letter: 'B', text: '100% (40/40)', isCorrect: false, explanation: 'Incorreto. Somar 24 + 16 sem subtrair a interseção (8) conta duas vezes quem faz ambos.' },
          { letter: 'C', text: '60% (24/40)', isCorrect: false, explanation: 'Incorreto. 60% considera apenas os que praticam esportes.' },
          { letter: 'D', text: '20% (8/40)', isCorrect: false, explanation: 'Incorreto. 20% é a interseção (esporte E instrumento).' },
        ],
      },
      {
        id: 'mat_3', subject: 'Matemática', topic: 'Funções, Geometria & Análise Combinatória', difficulty: 'médio',
        text: 'Em uma maquete na escala 1:50, a área do piso de uma quadra poliesportiva mede 200 cm². Qual é a área real dessa quadra em metros quadrados (m²)?',
        options: [
          { letter: 'A', text: '50 m²', isCorrect: true, explanation: 'Correto! Para áreas, a razão é elevada ao quadrado: 200 cm² × 50² = 200 × 2500 = 500.000 cm² = 50 m².' },
          { letter: 'B', text: '1 m²', isCorrect: false, explanation: 'Incorreto. Multiplicar apenas por 50 serve para medidas lineares, não de área.' },
          { letter: 'C', text: '500 m²', isCorrect: false, explanation: 'Incorreto. Cuidado na conversão de cm² para m² (dividir por 10.000).' },
          { letter: 'D', text: '100 m²', isCorrect: false, explanation: 'Incorreto. 500.000 cm² dividido por 10.000 equivale a 50 m².' },
        ],
      },
    ],
  },
  'Química': {
    subject: 'Química',
    defaultTopic: 'Estequiometria, Eletroquímica & Equilíbrio',
    suggestedTopics: ['Estequiometria, Eletroquímica & Equilíbrio', 'Química Orgânica & Funções Oxigenadas', 'Termoquímica & Cinética Química', 'Ligações Químicas & Forças Intermoleculares'],
    generalSummary: {
      definition: 'A Eletroquímica estuda a conversão entre energia química e elétrica (Pilhas espontâneas vs. Eletrólise não-espontânea), enquanto o Equilíbrio Químico analisa reações reversíveis.',
      formulaOrRule: 'Pilha (CRAO): Cátodo Reduz, Ânodo Oxida  |  ΔE° = E°maior - E°menor > 0',
      enemTip: 'Na pilha, os elétrons fluem sempre do Ânodo (menor potencial de redução, sofre corrosão) para o Cátodo (maior potencial de redução, ganha massa).',
    },
    descriptivePrompt: 'Explique como funciona a proteção catódica (metal de sacrifício) usada em cascos de navios e tubulações subterrâneas com base nos potenciais de redução.',
    questions: [
      {
        id: 'qui_1', subject: 'Química', topic: 'Estequiometria, Eletroquímica & Equilíbrio', difficulty: 'médio',
        text: 'Em uma pilha de Daniell formada por eletrodos de Zinco (E°red = -0,76 V) e Cobre (E°red = +0,34 V), o que ocorre durante o funcionamento espontâneo?',
        options: [
          { letter: 'A', text: 'O eletrodo de zinco sofre oxidação (corrosão) e os elétrons fluem para o cobre.', isCorrect: true, explanation: 'Correto! O zinco tem menor potencial de redução, logo atua como ânodo e oxida.' },
          { letter: 'B', text: 'O eletrodo de cobre sofre desgaste e diminui de massa.', isCorrect: false, explanation: 'Incorreto. No cátodo (cobre), íons Cu²⁺ sofrem redução e se depositam, aumentando a massa.' },
          { letter: 'C', text: 'A ddp (diferença de potencial) da pilha é de -0,42 V.', isCorrect: false, explanation: 'Incorreto. ΔE° = +0,34 - (-0,76) = +1,10 V.' },
          { letter: 'D', text: 'Os elétrons fluem pela ponte salina.', isCorrect: false, explanation: 'Incorreto. Pela ponte salina migram apenas íons; elétrons fluem pelo fio condutor externo.' },
        ],
      },
      {
        id: 'qui_2', subject: 'Química', topic: 'Estequiometria, Eletroquímica & Equilíbrio', difficulty: 'fácil',
        text: 'Um suco cítrico apresenta concentração de íons H⁺ igual a 10⁻³ mol/L a 25 °C. Qual é o valor do pH dessa solução e sua classificação?',
        options: [
          { letter: 'A', text: 'pH = 3 (Ácida)', isCorrect: true, explanation: 'Correto! pH = -log[H⁺] = -log(10⁻³) = 3. Como é menor que 7, é ácida.' },
          { letter: 'B', text: 'pH = 11 (Básica)', isCorrect: false, explanation: 'Incorreto. 11 seria o pOH da solução (pH + pOH = 14).' },
          { letter: 'C', text: 'pH = 7 (Neutra)', isCorrect: false, explanation: 'Incorreto. Solução neutra possui [H⁺] = 10⁻⁷ mol/L.' },
          { letter: 'D', text: 'pH = -3 (Ácida)', isCorrect: false, explanation: 'Incorreto. A definição tem sinal negativo (-log), tornando o resultado positivo.' },
        ],
      },
    ],
  },
  'Biologia': {
    subject: 'Biologia',
    defaultTopic: 'Bioenergética, Ecologia & Genética',
    suggestedTopics: ['Bioenergética, Ecologia & Genética', 'Citologia & Membrana Plasmática', 'Fisiologia Humana & Imunologia', 'Evolução Biológica & Biotecnologia'],
    generalSummary: {
      definition: 'A Fotossíntese converte energia luminosa em energia química (glicose) nos cloroplastos, enquanto a Respiração Celular degrada glicose nas mitocôndrias para gerar ATP.',
      formulaOrRule: 'Fotossíntese: 6 CO₂ + 6 H₂O + Luz → C₆H₁₂O₆ + 6 O₂ (O₂ vem da fotólise da água!)',
      enemTip: 'Pegadinha clássica: o oxigênio liberado pelas plantas na fotossíntese provém da quebra da molécula de ÁGUA (H₂O) na fase clara, e não do gás carbônico (CO₂).',
    },
    descriptivePrompt: 'Diferencie o processo de eutrofização artificial em lagos (causado por esgoto doméstico ou fertilizantes) da magnificação trófica causada por metais pesados.',
    questions: [
      {
        id: 'bio_1', subject: 'Biologia', topic: 'Bioenergética, Ecologia & Genética', difficulty: 'médio',
        text: 'Experimentos utilizando isótopos marcados de oxigênio (¹⁸O) comprovaram que o gás oxigênio (O₂) liberado para a atmosfera durante a fotossíntese provém diretamente da:',
        options: [
          { letter: 'A', text: 'Fotólise da água (H₂O) na etapa fotoquímica (fase clara).', isCorrect: true, explanation: 'Correto! A reação de Hill quebra a molécula de água liberando O₂, prótons H⁺ e elétrons.' },
          { letter: 'B', text: 'Quebra do gás carbônico (CO₂) no Ciclo de Calvin.', isCorrect: false, explanation: 'Incorreto. O oxigênio do CO₂ passa a compor a glicose e novas moléculas de água.' },
          { letter: 'C', text: 'Degradação da clorofila nos tilacoides.', isCorrect: false, explanation: 'Incorreto. A clorofila é apenas excitada pela luz, doando elétrons.' },
          { letter: 'D', text: 'Cadeia respiratória nas cristas mitocondriais.', isCorrect: false, explanation: 'Incorreto. A cadeia respiratória consome O₂, não o libera.' },
        ],
      },
      {
        id: 'bio_2', subject: 'Biologia', topic: 'Fisiologia Humana & Imunologia', difficulty: 'fácil',
        text: 'Qual é a diferença fundamental entre a atuação imunológica de uma vacina e a de um soro antiofídico?',
        options: [
          { letter: 'A', text: 'A vacina contém antígenos e gera memória imunológica (ativa); o soro fornece anticorpos prontos (passiva).', isCorrect: true, explanation: 'Perfeito! Vacinas são preventivas (imunização ativa) e soros são curativos de emergência (imunização passiva).' },
          { letter: 'B', text: 'O soro estimula a produção de células de memória de longo prazo.', isCorrect: false, explanation: 'Incorreto. Como o soro já entrega anticorpos prontos, o sistema imune não cria memória.' },
          { letter: 'C', text: 'A vacina contém anticorpos purificados para ação imediata contra venenos.', isCorrect: false, explanation: 'Incorreto. Essa é a definição de soro terapêutico.' },
          { letter: 'D', text: 'Ambos possuem exatamente a mesma composição de antígenos atenuados.', isCorrect: false, explanation: 'Incorreto. Vacina tem antígenos; soro tem anticorpos.' },
        ],
      },
    ],
  },
  'História': {
    subject: 'História',
    defaultTopic: 'Era Vargas, Brasil República & Revoluções',
    suggestedTopics: ['Era Vargas, Brasil República & Revoluções', 'Brasil Colônia & Segundo Reinado', 'Iluminismo & Revolução Francesa', 'Guerra Fria & Mundo Contemporâneo'],
    generalSummary: {
      definition: 'A Era Vargas (1930-1945) marcou a transição do modelo agroexportador oligárquico para a industrialização por substituição de importações e a criação da legislação trabalhista (CLT).',
      formulaOrRule: 'Fases: Governo Provisório (30-34) → Constitucional (34-37) → Estado Novo Ditatorial (37-45)',
      enemTip: 'Analise sempre o trabalhismo varguista sob a dupla perspectiva: conquista de direitos sociais urbanos + controle estatal dos sindicatos (peleguismo) e propaganda (DIP).',
    },
    descriptivePrompt: 'Analise o papel do Departamento de Imprensa e Propaganda (DIP) e da Consolidação das Leis do Trabalho (CLT) na construção da base de apoio popular durante o Estado Novo.',
    questions: [
      {
        id: 'his_1', subject: 'História', topic: 'Era Vargas, Brasil República & Revoluções', difficulty: 'médio',
        text: 'Durante o Estado Novo (1937-1945), a promulgação da CLT por Getúlio Vargas representou para a classe trabalhadora urbana brasileira:',
        options: [
          { letter: 'A', text: 'A regulamentação de direitos trabalhistas aliada à subordinação dos sindicatos ao Estado.', isCorrect: true, explanation: 'Correto! Vargas atendeu demandas históricas dos operários, mas atrelou os sindicatos ao Ministério do Trabalho.' },
          { letter: 'B', text: 'A plena liberdade de greve e autonomia sindical frente ao governo federal.', isCorrect: false, explanation: 'Incorreto. Greves foram proibidas pela Constituição Polaca de 1937.' },
          { letter: 'C', text: 'A extensão imediata dos direitos trabalhistas a todos os trabalhadores rurais.', isCorrect: false, explanation: 'Incorreto. O trabalhador rural só foi contemplado décadas depois (Estatuto do Trabalhador Rural em 1963).' },
          { letter: 'D', text: 'O abandono da industrialização de base em favor do café.', isCorrect: false, explanation: 'Incorreto. Vargas impulsionou a indústria de base (CSN e Vale do Rio Doce).' },
        ],
      },
    ],
  },
  'Geografia': {
    subject: 'Geografia',
    defaultTopic: 'Geopolítica, Urbanização & Climatologia',
    suggestedTopics: ['Geopolítica, Urbanização & Climatologia', 'Globalização & Blocos Econômicos', 'Domínios Morfoclimáticos do Brasil', 'Demografia & Migrações'],
    generalSummary: {
      definition: 'A Geografia analisa a relação entre espaço geográfico, dinâmicas climáticas/ambientais (Domínios de Ab’Sáber) e transformações socioeconômicas urbanas e agrárias.',
      formulaOrRule: 'Inversão Térmica = retenção de poluentes no inverno | Ilha de Calor = impermeabilização e concreto urbano',
      enemTip: 'Diferencie Ilha de Calor (fenômeno antrópico contínuo nas metrópoles) de Inversão Térmica (fenômeno natural agravado pela poluição em dias frios).',
    },
    descriptivePrompt: 'Explique as causas e consequências ambientais do processo de arenização e desertificação nos domínios morfoclimáticos brasileiros.',
    questions: [
      {
        id: 'geo_1', subject: 'Geografia', topic: 'Geopolítica, Urbanização & Climatologia', difficulty: 'fácil',
        text: 'Nas grandes metrópoles brasileiras durante o inverno, o ar frio e denso permanece próximo à superfície, impedindo a dispersão vertical de poluentes. Esse fenômeno é denominado:',
        options: [
          { letter: 'A', text: 'Inversão térmica.', isCorrect: true, explanation: 'Correto! O ar frio estacionado na base impede a convecção natural, retendo a camada de poluentes.' },
          { letter: 'B', text: 'Chuva ácida.', isCorrect: false, explanation: 'Incorreto. Chuva ácida resulta da reação de óxidos de enxofre e nitrogênio com a água na atmosfera.' },
          { letter: 'C', text: 'Efeito estufa global.', isCorrect: false, explanation: 'Incorreto. O efeito estufa é a retenção de radiação infravermelha por gases na atmosfera.' },
          { letter: 'D', text: 'El Niño.', isCorrect: false, explanation: 'Incorreto. El Niño é o aquecimento anormal das águas superficiais do Oceano Pacífico Equatorial.' },
        ],
      },
    ],
  },
  'Redação & Linguagens': {
    subject: 'Redação & Linguagens',
    defaultTopic: 'Estrutura Dissertativo-Argumentativa & Funções da Linguagem',
    suggestedTopics: ['Estrutura Dissertativo-Argumentativa & Competências ENEM', 'Funções da Linguagem & Figuras de Estilo', 'Modernismo Brasileiro (1ª, 2ª e 3ª Gerações)', 'Variação Linguística & Interpretação Textual'],
    generalSummary: {
      definition: 'A Redação do ENEM avalia 5 competências (0 a 200 pts cada), exigindo tese clara, repertório sociocultural produtivo e Proposta de Intervenção com 5 elementos obrigatórios.',
      formulaOrRule: '5 Elementos da Competência 5: Agente + Ação + Meio/Modo + Efeito + Detalhamento',
      enemTip: 'Nunca esqueça de detalhar pelo menos um dos 4 elementos principais na conclusão (usando aposto explicativo ou exemplificação) para garantir 200 pontos na Competência 5.',
    },
    descriptivePrompt: 'Elabore um parágrafo de conclusão (Proposta de Intervenção) contendo os 5 elementos obrigatórios do ENEM sobre a democratização do acesso à tecnologia na educação pública.',
    questions: [
      {
        id: 'red_1', subject: 'Redação & Linguagens', topic: 'Estrutura Dissertativo-Argumentativa & Competências ENEM', difficulty: 'fácil',
        text: 'Para atingir a nota máxima (200 pontos) na Competência 5 da Redação do ENEM, a proposta de intervenção deve apresentar obrigatoriamente:',
        options: [
          { letter: 'A', text: '5 elementos: Agente, Ação, Meio/Modo, Efeito e Detalhamento, respeitando os direitos humanos.', isCorrect: true, explanation: 'Perfeito! A ausência de qualquer um dos 5 elementos reduz a nota da Competência 5.' },
          { letter: 'B', text: 'Apenas uma frase motivacional apelando para a conscientização individual.', isCorrect: false, explanation: 'Incorreto. Propostas vagas ("conscientizar a população") sem meio/modo e detalhamento perdem pontos.' },
          { letter: 'C', text: 'Citação obrigatória de três filósofos gregos no último parágrafo.', isCorrect: false, explanation: 'Incorreto. O repertório sociocultural pertence à Competência 2 (desenvolvimento).' },
          { letter: 'D', text: 'Um título centralizado na primeira linha da folha de redação.', isCorrect: false, explanation: 'Incorreto. No ENEM, o título é opcional e não pontua.' },
        ],
      },
    ],
  },
};

/**
 * Gera dados de estudo estruturados e questões contextualizadas para QUALQUER disciplina
 * e QUALQUER conteúdo/tópico (inclusive disciplinas e conteúdos customizados com IA pelo aluno).
 */
export function getDynamicStudyDataForTopic(
  subject: string,
  topicTitle?: string,
  customSummaryText?: string,
  topicOverride?: TopicStudyOverride
): SubjectStudyData {
  const existingBank = SUBJECT_STUDY_BANK[subject];
  const resolvedTopic = topicTitle?.trim() || topicOverride?.title?.trim() || existingBank?.defaultTopic || `Fundamentos de ${subject}`;
  const gen = topicOverride?.generatedStudyData;
  const aiQuestions =
    topicOverride?.customQuestions && topicOverride.customQuestions.length > 0
      ? topicOverride.customQuestions
      : gen?.questions && gen.questions.length > 0
      ? gen.questions
      : undefined;

  const aiDefinition = gen?.summaryDefinition || topicOverride?.summaryText || customSummaryText;
  const aiFormula = topicOverride?.formulaOrRule || gen?.formulaOrRule;
  const aiTip = topicOverride?.enemTip || gen?.enemTip;
  const aiDescriptive = topicOverride?.descriptivePrompt || gen?.descriptivePrompt;

  const hasCustomOverride = Boolean(aiQuestions || aiFormula || aiTip || aiDescriptive || (aiDefinition && aiDefinition.trim().length > 0));
  const isDefaultTopic = Boolean(existingBank && (!topicTitle || topicTitle.trim() === existingBank.defaultTopic));

  if (isDefaultTopic && !hasCustomOverride && existingBank) return existingBank;

  const slug = `${subject}_${resolvedTopic}`.replace(/\s+/g, '_').toLowerCase().slice(0, 20);
  const noteContext = aiDefinition ? ` Considerando o foco "${aiDefinition.slice(0, 100)}",` : '';
  const dynamicQuestions: BankQuestion[] = [
    {
      id: `dyn_${slug}_1`, subject, topic: resolvedTopic, difficulty: 'fácil',
      text: `No estudo de ${subject}, considerando especificamente o tema "${resolvedTopic}",${noteContext} qual é o princípio fundamental para resolver questões de prova com segurança?`,
      options: [
        { letter: 'A', text: `Identificar os conceitos-chave de ${resolvedTopic}, relacionando a definição teórica com sua aplicação prática no contexto do enunciado.`, isCorrect: true, explanation: `Correto! O domínio de "${resolvedTopic}" em ${subject} exige conectar o conceito base diretamente à situação-problema apresentada.` },
        { letter: 'B', text: `Memorizar termos isolados de ${resolvedTopic} sem analisar as condições de contorno do problema.`, isCorrect: false, explanation: 'Incorreto. Provas modernas cobram interpretação contextualizada e causa-efeito, não decoreba isolada.' },
        { letter: 'C', text: 'Desconsiderar as variáveis principais do enunciado e aplicar apenas regras de outras áreas.', isCorrect: false, explanation: 'Incorreto. Os dados do comando da questão são indispensáveis para a resolução.' },
        { letter: 'D', text: `Assumir que ${resolvedTopic} não possui relação com os demais tópicos de ${subject}.`, isCorrect: false, explanation: 'Incorreto. Os conteúdos são cumulativos e interdisciplinares.' },
      ],
    },
    {
      id: `dyn_${slug}_2`, subject, topic: resolvedTopic, difficulty: 'médio',
      text: `Ao analisar uma situação prática envolvendo "${resolvedTopic}" (${subject}), qual é a pegadinha mais recorrente em exames e vestibulares?`,
      options: [
        { letter: 'A', text: `Inverter a relação de causa e consequência ou ignorar as restrições de validade do conceito em ${resolvedTopic}.`, isCorrect: true, explanation: `Exato! Em "${resolvedTopic}", os distratores costumam trocar a causa primária pelo efeito final ou omitir condições essenciais.` },
        { letter: 'B', text: 'Apresentar enunciados sempre sem texto-base ou contextualização.', isCorrect: false, explanation: 'Incorreto. As questões utilizam textos, gráficos e situações cotidianas como ponto de partida.' },
        { letter: 'C', text: 'Exigir apenas cálculos ou respostas que extrapolam totalmente o conteúdo programático.', isCorrect: false, explanation: 'Incorreto. As questões avaliam competências previstas na matriz de referência.' },
        { letter: 'D', text: 'Possuir duas alternativas idênticas como gabarito oficial.', isCorrect: false, explanation: 'Incorreto. Há sempre uma única alternativa que responde integralmente ao comando.' },
      ],
    },
    {
      id: `dyn_${slug}_3`, subject, topic: resolvedTopic, difficulty: 'difícil',
      text: `Em uma revisão avançada de "${resolvedTopic}" na disciplina de ${subject}, a consolidação do conhecimento na memória de longo prazo ocorre de forma mais eficaz quando o estudante:`,
      options: [
        { letter: 'A', text: `Explica o funcionamento de ${resolvedTopic} com suas próprias palavras (Feynman) e revisa os erros de forma espaçada (FSRS).`, isCorrect: true, explanation: `Perfeito! Combinar recuperação ativa sobre "${resolvedTopic}" com repetição espaçada garante retenção superior a 85%.` },
        { letter: 'B', text: 'Apenas relê passivamente o mesmo parágrafo diversas vezes seguidas.', isCorrect: false, explanation: 'Incorreto. A releitura passiva gera ilusão de competência e baixa retenção após 48 horas.' },
        { letter: 'C', text: 'Pula a correção dos erros cometidos nos simulados diagnósticos.', isCorrect: false, explanation: 'Incorreto. Analisar o motivo do erro é a etapa que mais aumenta a pontuação.' },
        { letter: 'D', text: 'Estuda apenas na véspera da avaliação sem testar o conteúdo em questões.', isCorrect: false, explanation: 'Incorreto. O acúmulo de véspera sobrecarrega a memória de trabalho.' },
      ],
    },
  ];

  const matchingExisting = existingBank ? existingBank.questions.filter((q) => q.topic.toLowerCase().includes(resolvedTopic.toLowerCase())) : [];
  // Prioridade 1: Dados personalizados da IA (topicOverride). Prioridade 2: Só usa banco padrão se for tópico padrão.
  const defaultBankSummary = isDefaultTopic ? existingBank?.generalSummary : undefined;

  return {
    subject,
    defaultTopic: resolvedTopic,
    suggestedTopics: existingBank?.suggestedTopics || [resolvedTopic, `Conceitos Fundamentais de ${subject}`, `Aplicações Práticas em ${subject}`, `Revisão Geral de ${subject}`],
    generalSummary: {
      definition: aiDefinition || defaultBankSummary?.definition || `Estudo estruturado do conteúdo "${resolvedTopic}" na disciplina de ${subject}, compreendendo suas definições centrais, mecanismos de causa e efeito e aplicações em provas.`,
      formulaOrRule: aiFormula || defaultBankSummary?.formulaOrRule || `Eixo Estrutural (${resolvedTopic} • ${subject}): Conceito Base → Condições de Validade → Resolução Analítica`,
      enemTip: aiTip || defaultBankSummary?.enemTip || `Ao resolver questões de "${resolvedTopic}", grife sempre o comando da questão e identifique qual fenômeno ou regra de ${subject} conecta o texto-base à alternativa correta.`,
    },
    descriptivePrompt: aiDescriptive || (isDefaultTopic ? existingBank?.descriptivePrompt : undefined) || `Com base nos seus estudos de ${subject}, explique detalhadamente os conceitos fundamentais de "${resolvedTopic}", suas principais características e um exemplo prático de aplicação.`,
    questions: aiQuestions ? aiQuestions : matchingExisting.length > 0 ? [...matchingExisting, ...dynamicQuestions] : dynamicQuestions,
  };
}

export function getQuestionsBySubject(subject: string, count?: number, topicTitle?: string, topicOverride?: TopicStudyOverride): BankQuestion[] {
  const data = getDynamicStudyDataForTopic(subject, topicTitle, topicOverride?.summaryText, topicOverride);
  const list = data.questions.map((q) => ({ ...q, selectedLetter: undefined }));
  return count && count > 0 ? list.slice(0, count) : list;
}

export function getSubjectStudyData(subject: string, topicTitle?: string, topicOverride?: TopicStudyOverride): SubjectStudyData {
  return getDynamicStudyDataForTopic(subject, topicTitle, topicOverride?.summaryText, topicOverride);
}
