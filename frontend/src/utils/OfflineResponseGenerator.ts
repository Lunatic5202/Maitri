import { pipeline, TextGenerationPipeline, Text2TextGenerationPipeline } from '@huggingface/transformers';

type LoadingCallback = (progress: number, status: string) => void;

interface EmotionalContext {
  currentEmotions: { name: string; value: number; voiceValue: number; facialValue: number }[];
  recentAnalysis: { time: string; type: string; emotion: string; confidence: number }[];
  lastVoiceEmotion: string;
  lastFacialEmotion: string;
}

class OfflineResponseGenerator {
  private generator: Text2TextGenerationPipeline | null = null;
  private isLoading = false;
  private isReady = false;

  async initialize(onProgress?: LoadingCallback): Promise<boolean> {
    if (this.isReady) return true;
    if (this.isLoading) return false;

    this.isLoading = true;

    try {
      onProgress?.(10, 'Loading response generator model...');
      
      // Use a small T5 model optimized for text generation
      this.generator = await pipeline(
        'text2text-generation',
        'Xenova/LaMini-Flan-T5-248M',
        { 
          dtype: 'fp32',
          device: 'webgpu',
        }
      ) as Text2TextGenerationPipeline;

      onProgress?.(100, 'Response generator ready!');
      this.isReady = true;
      this.isLoading = false;
      return true;
    } catch (error) {
      console.error('Failed to load response generator with WebGPU:', error);
      
      // Fallback to WASM
      try {
        onProgress?.(10, 'Loading response generator (fallback mode)...');
        
        this.generator = await pipeline(
          'text2text-generation',
          'Xenova/LaMini-Flan-T5-248M',
        ) as Text2TextGenerationPipeline;

        onProgress?.(100, 'Response generator ready!');
        this.isReady = true;
        this.isLoading = false;
        return true;
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        this.isLoading = false;
        return false;
      }
    }
  }

  async generateResponse(context: EmotionalContext): Promise<string> {
    if (!this.generator) {
      throw new Error('Response generator not initialized');
    }

    // Build a prompt from the emotional context
    const prompt = this.buildPrompt(context);
    
    try {
      const result = await this.generator(prompt, {
        max_new_tokens: 200,
        do_sample: true,
        temperature: 0.7,
        top_p: 0.9,
      });
      
      // Handle both single result and array
      const output = Array.isArray(result) ? result[0] : result;
      const generatedText = (output as any)?.generated_text || '';
      
      // Post-process and enhance the response
      return this.enhanceResponse(generatedText, context);
    } catch (error) {
      console.error('Generation error:', error);
      // Fallback to rule-based response
      return this.generateRuleBasedResponse(context);
    }
  }

  private buildPrompt(context: EmotionalContext): string {
    const { currentEmotions, lastVoiceEmotion, lastFacialEmotion, recentAnalysis } = context;
    
    // Get dominant emotion
    const dominantEmotion = currentEmotions.reduce((prev, curr) => 
      curr.value > prev.value ? curr : prev
    );
    
    // Get recent emotions summary
    const recentEmotions = recentAnalysis.slice(0, 5).map(a => a.emotion).join(', ');
    
    const prompt = `Analyze this astronaut's emotional state and provide supportive guidance:
Current dominant emotion: ${dominantEmotion.name} at ${dominantEmotion.value}%
Voice analysis shows: ${lastVoiceEmotion || 'no data'}
Facial expression shows: ${lastFacialEmotion || 'no data'}
Recent emotional patterns: ${recentEmotions || 'none recorded'}
Stress level: ${currentEmotions.find(e => e.name === 'Stress')?.value || 0}%
Fatigue level: ${currentEmotions.find(e => e.name === 'Fatigue')?.value || 0}%

Provide a brief psychological assessment and supportive recommendation:`;

    return prompt;
  }

  private enhanceResponse(generatedText: string, context: EmotionalContext): string {
    const { currentEmotions, lastVoiceEmotion, lastFacialEmotion, recentAnalysis } = context;
    
    const dominantEmotion = currentEmotions.reduce((prev, curr) => 
      curr.value > prev.value ? curr : prev
    );
    
    const stressLevel = currentEmotions.find(e => e.name === 'Stress')?.value || 0;
    const fatigueLevel = currentEmotions.find(e => e.name === 'Fatigue')?.value || 0;
    const calmLevel = currentEmotions.find(e => e.name === 'Calm')?.value || 0;
    const focusLevel = currentEmotions.find(e => e.name === 'Focus')?.value || 0;

    // Build comprehensive response
    let response = `## Emotional State Analysis\n\n`;
    
    // Current State Summary
    response += `### Current Emotional Profile\n`;
    response += `**Dominant State:** ${dominantEmotion.name} (${dominantEmotion.value}%)\n\n`;
    
    if (lastVoiceEmotion && lastFacialEmotion) {
      response += `**Multimodal Detection:**\n`;
      response += `- Voice indicates: ${lastVoiceEmotion}\n`;
      response += `- Facial expression: ${lastFacialEmotion}\n\n`;
    } else if (lastVoiceEmotion) {
      response += `**Voice Detection:** ${lastVoiceEmotion}\n\n`;
    } else if (lastFacialEmotion) {
      response += `**Facial Detection:** ${lastFacialEmotion}\n\n`;
    }

    // Detailed Metrics
    response += `### Detailed Metrics\n`;
    response += `| Metric | Level | Status |\n`;
    response += `|--------|-------|--------|\n`;
    response += `| Calm | ${calmLevel}% | ${calmLevel > 60 ? '✓ Optimal' : calmLevel > 30 ? '⚠ Moderate' : '⚡ Low'} |\n`;
    response += `| Focus | ${focusLevel}% | ${focusLevel > 60 ? '✓ High' : focusLevel > 30 ? '⚠ Moderate' : '⚡ Low'} |\n`;
    response += `| Stress | ${stressLevel}% | ${stressLevel < 30 ? '✓ Low' : stressLevel < 60 ? '⚠ Moderate' : '⚡ High'} |\n`;
    response += `| Fatigue | ${fatigueLevel}% | ${fatigueLevel < 30 ? '✓ Rested' : fatigueLevel < 60 ? '⚠ Moderate' : '⚡ Tired'} |\n\n`;

    // Recent Pattern Analysis
    if (recentAnalysis.length > 0) {
      response += `### Recent Emotional Patterns\n`;
      const emotionCounts: Record<string, number> = {};
      recentAnalysis.forEach(entry => {
        const emotion = entry.emotion.split(' ')[0]; // Get first word
        emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
      });
      
      const sortedEmotions = Object.entries(emotionCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);
      
      response += `Most frequent states: ${sortedEmotions.map(([e, c]) => `${e} (${c}x)`).join(', ')}\n\n`;
    }

    // AI-Generated Insights (if available)
    if (generatedText && generatedText.trim().length > 10) {
      response += `### AI Assessment\n`;
      response += `${generatedText.trim()}\n\n`;
    }

    // Recommendations based on current state
    response += `### Recommendations\n`;
    
    if (stressLevel > 60) {
      response += `- **Priority:** High stress detected. Consider taking a short break or practicing deep breathing exercises.\n`;
      response += `- Recommend guided relaxation protocol or speaking with ground support.\n`;
    } else if (stressLevel > 40) {
      response += `- Moderate stress levels observed. Monitor for changes and consider preventive relaxation.\n`;
    }
    
    if (fatigueLevel > 60) {
      response += `- **Alert:** Elevated fatigue levels. Ensure adequate rest during next sleep cycle.\n`;
      response += `- Consider reducing non-essential tasks if possible.\n`;
    } else if (fatigueLevel > 40) {
      response += `- Fatigue levels slightly elevated. Maintain hydration and plan rest periods.\n`;
    }
    
    if (calmLevel > 60 && focusLevel > 60) {
      response += `- ✓ Optimal psychological state for complex tasks and mission-critical activities.\n`;
    } else if (calmLevel > 50 && focusLevel > 50) {
      response += `- Good baseline emotional state. Continue current activities.\n`;
    }
    
    if (stressLevel < 30 && fatigueLevel < 30) {
      response += `- Overall emotional health appears excellent. No intervention required.\n`;
    }

    response += `\n*Analysis generated by MAITRI offline AI at ${new Date().toLocaleTimeString()}*`;

    return response;
  }

  private generateRuleBasedResponse(context: EmotionalContext): string {
    // Fallback to pure rule-based response if model fails
    return this.enhanceResponse('', context);
  }

  getStatus(): { isReady: boolean; isLoading: boolean } {
    return { isReady: this.isReady, isLoading: this.isLoading };
  }
}

export const responseGenerator = new OfflineResponseGenerator();
