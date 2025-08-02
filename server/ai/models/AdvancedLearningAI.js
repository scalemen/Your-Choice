import OpenAI from 'openai';
import * as tf from '@tensorflow/tfjs-node';
import natural from 'natural';
import compromise from 'compromise';
import sentiment from 'sentiment';
import { Configuration, OpenAIApi } from 'openai';
import { createCanvas, loadImage } from 'canvas';
import sharp from 'sharp';
import Tesseract from 'tesseract.js';
import { performance } from 'perf_hooks';

/**
 * Advanced Learning AI System
 * Combines multiple AI technologies for comprehensive educational support
 */
export class AdvancedLearningAI {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    this.sentimentAnalyzer = new sentiment();
    this.tokenizer = new natural.WordTokenizer();
    this.stemmer = natural.PorterStemmer;
    this.tfidf = new natural.TfIdf();
    
    // Initialize ML models
    this.models = {
      learningStyle: null,
      difficulty: null,
      engagement: null,
      retention: null,
      personality: null,
    };
    
    this.isInitialized = false;
    this.initialize();
  }

  async initialize() {
    try {
      await this.loadModels();
      await this.initializeNLP();
      this.isInitialized = true;
      console.log('🤖 Advanced Learning AI initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Advanced Learning AI:', error);
    }
  }

  async loadModels() {
    try {
      // Load pre-trained TensorFlow models
      this.models.learningStyle = await tf.loadLayersModel('/models/learning-style-classifier.json');
      this.models.difficulty = await tf.loadLayersModel('/models/difficulty-predictor.json');
      this.models.engagement = await tf.loadLayersModel('/models/engagement-analyzer.json');
      this.models.retention = await tf.loadLayersModel('/models/retention-predictor.json');
      this.models.personality = await tf.loadLayersModel('/models/personality-classifier.json');
      
      console.log('🧠 ML models loaded successfully');
    } catch (error) {
      console.warn('⚠️ Some ML models failed to load, using fallback methods');
      await this.createFallbackModels();
    }
  }

  async createFallbackModels() {
    // Create simple neural networks as fallbacks
    this.models.learningStyle = this.createLearningStyleModel();
    this.models.difficulty = this.createDifficultyModel();
    this.models.engagement = this.createEngagementModel();
    this.models.retention = this.createRetentionModel();
    this.models.personality = this.createPersonalityModel();
  }

  createLearningStyleModel() {
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [20], units: 64, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({ units: 4, activation: 'softmax' }) // Visual, Auditory, Reading, Kinesthetic
      ]
    });
    
    model.compile({
      optimizer: 'adam',
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });
    
    return model;
  }

  createDifficultyModel() {
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [15], units: 32, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 16, activation: 'relu' }),
        tf.layers.dense({ units: 1, activation: 'sigmoid' }) // Difficulty score 0-1
      ]
    });
    
    model.compile({
      optimizer: 'adam',
      loss: 'meanSquaredError',
      metrics: ['mae']
    });
    
    return model;
  }

  createEngagementModel() {
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [25], units: 64, activation: 'relu' }),
        tf.layers.batchNormalization(),
        tf.layers.dropout({ rate: 0.4 }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({ units: 16, activation: 'relu' }),
        tf.layers.dense({ units: 1, activation: 'sigmoid' }) // Engagement score 0-1
      ]
    });
    
    model.compile({
      optimizer: 'adam',
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });
    
    return model;
  }

  createRetentionModel() {
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [30], units: 128, activation: 'relu' }),
        tf.layers.batchNormalization(),
        tf.layers.dropout({ rate: 0.5 }),
        tf.layers.dense({ units: 64, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.4 }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({ units: 1, activation: 'sigmoid' }) // Retention probability
      ]
    });
    
    model.compile({
      optimizer: 'adam',
      loss: 'binaryCrossentropy',
      metrics: ['accuracy', 'precision', 'recall']
    });
    
    return model;
  }

  createPersonalityModel() {
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [50], units: 128, activation: 'relu' }),
        tf.layers.batchNormalization(),
        tf.layers.dropout({ rate: 0.4 }),
        tf.layers.dense({ units: 64, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dense({ units: 5, activation: 'softmax' }) // Big Five personality traits
      ]
    });
    
    model.compile({
      optimizer: 'adam',
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });
    
    return model;
  }

  async initializeNLP() {
    // Initialize natural language processing components
    this.nlp = {
      tokenize: compromise,
      sentiment: this.sentimentAnalyzer,
      stemmer: this.stemmer,
      tfidf: this.tfidf,
      stopwords: natural.stopwords,
    };
    
    // Load additional NLP models
    await this.loadNLPModels();
  }

  async loadNLPModels() {
    // Load word embeddings and language models
    try {
      // This would load pre-trained word embeddings
      this.wordEmbeddings = await this.loadWordEmbeddings();
      this.languageModels = await this.loadLanguageModels();
    } catch (error) {
      console.warn('⚠️ NLP models not available, using basic implementations');
    }
  }

  // Advanced Content Analysis
  async analyzeContent(content, type = 'text') {
    const startTime = performance.now();
    
    try {
      const analysis = {
        type,
        timestamp: new Date(),
        metrics: {},
        insights: [],
        recommendations: []
      };

      if (type === 'text') {
        analysis.metrics = await this.analyzeText(content);
      } else if (type === 'image') {
        analysis.metrics = await this.analyzeImage(content);
      } else if (type === 'video') {
        analysis.metrics = await this.analyzeVideo(content);
      } else if (type === 'audio') {
        analysis.metrics = await this.analyzeAudio(content);
      }

      // Generate insights and recommendations
      analysis.insights = await this.generateInsights(analysis.metrics, type);
      analysis.recommendations = await this.generateRecommendations(analysis.metrics, type);
      
      const endTime = performance.now();
      analysis.processingTime = endTime - startTime;
      
      return analysis;
    } catch (error) {
      console.error('Content analysis failed:', error);
      throw new Error('Failed to analyze content');
    }
  }

  async analyzeText(text) {
    const metrics = {};
    
    // Basic text metrics
    metrics.length = text.length;
    metrics.wordCount = this.tokenizer.tokenize(text).length;
    metrics.sentenceCount = text.split(/[.!?]+/).length - 1;
    metrics.paragraphCount = text.split(/\n\s*\n/).length;
    
    // Readability analysis
    metrics.readability = this.calculateReadability(text);
    
    // Sentiment analysis
    metrics.sentiment = this.analyzeSentiment(text);
    
    // Complexity analysis
    metrics.complexity = await this.analyzeComplexity(text);
    
    // Topic extraction
    metrics.topics = await this.extractTopics(text);
    
    // Keyword extraction
    metrics.keywords = this.extractKeywords(text);
    
    // Language detection
    metrics.language = this.detectLanguage(text);
    
    // Educational level
    metrics.educationLevel = this.predictEducationLevel(text);
    
    return metrics;
  }

  async analyzeImage(imageBuffer) {
    const metrics = {};
    
    try {
      // Image processing with Sharp
      const image = sharp(imageBuffer);
      const metadata = await image.metadata();
      
      metrics.dimensions = {
        width: metadata.width,
        height: metadata.height
      };
      metrics.format = metadata.format;
      metrics.size = metadata.size;
      
      // OCR analysis
      const ocrResult = await Tesseract.recognize(imageBuffer, 'eng', {
        logger: m => console.log(m)
      });
      
      metrics.extractedText = ocrResult.data.text;
      metrics.confidence = ocrResult.data.confidence;
      
      if (metrics.extractedText) {
        metrics.textAnalysis = await this.analyzeText(metrics.extractedText);
      }
      
      // Object detection (placeholder for advanced CV)
      metrics.objects = await this.detectObjects(imageBuffer);
      
      // Educational content classification
      metrics.contentType = await this.classifyEducationalContent(imageBuffer);
      
    } catch (error) {
      console.error('Image analysis failed:', error);
      metrics.error = error.message;
    }
    
    return metrics;
  }

  async analyzeVideo(videoPath) {
    const metrics = {};
    
    // Video analysis would require additional libraries like FFmpeg
    // This is a placeholder for comprehensive video analysis
    
    metrics.placeholder = true;
    metrics.message = 'Video analysis requires additional setup';
    
    return metrics;
  }

  async analyzeAudio(audioBuffer) {
    const metrics = {};
    
    // Audio analysis would require libraries like speech-to-text
    // This is a placeholder for comprehensive audio analysis
    
    metrics.placeholder = true;
    metrics.message = 'Audio analysis requires additional setup';
    
    return metrics;
  }

  calculateReadability(text) {
    // Flesch Reading Ease Score
    const sentences = text.split(/[.!?]+/).length - 1;
    const words = this.tokenizer.tokenize(text).length;
    const syllables = this.countSyllables(text);
    
    if (sentences === 0 || words === 0) return 0;
    
    const score = 206.835 - (1.015 * (words / sentences)) - (84.6 * (syllables / words));
    
    return {
      score: Math.max(0, Math.min(100, score)),
      level: this.getReadingLevel(score),
      sentences,
      words,
      syllables
    };
  }

  countSyllables(text) {
    return text.toLowerCase()
      .replace(/[^a-z]/g, '')
      .replace(/[aeiouy]+/g, 'a')
      .replace(/a$/, '')
      .length || 1;
  }

  getReadingLevel(score) {
    if (score >= 90) return 'Very Easy';
    if (score >= 80) return 'Easy';
    if (score >= 70) return 'Fairly Easy';
    if (score >= 60) return 'Standard';
    if (score >= 50) return 'Fairly Difficult';
    if (score >= 30) return 'Difficult';
    return 'Very Difficult';
  }

  analyzeSentiment(text) {
    const result = this.sentimentAnalyzer.analyze(text);
    
    return {
      score: result.score,
      comparative: result.comparative,
      positive: result.positive,
      negative: result.negative,
      polarity: result.score > 0 ? 'positive' : result.score < 0 ? 'negative' : 'neutral'
    };
  }

  async analyzeComplexity(text) {
    // Use ML model to predict complexity
    if (this.models.difficulty) {
      const features = this.extractComplexityFeatures(text);
      const prediction = await this.models.difficulty.predict(tf.tensor2d([features])).data();
      
      return {
        score: prediction[0],
        level: this.getComplexityLevel(prediction[0]),
        features
      };
    }
    
    // Fallback complexity analysis
    return this.calculateBasicComplexity(text);
  }

  extractComplexityFeatures(text) {
    // Extract features for complexity analysis
    const tokens = this.tokenizer.tokenize(text);
    const sentences = text.split(/[.!?]+/).length - 1;
    
    return [
      tokens.length, // Word count
      sentences, // Sentence count
      tokens.length / sentences, // Average words per sentence
      this.countSyllables(text) / tokens.length, // Average syllables per word
      this.countComplexWords(tokens), // Complex word count
      this.calculateLexicalDiversity(tokens), // Lexical diversity
      this.countTechnicalTerms(tokens), // Technical terms
      this.countAbstractConcepts(text), // Abstract concepts
      this.calculateSyntaxComplexity(text), // Syntax complexity
      this.countPunctuation(text), // Punctuation complexity
      this.calculateCohesion(text), // Text cohesion
      this.countModalVerbs(tokens), // Modal verbs
      this.countPassiveVoice(text), // Passive voice usage
      this.calculateInformationDensity(text), // Information density
      this.countNestedClauses(text) // Nested clauses
    ];
  }

  countComplexWords(tokens) {
    return tokens.filter(word => word.length > 6 || this.countSyllables(word) > 2).length;
  }

  calculateLexicalDiversity(tokens) {
    const uniqueWords = new Set(tokens.map(word => word.toLowerCase()));
    return uniqueWords.size / tokens.length;
  }

  countTechnicalTerms(tokens) {
    const technicalTerms = new Set(['algorithm', 'hypothesis', 'methodology', 'analysis', 'synthesis']);
    return tokens.filter(word => technicalTerms.has(word.toLowerCase())).length;
  }

  countAbstractConcepts(text) {
    const abstractWords = ['freedom', 'justice', 'beauty', 'truth', 'knowledge', 'wisdom'];
    const tokens = this.tokenizer.tokenize(text.toLowerCase());
    return tokens.filter(word => abstractWords.includes(word)).length;
  }

  calculateSyntaxComplexity(text) {
    // Count complex sentence structures
    const complexPatterns = [
      /\b(although|however|nevertheless|furthermore|moreover)\b/gi,
      /\b(if|when|while|since|because|unless)\b/gi,
      /[,;:]/g
    ];
    
    return complexPatterns.reduce((count, pattern) => {
      const matches = text.match(pattern);
      return count + (matches ? matches.length : 0);
    }, 0);
  }

  countPunctuation(text) {
    return (text.match(/[,.;:!?()[\]{}'"]/g) || []).length;
  }

  calculateCohesion(text) {
    // Simple cohesion measure based on repeated content words
    const tokens = this.tokenizer.tokenize(text.toLowerCase());
    const contentWords = tokens.filter(word => 
      !this.nlp.stopwords.includes(word) && word.length > 3
    );
    
    const uniqueWords = new Set(contentWords);
    return (contentWords.length - uniqueWords.size) / contentWords.length;
  }

  countModalVerbs(tokens) {
    const modals = ['can', 'could', 'may', 'might', 'must', 'shall', 'should', 'will', 'would'];
    return tokens.filter(word => modals.includes(word.toLowerCase())).length;
  }

  countPassiveVoice(text) {
    // Simple passive voice detection
    const passivePattern = /\b(is|are|was|were|been|being)\s+\w+ed\b/gi;
    const matches = text.match(passivePattern);
    return matches ? matches.length : 0;
  }

  calculateInformationDensity(text) {
    const tokens = this.tokenizer.tokenize(text);
    const contentWords = tokens.filter(word => 
      !this.nlp.stopwords.includes(word.toLowerCase()) && word.length > 2
    );
    return contentWords.length / tokens.length;
  }

  countNestedClauses(text) {
    // Count nested structures (approximation)
    const nesting = text.match(/\([^)]*\)/g) || [];
    const subclauses = text.match(/,\s*which\s+/gi) || [];
    return nesting.length + subclauses.length;
  }

  getComplexityLevel(score) {
    if (score < 0.2) return 'Elementary';
    if (score < 0.4) return 'Middle School';
    if (score < 0.6) return 'High School';
    if (score < 0.8) return 'College';
    return 'Graduate';
  }

  calculateBasicComplexity(text) {
    const readability = this.calculateReadability(text);
    const complexity = 1 - (readability.score / 100);
    
    return {
      score: complexity,
      level: this.getComplexityLevel(complexity),
      basedOn: 'readability'
    };
  }

  async extractTopics(text) {
    // Topic modeling using TF-IDF and clustering
    const tokens = this.tokenizer.tokenize(text.toLowerCase());
    const filteredTokens = tokens.filter(word => 
      !this.nlp.stopwords.includes(word) && word.length > 2
    );
    
    // Add to TF-IDF corpus
    this.tfidf.addDocument(filteredTokens);
    
    // Get top terms
    const topics = [];
    this.tfidf.listTerms(0).slice(0, 10).forEach(item => {
      topics.push({
        term: item.term,
        score: item.tfidf
      });
    });
    
    return topics;
  }

  extractKeywords(text) {
    const tokens = this.tokenizer.tokenize(text.toLowerCase());
    const filteredTokens = tokens.filter(word => 
      !this.nlp.stopwords.includes(word) && word.length > 2
    );
    
    // Count frequency
    const frequency = {};
    filteredTokens.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });
    
    // Sort by frequency and return top keywords
    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([word, count]) => ({ word, count }));
  }

  detectLanguage(text) {
    // Simple language detection (placeholder)
    // In production, would use a proper language detection library
    return {
      language: 'en',
      confidence: 0.95
    };
  }

  predictEducationLevel(text) {
    const readability = this.calculateReadability(text);
    
    if (readability.score >= 90) return 'Elementary';
    if (readability.score >= 80) return 'Middle School';
    if (readability.score >= 70) return 'High School';
    if (readability.score >= 60) return 'College';
    return 'Graduate';
  }

  async detectObjects(imageBuffer) {
    // Placeholder for object detection
    // Would use TensorFlow.js with pre-trained models like COCO-SSD
    return {
      placeholder: true,
      message: 'Object detection requires pre-trained models'
    };
  }

  async classifyEducationalContent(imageBuffer) {
    // Placeholder for educational content classification
    return {
      type: 'unknown',
      confidence: 0,
      categories: []
    };
  }

  async generateInsights(metrics, type) {
    const insights = [];
    
    if (type === 'text') {
      // Generate text-specific insights
      if (metrics.readability) {
        insights.push({
          type: 'readability',
          message: `Content is ${metrics.readability.level.toLowerCase()} to read`,
          score: metrics.readability.score,
          recommendation: this.getReadabilityRecommendation(metrics.readability.score)
        });
      }
      
      if (metrics.sentiment) {
        insights.push({
          type: 'sentiment',
          message: `Content has a ${metrics.sentiment.polarity} tone`,
          score: metrics.sentiment.score,
          recommendation: this.getSentimentRecommendation(metrics.sentiment.polarity)
        });
      }
      
      if (metrics.complexity) {
        insights.push({
          type: 'complexity',
          message: `Content is at ${metrics.complexity.level.toLowerCase()} level`,
          score: metrics.complexity.score,
          recommendation: this.getComplexityRecommendation(metrics.complexity.level)
        });
      }
    }
    
    return insights;
  }

  async generateRecommendations(metrics, type) {
    const recommendations = [];
    
    // Use GPT-4 to generate personalized recommendations
    try {
      const prompt = this.buildRecommendationPrompt(metrics, type);
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert educational AI that provides personalized learning recommendations based on content analysis.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      });
      
      const aiRecommendations = this.parseAIRecommendations(response.choices[0].message.content);
      recommendations.push(...aiRecommendations);
      
    } catch (error) {
      console.error('Failed to generate AI recommendations:', error);
      // Fallback to rule-based recommendations
      recommendations.push(...this.generateRuleBasedRecommendations(metrics, type));
    }
    
    return recommendations;
  }

  buildRecommendationPrompt(metrics, type) {
    return `
Based on the following content analysis metrics for ${type} content, provide 3-5 specific, actionable recommendations for improving learning outcomes:

Metrics: ${JSON.stringify(metrics, null, 2)}

Please provide recommendations in the following format:
1. [Category]: [Specific recommendation]
2. [Category]: [Specific recommendation]
...

Focus on practical, evidence-based suggestions that would help students better understand and engage with this content.
    `.trim();
  }

  parseAIRecommendations(content) {
    const lines = content.split('\n').filter(line => line.trim());
    const recommendations = [];
    
    lines.forEach(line => {
      const match = line.match(/^\d+\.\s*\[([^\]]+)\]:\s*(.+)$/);
      if (match) {
        recommendations.push({
          category: match[1],
          recommendation: match[2],
          source: 'ai'
        });
      }
    });
    
    return recommendations;
  }

  generateRuleBasedRecommendations(metrics, type) {
    const recommendations = [];
    
    if (type === 'text' && metrics.readability) {
      if (metrics.readability.score < 30) {
        recommendations.push({
          category: 'Readability',
          recommendation: 'Consider simplifying sentence structure and using more common vocabulary',
          source: 'rule'
        });
      } else if (metrics.readability.score > 90) {
        recommendations.push({
          category: 'Readability',
          recommendation: 'Content may be too simple - consider adding more complex concepts',
          source: 'rule'
        });
      }
    }
    
    if (type === 'text' && metrics.sentiment && metrics.sentiment.score < -2) {
      recommendations.push({
        category: 'Engagement',
        recommendation: 'Consider adding more positive examples or motivational content',
        source: 'rule'
      });
    }
    
    return recommendations;
  }

  getReadabilityRecommendation(score) {
    if (score < 30) return 'Simplify language and sentence structure';
    if (score > 90) return 'Consider adding more sophisticated vocabulary';
    return 'Readability is appropriate for target audience';
  }

  getSentimentRecommendation(polarity) {
    if (polarity === 'negative') return 'Consider adding more positive examples';
    if (polarity === 'positive') return 'Good emotional tone for learning';
    return 'Consider adding more engaging emotional content';
  }

  getComplexityRecommendation(level) {
    return `Content is appropriate for ${level} level learners`;
  }

  // Learning Style Analysis
  async analyzeLearningStyle(userData) {
    if (!this.models.learningStyle) {
      return this.analyzeLearningStyleBasic(userData);
    }
    
    const features = this.extractLearningStyleFeatures(userData);
    const prediction = await this.models.learningStyle.predict(tf.tensor2d([features])).data();
    
    const styles = ['Visual', 'Auditory', 'Reading', 'Kinesthetic'];
    const scores = Array.from(prediction);
    
    return styles.map((style, index) => ({
      style,
      score: scores[index],
      preference: scores[index] > 0.5 ? 'high' : 'low'
    })).sort((a, b) => b.score - a.score);
  }

  extractLearningStyleFeatures(userData) {
    // Extract features based on user behavior and preferences
    return [
      userData.visualContentEngagement || 0,
      userData.audioContentEngagement || 0,
      userData.textContentEngagement || 0,
      userData.interactiveContentEngagement || 0,
      userData.videoWatchTime || 0,
      userData.audioListenTime || 0,
      userData.readingTime || 0,
      userData.practiceTime || 0,
      userData.notesTaken || 0,
      userData.flashcardsUsed || 0,
      userData.gamesPlayed || 0,
      userData.collaborationTime || 0,
      userData.timeOfDayPreference || 0,
      userData.sessionLength || 0,
      userData.repetitionPreference || 0,
      userData.feedbackPreference || 0,
      userData.structurePreference || 0,
      userData.pacePreference || 0,
      userData.difficultyPreference || 0,
      userData.multimediaPreference || 0
    ];
  }

  analyzeLearningStyleBasic(userData) {
    // Fallback learning style analysis
    const styles = [
      { style: 'Visual', score: Math.random(), preference: 'medium' },
      { style: 'Auditory', score: Math.random(), preference: 'medium' },
      { style: 'Reading', score: Math.random(), preference: 'medium' },
      { style: 'Kinesthetic', score: Math.random(), preference: 'medium' }
    ];
    
    return styles.sort((a, b) => b.score - a.score);
  }

  // Personality Analysis
  async analyzePersonality(userData, textSamples = []) {
    if (!this.models.personality) {
      return this.analyzePersonalityBasic(userData, textSamples);
    }
    
    const features = this.extractPersonalityFeatures(userData, textSamples);
    const prediction = await this.models.personality.predict(tf.tensor2d([features])).data();
    
    const traits = ['Openness', 'Conscientiousness', 'Extraversion', 'Agreeableness', 'Neuroticism'];
    const scores = Array.from(prediction);
    
    return traits.map((trait, index) => ({
      trait,
      score: scores[index],
      level: this.getPersonalityLevel(scores[index])
    }));
  }

  extractPersonalityFeatures(userData, textSamples) {
    // Extract comprehensive personality features
    const features = new Array(50).fill(0);
    
    // Behavioral features
    features[0] = userData.studySessionsPerWeek || 0;
    features[1] = userData.averageSessionLength || 0;
    features[2] = userData.collaborationFrequency || 0;
    features[3] = userData.helpSeekingFrequency || 0;
    features[4] = userData.goalSettingFrequency || 0;
    
    // Text analysis features
    if (textSamples.length > 0) {
      const combinedText = textSamples.join(' ');
      const sentiment = this.analyzeSentiment(combinedText);
      const readability = this.calculateReadability(combinedText);
      
      features[5] = sentiment.score;
      features[6] = sentiment.comparative;
      features[7] = readability.score;
      
      // Word usage patterns
      const tokens = this.tokenizer.tokenize(combinedText.toLowerCase());
      features[8] = this.countEmotionalWords(tokens);
      features[9] = this.countSocialWords(tokens);
      features[10] = this.countAchievementWords(tokens);
    }
    
    // Fill remaining features with user behavior data
    for (let i = 11; i < 50; i++) {
      features[i] = Math.random(); // Placeholder for additional behavioral metrics
    }
    
    return features;
  }

  countEmotionalWords(tokens) {
    const emotionalWords = ['happy', 'sad', 'excited', 'worried', 'confident', 'nervous'];
    return tokens.filter(word => emotionalWords.includes(word)).length;
  }

  countSocialWords(tokens) {
    const socialWords = ['friend', 'team', 'group', 'together', 'share', 'collaborate'];
    return tokens.filter(word => socialWords.includes(word)).length;
  }

  countAchievementWords(tokens) {
    const achievementWords = ['goal', 'success', 'achieve', 'accomplish', 'complete', 'finish'];
    return tokens.filter(word => achievementWords.includes(word)).length;
  }

  getPersonalityLevel(score) {
    if (score < 0.3) return 'Low';
    if (score < 0.7) return 'Medium';
    return 'High';
  }

  analyzePersonalityBasic(userData, textSamples) {
    // Fallback personality analysis
    const traits = ['Openness', 'Conscientiousness', 'Extraversion', 'Agreeableness', 'Neuroticism'];
    
    return traits.map(trait => ({
      trait,
      score: Math.random(),
      level: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)]
    }));
  }

  // Engagement Prediction
  async predictEngagement(contentMetrics, userProfile) {
    if (!this.models.engagement) {
      return this.predictEngagementBasic(contentMetrics, userProfile);
    }
    
    const features = this.extractEngagementFeatures(contentMetrics, userProfile);
    const prediction = await this.models.engagement.predict(tf.tensor2d([features])).data();
    
    return {
      score: prediction[0],
      level: this.getEngagementLevel(prediction[0]),
      factors: this.identifyEngagementFactors(features, prediction[0])
    };
  }

  extractEngagementFeatures(contentMetrics, userProfile) {
    return [
      contentMetrics.readability?.score || 0,
      contentMetrics.complexity?.score || 0,
      contentMetrics.sentiment?.score || 0,
      contentMetrics.wordCount || 0,
      userProfile.averageEngagement || 0,
      userProfile.subjectInterest || 0,
      userProfile.difficultyPreference || 0,
      userProfile.timeOfDay || 0,
      userProfile.sessionNumber || 0,
      userProfile.energyLevel || 0,
      userProfile.motivation || 0,
      userProfile.priorKnowledge || 0,
      userProfile.learningGoal || 0,
      userProfile.deadline || 0,
      userProfile.socialContext || 0,
      userProfile.deviceType || 0,
      userProfile.environment || 0,
      userProfile.multitasking || 0,
      userProfile.notifications || 0,
      userProfile.recentPerformance || 0,
      userProfile.mood || 0,
      userProfile.stress || 0,
      userProfile.sleep || 0,
      userProfile.health || 0,
      userProfile.personalInterest || 0
    ];
  }

  getEngagementLevel(score) {
    if (score < 0.3) return 'Low';
    if (score < 0.7) return 'Medium';
    return 'High';
  }

  identifyEngagementFactors(features, score) {
    // Identify which factors most influence engagement
    const factorNames = [
      'readability', 'complexity', 'sentiment', 'length',
      'pastEngagement', 'interest', 'difficulty', 'timeOfDay',
      'sessionNumber', 'energy', 'motivation', 'knowledge',
      'goal', 'deadline', 'social', 'device', 'environment',
      'multitasking', 'notifications', 'performance',
      'mood', 'stress', 'sleep', 'health', 'personalInterest'
    ];
    
    return factorNames.map((name, index) => ({
      factor: name,
      value: features[index],
      impact: this.calculateImpact(features[index], score)
    })).sort((a, b) => b.impact - a.impact).slice(0, 5);
  }

  calculateImpact(featureValue, prediction) {
    // Simplified impact calculation
    return Math.abs(featureValue - 0.5) * prediction;
  }

  predictEngagementBasic(contentMetrics, userProfile) {
    // Fallback engagement prediction
    const baseScore = 0.5;
    let adjustments = 0;
    
    if (contentMetrics.readability?.score > 50) adjustments += 0.1;
    if (contentMetrics.sentiment?.polarity === 'positive') adjustments += 0.1;
    if (userProfile.subjectInterest > 0.7) adjustments += 0.2;
    
    const score = Math.min(1, Math.max(0, baseScore + adjustments));
    
    return {
      score,
      level: this.getEngagementLevel(score),
      factors: []
    };
  }

  // Retention Prediction
  async predictRetention(studySession, userHistory) {
    if (!this.models.retention) {
      return this.predictRetentionBasic(studySession, userHistory);
    }
    
    const features = this.extractRetentionFeatures(studySession, userHistory);
    const prediction = await this.models.retention.predict(tf.tensor2d([features])).data();
    
    return {
      probability: prediction[0],
      confidence: this.calculateConfidence(prediction[0]),
      timeToForget: this.estimateTimeToForget(prediction[0]),
      recommendations: this.generateRetentionRecommendations(features, prediction[0])
    };
  }

  extractRetentionFeatures(studySession, userHistory) {
    return [
      studySession.duration || 0,
      studySession.engagement || 0,
      studySession.difficulty || 0,
      studySession.completionRate || 0,
      studySession.interactionCount || 0,
      studySession.correctAnswers || 0,
      studySession.incorrectAnswers || 0,
      studySession.hintsUsed || 0,
      studySession.timeOnTask || 0,
      studySession.breaks || 0,
      userHistory.averageRetention || 0,
      userHistory.studyFrequency || 0,
      userHistory.reviewFrequency || 0,
      userHistory.spaceRepetition || 0,
      userHistory.priorKnowledge || 0,
      userHistory.similarTopics || 0,
      userHistory.learningStyle || 0,
      userHistory.motivation || 0,
      userHistory.attention || 0,
      userHistory.memoryCapacity || 0,
      userHistory.processingSpeed || 0,
      userHistory.metacognition || 0,
      userHistory.sleep || 0,
      userHistory.stress || 0,
      userHistory.health || 0,
      userHistory.age || 0,
      userHistory.education || 0,
      userHistory.experience || 0,
      userHistory.confidence || 0,
      userHistory.interest || 0
    ];
  }

  calculateConfidence(probability) {
    // Higher confidence for extreme probabilities
    return Math.abs(probability - 0.5) * 2;
  }

  estimateTimeToForget(probability) {
    // Estimate time until retention drops below threshold
    const forgettingCurve = -Math.log(0.5) / Math.log(probability);
    return forgettingCurve * 24; // hours
  }

  generateRetentionRecommendations(features, probability) {
    const recommendations = [];
    
    if (probability < 0.5) {
      recommendations.push('Schedule review session within 24 hours');
      recommendations.push('Use spaced repetition for better retention');
      recommendations.push('Create connections to existing knowledge');
    } else if (probability < 0.7) {
      recommendations.push('Review again in 3-5 days');
      recommendations.push('Practice with different examples');
    } else {
      recommendations.push('Review again in 1-2 weeks');
      recommendations.push('Apply knowledge in new contexts');
    }
    
    return recommendations;
  }

  predictRetentionBasic(studySession, userHistory) {
    // Simple retention prediction based on engagement and difficulty
    const engagement = studySession.engagement || 0.5;
    const difficulty = studySession.difficulty || 0.5;
    const appropriateDifficulty = 1 - Math.abs(difficulty - 0.7); // Optimal difficulty around 0.7
    
    const probability = (engagement + appropriateDifficulty) / 2;
    
    return {
      probability,
      confidence: 0.5,
      timeToForget: this.estimateTimeToForget(probability),
      recommendations: this.generateRetentionRecommendations([], probability)
    };
  }

  // Utility Methods
  async loadWordEmbeddings() {
    // Placeholder for loading word embeddings
    return {};
  }

  async loadLanguageModels() {
    // Placeholder for loading language models
    return {};
  }

  // Performance monitoring
  getPerformanceMetrics() {
    return {
      modelsLoaded: Object.keys(this.models).filter(key => this.models[key] !== null).length,
      totalModels: Object.keys(this.models).length,
      memoryUsage: process.memoryUsage(),
      isInitialized: this.isInitialized
    };
  }

  // Cleanup
  dispose() {
    Object.values(this.models).forEach(model => {
      if (model && typeof model.dispose === 'function') {
        model.dispose();
      }
    });
    
    tf.disposeVariables();
    console.log('🧹 Advanced Learning AI disposed');
  }
}

// Export singleton instance
export const advancedLearningAI = new AdvancedLearningAI();
export default advancedLearningAI;