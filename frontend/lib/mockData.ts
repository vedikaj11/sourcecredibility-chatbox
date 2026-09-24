export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface Source {
  id: string;
  title: string;
  url: string;
  credibility: string;
}

export interface FactCheckResult {
  scan_id?: number;
  verdict: string;
  confidence: number;
  reasoning: string;
  factAnalysis: string;
  sources: Source[];
  claim: string;
  sourceCredibilityScore: number;
  factAnalysisScore: number;
  aiAnalysisScore: number;
  sourceReasons?: string[];
  scoreBreakdown?: string[];
}

export const MOCK_CHAT_REPLIES = [
  "The claim appears to be misleading based on the available evidence.",
  "I recommend checking this claim against reliable government and news sources.",
  "The available evidence does not provide enough support for this claim."
];

export const MOCK_FACT_CHECK_RESULT: FactCheckResult = {
  verdict: "False",
  confidence: 92,

  claim:
    "The Indian government has announced that every college student will receive a free laptop starting from September 2026.",

  reasoning:
    "The claim does not appear to be supported by a verified official government announcement. Claims involving nationwide student benefits should be confirmed through official government sources before being considered authentic.",

  factAnalysis:
    "There is no verified evidence in this demonstration dataset confirming that every college student will receive a free laptop from September 2026.",

  sourceCredibilityScore: 15,
  factAnalysisScore: 12,
  aiAnalysisScore: 92,

  sources: [
    {
      id: "source-1",
      title: "Official Government Sources",
      url: "#",
      credibility: "High"
    },
    {
      id: "source-2",
      title: "Reliable News Reports",
      url: "#",
      credibility: "Medium"
    }
  ]
};
