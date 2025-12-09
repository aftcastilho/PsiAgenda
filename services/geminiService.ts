import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const refinePatientNotes = async (rawNotes: string, patientName: string): Promise<string> => {
  try {
    const model = "gemini-2.5-flash";
    const prompt = `
      Você é um assistente de IA para um psicólogo chamado Arthur Castilho.
      Sua tarefa é reescrever e organizar as anotações clínicas abaixo de forma profissional, 
      concisa e clara, mantendo o tom clínico adequado. 
      Use tópicos se necessário.
      
      Paciente: ${patientName}
      Anotações Brutas: "${rawNotes}"
      
      Apenas retorne o texto reescrito, sem introduções ou conclusões da IA.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || rawNotes;
  } catch (error) {
    console.error("Erro ao chamar Gemini API:", error);
    return rawNotes;
  }
};

export const getLacanianInsight = async (): Promise<string> => {
  try {
    const model = "gemini-3-pro-preview"; // Better model for creative content
    
    // Randomize the type of content to keep it surprising
    const contentTypes = [
      "book_recommendation",
      "concept_explanation",
      "famous_quote",
      "video_search_suggestion"
    ];
    const selectedType = contentTypes[Math.floor(Math.random() * contentTypes.length)];

    let systemInstruction = "";
    
    switch (selectedType) {
      case "book_recommendation":
        systemInstruction = "Indique um livro ou seminário essencial de Lacan (ou comentadores famosos como Fink, Miller, Dunker). Dê o título e em 1 frase diga POR QUE um psicólogo clínico deve ler isso hoje.";
        break;
      case "concept_explanation":
        systemInstruction = "Escolha um conceito lacaniano complexo (ex: Objeto a, Gozo, Falo, Nome-do-Pai, Real, Sinthoma) e explique-o de forma extremamente sintética e poética em no máximo 2 frases.";
        break;
      case "famous_quote":
        systemInstruction = "Traga uma citação direta de Jacques Lacan. Deve ser algo impactante. Após a citação, dê uma brevísima interpretação de 1 linha sobre sua aplicação na clínica.";
        break;
      case "video_search_suggestion":
        systemInstruction = "Sugira um tema específico para estudo em vídeo. Dê uma 'palavra-chave de busca' (ex: 'Lacan Televisão 1973', 'Christian Dunker Estruturas', 'Jorge Forbes Pós-modernidade') e diga o que o psicólogo vai aprender com isso.";
        break;
    }

    const prompt = `
      Gere um conteúdo curto, rico e surpreendente para um card de 'Insight Diário' no app do psicólogo Arthur Castilho.
      Tipo de conteúdo: ${selectedType}.
      Instrução específica: ${systemInstruction}
      
      Mantenha o tom erudito, psicanalítico, porém inspirador.
      Use emojis pontuais se couber.
      Limite de caracteres: 200 caracteres (é para um card pequeno).
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || "O inconsciente é estruturado como uma linguagem.";
  } catch (error) {
    return "O desejo é o desejo do Outro.";
  }
};

// RELATÓRIO TÉCNICO (Formal, para outros profissionais/médicos)
export const generateTechnicalReport = async (patientName: string, sessions: {date: string, notes: string}[]): Promise<string> => {
  try {
    const model = "gemini-3-pro-preview";
    
    let sessionsText = sessions.map(s => `- Data: ${s.date}\n  Evolução: ${s.notes}`).join("\n\n");

    const prompt = `
      Aja como o Psicólogo Arthur Castilho (CRP 01/24909). Você está redigindo um RELATÓRIO PSICOLÓGICO/EVOLUÇÃO CLÍNICA formal sobre o paciente "${patientName}".
      O público-alvo deste relatório pode ser um médico psiquiatra, neurologista ou para arquivo de prontuário oficial.

      INSTRUÇÕES DE TOM E ESTILO:
      - Linguagem: Técnica, científica, objetiva e impessoal (terceira pessoa).
      - Evite gírias ou achismos. Use termos da psicopatologia e psicanálise de forma séria.
      - Inclua ao final a assinatura formal com o CRP.

      ESTRUTURA DO DOCUMENTO:
      1. **Identificação e Síntese da Demanda**: Breve resumo do motivo do acompanhamento.
      2. **Síntese da Evolução Clínica**: Resumo cronológico do progresso, estabilidade ou regressão dos sintomas com base nas sessões.
      3. **Impressões Diagnósticas e Análise**: Hipóteses sobre funcionamento psíquico e estrutura clínica (Neurose, Psicose, Perversão) se aplicável.
      4. **Conclusão e Conduta**: Estado atual e plano terapêutico.
      
      RODAPÉ OBRIGATÓRIO:
      Ao final, coloque centralizado ou alinhado à direita:
      "Arthur Castilho - Psicólogo | CRP 01/24909"

      DADOS BRUTOS DAS SESSÕES:
      ${sessionsText}

      Formate a resposta em Markdown limpo.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || "Não foi possível gerar o relatório técnico.";
  } catch (error) {
    console.error("Erro ao gerar relatório técnico:", error);
    return "Erro ao comunicar com a IA.";
  }
};

// SUPERVISÃO DE CASO (Mentoria Lacaniana)
export const generateSupervisionReport = async (patientName: string, sessions: {date: string, notes: string}[]): Promise<string> => {
  try {
    const model = "gemini-3-pro-preview";
    
    let sessionsText = sessions.map(s => `- Data: ${s.date}\n  Anotação: ${s.notes}`).join("\n\n");

    const prompt = `
      Atue como um Supervisor Clínico Psicanalista Sênior (Orientação Lacaniana/Freudiana).
      Você está supervisionando o caso do paciente "${patientName}" atendido pelo psicólogo Arthur Castilho.

      Sua tarefa é analisar o material clínico abaixo e fornecer INSIGHTS, ORIENTAÇÕES E QUESTIONAMENTOS ao terapeuta.

      ESTRUTURA DA SUPERVISÃO:
      1. **O que se escuta? (O Significado e o Significante)**: Onde está o desejo? Onde está o gozo? O que se repete na fala do paciente?
      2. **Manejo da Transferência**: Como o paciente se coloca em relação ao analista? (Suposto Saber, objeto a).
      3. **Pontos de Estrangulamento/Resistência**: Onde o tratamento parece travado?
      4. **Direção do Tratamento**: Sugestões de intervenção, cortes ou pontuações.

      DADOS DAS SESSÕES:
      ${sessionsText}

      Seja profundo, teórico (use conceitos como Real, Simbólico, Imaginário, Falo, Nome-do-Pai) mas prático.
      Formate em Markdown.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || "Não foi possível gerar a supervisão.";
  } catch (error) {
    console.error("Erro ao gerar supervisão:", error);
    return "Erro ao comunicar com a IA.";
  }
};