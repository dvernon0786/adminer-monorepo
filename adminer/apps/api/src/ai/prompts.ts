export const STRATEGIC_ANALYSIS_PROMPT = `Your role is to review a scraped JavaScript object from a Facebook Ad Library listing. Analyze the ad content and associated image, then create a concise summary and a rewritten version of the copy (repurposed for fresh use).

This task supports strategic insights—we're an advertising agency continuously tracking and learning from competitor campaigns to stay ahead.

Rules:
The intended style and attitude is generally analytical, inquisitive, and precise, despite exploring complex topics, in the "classic style" of Western writing.

The level of formality should be inverse to the topic's novelty: the weirder something is, the more formal. For 'safer' topics, one should cut loose with the humor, epigraphs, typographical stunts and experiments, etc.

Avoid hedging and qualifying, even at the risk of making overly-strong claims. It is a slippery slope.

Use casual abbreviations (like San Francisco ➝ SF, thanks ➝ thx, question ➝ q), casual contractions ("I've"), shortened forms of common words ("tho" "info" "vid") as this signals more human written speech. Do not use em dashes (eliminate - from your vocabulary completely! No rhetorical questions. Dont output title. only bullet points (and sparingly). Make your summary extremely comprehensive and analytical.

- Be analytical and precise
- Focus on actionable insights
- Identify persuasion techniques
- Note copy structure and elements
- Provide strategic recommendations
- Output in JSON format only

Format:
{
  "summary": "Strategic analysis of the ad approach and effectiveness",
  "rewrittenAdCopy": "Improved version optimized for conversion",
  "keyInsights": ["insight1", "insight2", "insight3"],
  "competitorStrategy": "Overall strategy assessment",
  "recommendations": ["rec1", "rec2", "rec3"]
}`;

export const IMAGE_ANALYSIS_STEP1_PROMPT = `Analyze this Facebook ad image for competitive intelligence. Provide analysis in these categories:

**Visual Composition & Design Elements:**
[Analysis of layout, framing, visual hierarchy, and design choices]

**Text Content & Typography:**
[Analysis of any text, fonts, sizing, and readability]

**Color Psychology & Branding:**
[Analysis of color schemes, brand elements, and psychological impact]

**Target Audience Indicators:**
[Analysis of who this ad targets based on visual cues]

**Call-to-Action Elements:**
[Analysis of CTA placement, design, and effectiveness]

**Emotional Triggers:**
[Analysis of psychological and emotional appeals used]

**Competitive Intelligence Summary:**
[Key strategic insights for competitive analysis]`;

export const IMAGE_ANALYSIS_JSON_PROMPT = `
Analyze this Facebook ad image and provide insights in JSON format.

Please analyze and return a JSON object with the following structure:
{
  "visualElements": ["List of visual elements", "Design components", "Visual hierarchy"],
  "colorPsychology": "Analysis of color choices and psychology",
  "designRecommendations": ["Specific design improvement suggestions"],
  "brandConsistency": "Assessment of brand consistency",
  "visualAppeal": "Overall visual appeal assessment"
}

Focus on:
- Visual composition and layout
- Color psychology and brand colors
- Typography and readability
- Visual hierarchy and focal points
- Brand consistency and recognition
- Emotional impact and appeal
`;

export const VIDEO_ANALYSIS_STEP1_PROMPT = `Analyze this Facebook ad video for competitive intelligence. Provide analysis in these categories:

**Visual Content & Storytelling:**
[Analysis of visual narrative, scenes, and storytelling elements]

**Audio & Voiceover Analysis:**
[Analysis of audio content, voiceover, music, and sound effects]

**Brand Messaging & Positioning:**
[Analysis of brand presentation and messaging strategy]

**Target Audience Indicators:**
[Analysis of who this ad targets based on visual and audio cues]

**Call-to-Action Elements:**
[Analysis of CTA placement, timing, and effectiveness]

**Emotional Triggers & Psychology:**
[Analysis of psychological and emotional appeals used]

**Production Quality & Technical Elements:**
[Analysis of video quality, editing, and technical execution]

**Competitive Intelligence Summary:**
[Key strategic insights for competitive analysis]

**Timestamp Analysis:**
[Break down key moments and their strategic purpose]`;

export const VIDEO_ANALYSIS_JSON_PROMPT = `
Analyze this Facebook ad video and provide comprehensive insights in JSON format.

Video URL: (sd url contains https://video)

Please analyze and return a JSON object with the following structure:
{
  "contentSummary": "Brief summary of the video content and message",
  "pacing": "Analysis of video pacing and timing",
  "callToAction": "Description of the call-to-action and its effectiveness",
  "visualElements": ["List of key visual elements", "Design components", "Visual storytelling"],
  "audioAnalysis": "Analysis of audio elements, music, voiceover, etc.",
  "emotionalImpact": "Assessment of emotional impact and viewer response",
  "targetAudience": "Identified target audience based on content",
  "recommendations": ["Specific recommendations for improvement"]
}

Focus on:
- Video storytelling and narrative structure
- Visual and audio quality
- Pacing and engagement factors
- Call-to-action clarity and timing
- Emotional resonance and brand alignment
- Target audience appeal and messaging
- Competitive positioning and differentiation
`;

export const THUMBNAIL_ANALYSIS_JSON_PROMPT = (thumbnailUrl: string) => `
Analyze this video thumbnail for a Facebook ad and provide insights in JSON format.

Thumbnail URL: ${thumbnailUrl}

Please analyze and return a JSON object with the following structure:
{
  "visualAppeal": "Assessment of visual appeal and attractiveness",
  "clickability": "Analysis of click-through potential",
  "brandConsistency": "Assessment of brand consistency and recognition",
  "recommendations": ["Specific recommendations for improvement"]
}

Focus on:
- Visual composition and layout
- Color psychology and brand colors
- Typography and readability
- Emotional impact and curiosity
- Brand recognition and consistency
- Click-through rate optimization
`; 