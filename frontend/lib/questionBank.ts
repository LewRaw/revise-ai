/**
 * Banco Estruturado de Questões, Resumos e Temas Dissertativos (Ensino Médio & ENEM)
 * Alimenta os Simulados, o Player de Rotinas Guiadas e os Resumos Focais.
 */

export interface BankQuestion {
  id: string;
  subject: string;
  topic: string;
  difficulty: 'fácil' | 'médio' | 'difícil';
  text: string;
  options: {
    letter: string;
    text: string;
    isCorrect: boolean;
    explanation: string;
  }[];
  selectedLetter?: string;
}

export interface SubjectStudyData {
  subject: string;
  defaultTopic: string;
  generalSummary: {
    definition: string;
    formulaOrRule: string;
    enemTip: string;
  };
  descriptivePrompt: string;
  questions: BankQuestion[];
}

export const SUBJECT_STUDY_BANK: Record<string, SubjectStudyData> = {
  'Física': {
    subject: 'Física',
    defaultTopic: 'Termodinâmica & Conservação de Energia',
    generalSummary: {
      definition: 'As leis da Termodinâmica descrevem como o calor (Q), o trabalho mecânico (W) e a energia interna (ΔU) interagem em sistemas físicos.',
      formulaOrRule: '1ª Lei: ΔU = Q - W  |  Rendimento de Carnot: η = 1 - (T_fria / T_quente)',
      enemTip: 'No ENEM, diferencie sempre transformação isotérmica (temperatura constante, ΔU = 0) de adiabática (sem troca de calor, Q = 0, como em aerossóis).'
    },
    descriptivePrompt: 'Explique por que a conservação da energia mecânica só é válida na ausência de forças dissipativas e como a 2ª Lei da Termodinâmica impede máquinas térmicas com 100% de eficiência.',
    questions: [
      {
        id: 'fis_1',
        subject: 'Física',
        topic: 'Primeira Lei da Termodinâmica',
        difficulty: 'fácil',
        text: 'Na Primeira Lei da Termodinâmica (ΔU = Q - W), se um gás ideal sofre uma transformação isotérmica e realiza 300 J de trabalho, quanto de calor ele trocou com o meio?',
        options: [
          { letter: 'A', text: 'Recebeu 300 J de calor.', isCorrect: true, explanation: 'Correto! Em transformações isotérmicas a temperatura não varia (ΔU = 0), logo Q = W = 300 J.' },
          { letter: 'B', text: 'Perdeu 300 J de calor.', isCorrect: false, explanation: 'Incorreto. Para expandir mantendo a temperatura constante, o gás precisa receber calor.' },
          { letter: 'C', text: 'A troca de calor foi nula (adiabática).', isCorrect: false, explanation: 'Incorreto. Q = 0 ocorre em transformações adiabáticas, não isotérmicas.' },
          { letter: 'D', text: 'Recebeu 600 J de calor.', isCorrect: false, explanation: 'Incorreto. Como ΔU = 0, o calor recebido iguala exatamente o trabalho.' },
        ]
      },
      {
        id: 'fis_2',
        subject: 'Física',
        topic: 'Segunda Lei da Termodinâmica',
        difficulty: 'médio',
        text: 'Qual das alternativas descreve corretamente a Segunda Lei da Termodinâmica (Enunciado de Clausius)?',
        options: [
          { letter: 'A', text: 'A energia total do universo é sempre constante.', isCorrect: false, explanation: 'Incorreto. Este é o princípio da conservação da energia (1ª Lei).' },
          { letter: 'B', text: 'O calor flui espontaneamente de corpos frios para corpos quentes.', isCorrect: false, explanation: 'Incorreto. O fluxo espontâneo é sempre do corpo de maior para o de menor temperatura.' },
          { letter: 'C', text: 'É impossível transferir calor de um corpo frio para um quente sem trabalho externo.', isCorrect: true, explanation: 'Exato! Refrigeradores e aparelhos de ar-condicionado exigem trabalho elétrico do compressor.' },
          { letter: 'D', text: 'O rendimento de qualquer máquina térmica atinge 100% no vácuo.', isCorrect: false, explanation: 'Incorreto. Pelo teorema de Carnot, nenhuma máquina térmica atinge 100% de rendimento.' },
        ]
      },
      {
        id: 'fis_3',
        subject: 'Física',
        topic: 'Transformação Adiabática',
        difficulty: 'médio',
        text: 'Ao pressionar a válvula de um desodorante aerossol, o gás expande muito rapidamente e o frasco esfria. Esse resfriamento ocorre porque a expansão é:',
        options: [
          { letter: 'A', text: 'Adiabática, realizando trabalho à custa da própria energia interna.', isCorrect: true, explanation: 'Perfeito! Como é rápida demais para trocar calor (Q ≈ 0), ΔU = -W, reduzindo a temperatura.' },
          { letter: 'B', text: 'Isovolumétrica, reduzindo a pressão sem realizar trabalho.', isCorrect: false, explanation: 'Incorreto. O gás se expande para fora do frasco, portanto há variação de volume.' },
          { letter: 'C', text: 'Isotérmica, absorvendo calor latente da mão do usuário.', isCorrect: false, explanation: 'Incorreto. A queda de temperatura mostra que não é isotérmica.' },
          { letter: 'D', text: 'Isobárica, mantendo a pressão interna constante.', isCorrect: false, explanation: 'Incorreto. A pressão interna cai com a saída do gás.' },
        ]
      },
      {
        id: 'fis_4',
        subject: 'Física',
        topic: 'Ciclo de Carnot',
        difficulty: 'difícil',
        text: 'Uma máquina térmica ideal de Carnot opera entre uma fonte quente a 400 K e uma fonte fria a 300 K. Qual é o seu rendimento máximo teórico?',
        options: [
          { letter: 'A', text: '25%', isCorrect: true, explanation: 'Correto! η = 1 - (300 / 400) = 1 - 0,75 = 0,25 (ou 25%).' },
          { letter: 'B', text: '75%', isCorrect: false, explanation: 'Incorreto. 75% é a fração rejeitada para a fonte fria (300/400).' },
          { letter: 'C', text: '33%', isCorrect: false, explanation: 'Incorreto. Deve-se dividir T_fria por T_quente (300/400).' },
          { letter: 'D', text: '100%', isCorrect: false, explanation: 'Incorreto. Rendimento de 100% violaria a 2ª Lei da Termodinâmica.' },
        ]
      },
      {
        id: 'fis_5',
        subject: 'Física',
        topic: 'Potência e Energia Elétrica',
        difficulty: 'fácil',
        text: 'Um chuveiro elétrico de potência 4400 W é utilizado durante 15 minutos (0,25 h) por dia. Qual é o consumo diário de energia elétrica em kWh?',
        options: [
          { letter: 'A', text: '1,1 kWh', isCorrect: true, explanation: 'Correto! E = P × Δt = 4,4 kW × 0,25 h = 1,1 kWh.' },
          { letter: 'B', text: '4,4 kWh', isCorrect: false, explanation: 'Incorreto. 4,4 kWh seria o consumo em 1 hora inteira de uso.' },
          { letter: 'C', text: '66,0 kWh', isCorrect: false, explanation: 'Incorreto. É necessário converter minutos para horas (15 min = 0,25 h).' },
          { letter: 'D', text: '0,44 kWh', isCorrect: false, explanation: 'Incorreto. 4,4 × 0,25 resulta em 1,1 kWh.' },
        ]
      }
    ]
  },
  'Matemática': {
    subject: 'Matemática',
    defaultTopic: 'Funções, Geometria & Análise Combinatória',
    generalSummary: {
      definition: 'Funções descrevem relações de dependência entre grandezas: a função afim modela crescimento linear e a quadrática modela trajetórias parabólicas e otimização (máximos/mínimos).',
      formulaOrRule: 'Afim: f(x) = ax + b  |  Vértice da Parábola: Xv = -b / (2a), Yv = -Δ / (4a)',
      enemTip: 'Quando a questão pedir "lucro máximo" ou "custo mínimo" em uma função do 2º grau, verifique se ela pede o valor de x (use Xv) ou o valor máximo atingido (use Yv).'
    },
    descriptivePrompt: 'Explique a diferença geométrica e algébrica entre progressão aritmética (crescimento linear/função afim) e progressão geométrica (crescimento exponencial), citando um exemplo prático.',
    questions: [
      {
        id: 'mat_1',
        subject: 'Matemática',
        topic: 'Função Quadrática (Máximos e Mínimos)',
        difficulty: 'médio',
        text: 'O lucro mensal L(x) de uma startup, em milhares de reais, em função do preço x de assinatura é dado por L(x) = -x² + 20x - 60. Qual deve ser o preço x para que o lucro seja máximo?',
        options: [
          { letter: 'A', text: 'R$ 10,00', isCorrect: true, explanation: 'Correto! O preço que maximiza é o X do vértice: Xv = -b / (2a) = -20 / (2 × -1) = 10.' },
          { letter: 'B', text: 'R$ 40,00', isCorrect: false, explanation: 'Incorreto. 40 milhares de reais é o lucro máximo (Yv), não o preço x.' },
          { letter: 'C', text: 'R$ 20,00', isCorrect: false, explanation: 'Incorreto. Lembre-se de dividir por 2a na fórmula Xv = -b / (2a).' },
          { letter: 'D', text: 'R$ 60,00', isCorrect: false, explanation: 'Incorreto. -60 é o termo independente (custo fixo).' },
        ]
      },
      {
        id: 'mat_2',
        subject: 'Matemática',
        topic: 'Probabilidade e Combinatória',
        difficulty: 'fácil',
        text: 'Em uma sala de Ensino Médio com 40 alunos, 24 praticam esportes e 16 tocam algum instrumento musical, sendo que 8 fazem ambos. Escolhendo um aluno ao acaso, qual a probabilidade de ele praticar esporte OU tocar instrumento?',
        options: [
          { letter: 'A', text: '80% (32/40)', isCorrect: true, explanation: 'Correto! Pelo princípio da inclusão-exclusão: 24 + 16 - 8 = 32 alunos. 32 / 40 = 0,80 = 80%.' },
          { letter: 'B', text: '100% (40/40)', isCorrect: false, explanation: 'Incorreto. Somar 24 + 16 sem subtrair a interseção (8) conta duas vezes quem faz ambos.' },
          { letter: 'C', text: '60% (24/40)', isCorrect: false, explanation: 'Incorreto. 60% considera apenas os que praticam esportes.' },
          { letter: 'D', text: '20% (8/40)', isCorrect: false, explanation: 'Incorreto. 20% é a interseção (esporte E instrumento).' },
        ]
      },
      {
        id: 'mat_3',
        subject: 'Matemática',
        topic: 'Escalas e Proporcionalidade',
        difficulty: 'médio',
        text: 'Em uma maquete na escala 1:50, a área do piso de uma quadra poliesportiva mede 200 cm². Qual é a área real dessa quadra em metros quadrados (m²)?',
        options: [
          { letter: 'A', text: '50 m²', isCorrect: true, explanation: 'Correto! Para áreas, a razão é elevada ao quadrado: 200 cm² × 50² = 200 × 2500 = 500.000 cm² = 50 m².' },
          { letter: 'B', text: '1 m²', isCorrect: false, explanation: 'Incorreto. Multiplicar apenas por 50 serve para medidas lineares, não de área.' },
          { letter: 'C', text: '500 m²', isCorrect: false, explanation: 'Incorreto. Cuidado na conversão de cm² para m² (dividir por 10.000).' },
          { letter: 'D', text: '100 m²', isCorrect: false, explanation: 'Incorreto. 500.000 cm² dividido por 10.000 equivale a 50 m².' },
        ]
      },
      {
        id: 'mat_4',
        subject: 'Matemática',
        topic: 'Estatística (Média, Moda e Mediana)',
        difficulty: 'fácil',
        text: 'As notas de um estudante em 5 simulados foram: 6, 8, 5, 9 e 7. Qual é a mediana dessas notas?',
        options: [
          { letter: 'A', text: '7', isCorrect: true, explanation: 'Correto! Ordenando o rol: [5, 6, 7, 8, 9], o termo central é 7.' },
          { letter: 'B', text: '5', isCorrect: false, explanation: 'Incorreto. Antes de pegar o termo do meio, é obrigatório ordenar os valores em ordem crescente!' },
          { letter: 'C', text: '8', isCorrect: false, explanation: 'Incorreto. O valor central após ordenar [5, 6, 7, 8, 9] é 7.' },
          { letter: 'D', text: '6,5', isCorrect: false, explanation: 'Incorreto. Como há 5 termos (ímpar), a mediana é exatamente o 3º termo ordenado.' },
        ]
      },
      {
        id: 'mat_5',
        subject: 'Matemática',
        topic: 'Trigonometria no Triângulo Retângulo',
        difficulty: 'médio',
        text: 'Uma rampa de acessibilidade forma um ângulo de 30° com o solo horizontal e atinge uma altura vertical de 1,5 m. Qual é o comprimento da rampa? (Dado: sen 30° = 0,5)',
        options: [
          { letter: 'A', text: '3,0 m', isCorrect: true, explanation: 'Correto! sen 30° = cateto oposto / hipotenusa -> 0,5 = 1,5 / L -> L = 3,0 m.' },
          { letter: 'B', text: '0,75 m', isCorrect: false, explanation: 'Incorreto. A hipotenusa sempre é maior que os catetos.' },
          { letter: 'C', text: '4,5 m', isCorrect: false, explanation: 'Incorreto. 1,5 dividido por 0,5 resulta em 3,0 m.' },
          { letter: 'D', text: '1,5 m', isCorrect: false, explanation: 'Incorreto. O comprimento da rampa é o dobro da altura para 30°.' },
        ]
      }
    ]
  },
  'Química': {
    subject: 'Química',
    defaultTopic: 'Estequiometria, Eletroquímica & Equilíbrio',
    generalSummary: {
      definition: 'A Eletroquímica estuda a conversão entre energia química e elétrica (Pilhas espontâneas vs. Eletrólise não-espontânea), enquanto o Equilíbrio Químico analisa reações reversíveis.',
      formulaOrRule: 'Pilha (CRAO): Cátodo Reduz, Ânodo Oxida  |  ΔE° = E°maior - E°menor > 0',
      enemTip: 'Na pilha, os elétrons fluem sempre do Ânodo (menor potencial de redução, sofre corrosão) para o Cátodo (maior potencial de redução, ganha massa).'
    },
    descriptivePrompt: 'Explique como funciona a proteção catódica (metal de sacrifício) usada em cascos de navios e tubulações subterrâneas com base nos potenciais de redução.',
    questions: [
      {
        id: 'qui_1',
        subject: 'Química',
        topic: 'Eletroquímica (Pilhas)',
        difficulty: 'médio',
        text: 'Em uma pilha de Daniell formada por eletrodos de Zinco (E°red = -0,76 V) e Cobre (E°red = +0,34 V), o que ocorre durante o funcionamento espontâneo?',
        options: [
          { letter: 'A', text: 'O eletrodo de zinco sofre oxidação (corrosão) e os elétrons fluem para o cobre.', isCorrect: true, explanation: 'Correto! O zinco tem menor potencial de redução, logo atua como ânodo e oxida.' },
          { letter: 'B', text: 'O eletrodo de cobre sofre desgaste e diminui de massa.', isCorrect: false, explanation: 'Incorreto. No cátodo (cobre), íons Cu²⁺ sofrem redução e se depositam, aumentando a massa.' },
          { letter: 'C', text: 'A ddp (diferença de potencial) da pilha é de -0,42 V.', isCorrect: false, explanation: 'Incorreto. ΔE° = +0,34 - (-0,76) = +1,10 V.' },
          { letter: 'D', text: 'Os elétrons fluem pela ponte salina.', isCorrect: false, explanation: 'Incorreto. Pela ponte salina migram apenas íons; elétrons fluem pelo fio condutor externo.' },
        ]
      },
      {
        id: 'qui_2',
        subject: 'Química',
        topic: 'pH e Equilíbrio Iônico',
        difficulty: 'fácil',
        text: 'Um suco cítrico apresenta concentração de íons H⁺ igual a 10⁻³ mol/L a 25 °C. Qual é o valor do pH dessa solução e sua classificação?',
        options: [
          { letter: 'A', text: 'pH = 3 (Ácida)', isCorrect: true, explanation: 'Correto! pH = -log[H⁺] = -log(10⁻³) = 3. Como é menor que 7, é ácida.' },
          { letter: 'B', text: 'pH = 11 (Básica)', isCorrect: false, explanation: 'Incorreto. 11 seria o pOH da solução (pH + pOH = 14).' },
          { letter: 'C', text: 'pH = 7 (Neutra)', isCorrect: false, explanation: 'Incorreto. Solução neutra possui [H⁺] = 10⁻⁷ mol/L.' },
          { letter: 'D', text: 'pH = -3 (Ácida)', isCorrect: false, explanation: 'Incorreto. A definição tem sinal negativo (-log), tornando o resultado positivo.' },
        ]
      },
      {
        id: 'qui_3',
        subject: 'Química',
        topic: 'Interações Intermoleculares',
        difficulty: 'fácil',
        text: 'A água (H₂O) possui ponto de ebulição (100 °C) muito superior ao do sulfeto de hidrogênio (H₂S, -60 °C), apesar de ter menor massa molar. Isso se explica principalmente pelas:',
        options: [
          { letter: 'A', text: 'Ligações de hidrogênio intensas entre as moléculas de água.', isCorrect: true, explanation: 'Exato! O hidrogênio ligado ao oxigênio (F, O, N) forma ligações de hidrogênio de alta intensidade.' },
          { letter: 'B', text: 'Ligações iônicas presentes na molécula de H₂O.', isCorrect: false, explanation: 'Incorreto. A ligação O-H é covalente polar, não iônica.' },
          { letter: 'C', text: 'Forças de dipolo induzido predominantes na água.', isCorrect: false, explanation: 'Incorreto. Dipolo induzido predomina em moléculas apolares.' },
          { letter: 'D', text: 'Quebras das ligações covalentes intramoleculares durante a fervura.', isCorrect: false, explanation: 'Incorreto. A ebulição rompe apenas forças intermoleculares, não a molécula.' },
        ]
      }
    ]
  },
  'Biologia': {
    subject: 'Biologia',
    defaultTopic: 'Bioenergética, Ecologia & Genética',
    generalSummary: {
      definition: 'A Fotossíntese converte energia luminosa em energia química (glicose) nos cloroplastos, enquanto a Respiração Celular degrada glicose nas mitocôndrias para gerar ATP.',
      formulaOrRule: 'Fotossíntese: 6 CO₂ + 6 H₂O + Luz → C₆H₁₂O₆ + 6 O₂ (O₂ vem da fotólise da água!)',
      enemTip: 'Pegadinha clássica: o oxigênio liberado pelas plantas na fotossíntese provém da quebra da molécula de ÁGUA (H₂O) na fase clara, e não do gás carbônico (CO₂).'
    },
    descriptivePrompt: 'Diferencie o processo de eutrofização artificial em lagos (causado por esgoto doméstico ou fertilizantes) da magnificação trófica causada por metais pesados.',
    questions: [
      {
        id: 'bio_1',
        subject: 'Biologia',
        topic: 'Fotossíntese e Bioenergética',
        difficulty: 'médio',
        text: 'Experimentos utilizando isótopos marcados de oxigênio (¹⁸O) comprovaram que o gás oxigênio (O₂) liberado para a atmosfera durante a fotossíntese provém diretamente da:',
        options: [
          { letter: 'A', text: 'Fotólise da água (H₂O) na etapa fotoquímica (fase clara).', isCorrect: true, explanation: 'Correto! A reação de Hill quebra a molécula de água liberando O₂, prótons H⁺ e elétrons.' },
          { letter: 'B', text: 'Quebra do gás carbônico (CO₂) no Ciclo de Calvin.', isCorrect: false, explanation: 'Incorreto. O oxigênio do CO₂ passa a compor a glicose e novas moléculas de água.' },
          { letter: 'C', text: 'Degradação da clorofila nos tilacoides.', isCorrect: false, explanation: 'Incorreto. A clorofila é apenas excitada pela luz, doando elétrons.' },
          { letter: 'D', text: 'Cadeia respiratória nas cristas mitocondriais.', isCorrect: false, explanation: 'Incorreto. A cadeia respiratória consome O₂, não o libera.' },
        ]
      },
      {
        id: 'bio_2',
        subject: 'Biologia',
        topic: 'Ecologia (Eutrofização)',
        difficulty: 'fácil',
        text: 'O despejo excessivo de fertilizantes agrícolas ricos em nitratos e fosfatos em um lago fechado desencadeia a proliferação de algas na superfície e a morte de peixes. A morte dos peixes ocorre diretamente por:',
        options: [
          { letter: 'A', text: 'Queda drástica do oxigênio dissolvido devido à proliferação de bactérias decompositoras aeróbicas.', isCorrect: true, explanation: 'Exato! O bloqueio da luz mata a vegetação submersa; bactérias aeróbicas se multiplicam e consomem todo o O₂ da água.' },
          { letter: 'B', text: 'Intoxicação direta dos peixes pelo nitrogênio gasoso.', isCorrect: false, explanation: 'Incorreto. A causa letal no processo de eutrofização é a anóxia/hipóxia (falta de O₂).' },
          { letter: 'C', text: 'Aumento exagerado da fotossíntese no fundo do lago.', isCorrect: false, explanation: 'Incorreto. A camada superficial de algas impede a entrada de luz no fundo.' },
          { letter: 'D', text: 'Congelamento térmico da coluna de água.', isCorrect: false, explanation: 'Incorreto. Não há congelamento induzido por nutrientes.' },
        ]
      },
      {
        id: 'bio_3',
        subject: 'Biologia',
        topic: 'Imunologia (Vacinas vs. Soros)',
        difficulty: 'fácil',
        text: 'Qual é a diferença fundamental entre a atuação imunológica de uma vacina e a de um soro antiofídico?',
        options: [
          { letter: 'A', text: 'A vacina contém antígenos e gera memória imunológica (ativa); o soro fornece anticorpos prontos (passiva).', isCorrect: true, explanation: 'Perfeito! Vacinas são preventivas (imunização ativa) e soros são curativos de emergência (imunização passiva).' },
          { letter: 'B', text: 'O soro estimula a produção de células de memória de longo prazo.', isCorrect: false, explanation: 'Incorreto. Como o soro já entrega anticorpos prontos, o sistema imune não cria memória.' },
          { letter: 'C', text: 'A vacina contém anticorpos purificados para ação imediata contra venenos.', isCorrect: false, explanation: 'Incorreto. Essa é a definição de soro terapêutico.' },
          { letter: 'D', text: 'Ambos possuem exatamente a mesma composição de antígenos atenuados.', isCorrect: false, explanation: 'Incorreto. Vacina tem antígenos; soro tem anticorpos.' },
        ]
      }
    ]
  },
  'História': {
    subject: 'História',
    defaultTopic: 'Era Vargas, Brasil República & Revoluções',
    generalSummary: {
      definition: 'A Era Vargas (1930-1945) marcou a transição do modelo agroexportador oligárquico para a industrialização por substituição de importações e a criação da legislação trabalhista (CLT).',
      formulaOrRule: 'Fases: Governo Provisório (30-34) → Constitucional (34-37) → Estado Novo Ditatorial (37-45)',
      enemTip: 'Analise sempre o trabalhismo varguista sob a dupla perspectiva: conquista de direitos sociais urbanos + controle estatal dos sindicatos (peleguismo) e propaganda (DIP).'
    },
    descriptivePrompt: 'Analise o papel do Departamento de Imprensa e Propaganda (DIP) e da Consolidação das Leis do Trabalho (CLT) na construção da base de apoio popular durante o Estado Novo.',
    questions: [
      {
        id: 'his_1',
        subject: 'História',
        topic: 'Era Vargas e Trabalhismo',
        difficulty: 'médio',
        text: 'Durante o Estado Novo (1937-1945), a promulgação da CLT por Getúlio Vargas representou para a classe trabalhadora urbana brasileira:',
        options: [
          { letter: 'A', text: 'A regulamentação de direitos trabalhistas aliada à subordinação dos sindicatos ao Estado.', isCorrect: true, explanation: 'Correto! Vargas atendeu demandas históricas dos operários, mas atrelou os sindicatos ao Ministério do Trabalho.' },
          { letter: 'B', text: 'A plena liberdade de greve e autonomia sindical frente ao governo federal.', isCorrect: false, explanation: 'Incorreto. Greves foram proibidas pela Constituição Polaca de 1937.' },
          { letter: 'C', text: 'A extensão imediata dos direitos trabalhistas a todos os trabalhadores rurais.', isCorrect: false, explanation: 'Incorreto. O trabalhador rural só foi contemplado décadas depois (Estatuto do Trabalhador Rural em 1963).' },
          { letter: 'D', text: 'O abandono da industrialização de base em favor do café.', isCorrect: false, explanation: 'Incorreto. Vargas impulsionou a indústria de base (CSN e Vale do Rio Doce).' },
        ]
      },
      {
        id: 'his_2',
        subject: 'História',
        topic: 'Iluminismo e Revolução Francesa',
        difficulty: 'fácil',
        text: 'A Declaração dos Direitos do Homem e do Cidadão (1789), marco da Revolução Francesa, inspirou-se diretamente nos princípios iluministas ao defender:',
        options: [
          { letter: 'A', text: 'A igualdade jurídica perante a lei, a liberdade individual e o direito à propriedade.', isCorrect: true, explanation: 'Exato! Rompeu com os privilégios feudais de nascimento do clero e da nobreza (Antigo Regime).' },
          { letter: 'B', text: 'O direito divino dos reis e o fortalecimento do absolutismo monárquico.', isCorrect: false, explanation: 'Incorreto. A revolução derrubou justamente o absolutismo.' },
          { letter: 'C', text: 'A abolição imediata da propriedade privada na França de 1789.', isCorrect: false, explanation: 'Incorreto. A Revolução Francesa foi uma revolução burguesa que consagrou a propriedade privada.' },
          { letter: 'D', text: 'A manutenção da isenção de impostos para o Primeiro e Segundo Estados.', isCorrect: false, explanation: 'Incorreto. Os privilgios fiscais de clero e nobreza foram extintos.' },
        ]
      }
    ]
  }
};

export function getQuestionsBySubject(subject: string, count?: number): BankQuestion[] {
  const bank = SUBJECT_STUDY_BANK[subject] || SUBJECT_STUDY_BANK['Física'];
  const list = bank.questions.map((q) => ({ ...q, selectedLetter: undefined }));
  if (count && count > 0) {
    return list.slice(0, count);
  }
  return list;
}

export function getSubjectStudyData(subject: string): SubjectStudyData {
  return SUBJECT_STUDY_BANK[subject] || SUBJECT_STUDY_BANK['Física'];
}
