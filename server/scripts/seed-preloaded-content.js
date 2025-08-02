import { db } from '../db/index.js';
import {
  contentCategories,
  preloadedFlashcardCollections,
  preloadedFlashcards
} from '../db/preloaded-content-schema.js';
import 'dotenv/config';

// Sample data for different subjects and grade levels
const categories = [
  // Mathematics
  {
    name: 'mathematics',
    displayName: 'Mathematics',
    description: 'Mathematical concepts and problem-solving',
    icon: '🔢',
    color: '#3B82F6',
    level: 0,
    path: 'mathematics',
    subject: 'Mathematics',
    sortOrder: 1
  },
  {
    name: 'algebra',
    displayName: 'Algebra',
    description: 'Algebraic equations and expressions',
    icon: '📊',
    color: '#3B82F6',
    level: 1,
    path: 'mathematics/algebra',
    subject: 'Mathematics',
    parentCategory: 'mathematics',
    sortOrder: 1
  },
  {
    name: 'geometry',
    displayName: 'Geometry',
    description: 'Shapes, angles, and spatial reasoning',
    icon: '📐',
    color: '#3B82F6',
    level: 1,
    path: 'mathematics/geometry',
    subject: 'Mathematics',
    parentCategory: 'mathematics',
    sortOrder: 2
  },
  {
    name: 'calculus',
    displayName: 'Calculus',
    description: 'Derivatives, integrals, and limits',
    icon: '∫',
    color: '#3B82F6',
    level: 1,
    path: 'mathematics/calculus',
    subject: 'Mathematics',
    parentCategory: 'mathematics',
    sortOrder: 3
  },

  // Science
  {
    name: 'science',
    displayName: 'Science',
    description: 'Natural sciences and scientific method',
    icon: '🔬',
    color: '#10B981',
    level: 0,
    path: 'science',
    subject: 'Science',
    sortOrder: 2
  },
  {
    name: 'biology',
    displayName: 'Biology',
    description: 'Life sciences and living organisms',
    icon: '🧬',
    color: '#10B981',
    level: 1,
    path: 'science/biology',
    subject: 'Biology',
    parentCategory: 'science',
    sortOrder: 1
  },
  {
    name: 'chemistry',
    displayName: 'Chemistry',
    description: 'Chemical reactions and molecular structure',
    icon: '⚗️',
    color: '#10B981',
    level: 1,
    path: 'science/chemistry',
    subject: 'Chemistry',
    parentCategory: 'science',
    sortOrder: 2
  },
  {
    name: 'physics',
    displayName: 'Physics',
    description: 'Matter, energy, and physical phenomena',
    icon: '⚛️',
    color: '#10B981',
    level: 1,
    path: 'science/physics',
    subject: 'Physics',
    parentCategory: 'science',
    sortOrder: 3
  },

  // Languages
  {
    name: 'languages',
    displayName: 'Languages',
    description: 'World languages and linguistics',
    icon: '🗣️',
    color: '#8B5CF6',
    level: 0,
    path: 'languages',
    subject: 'Languages',
    sortOrder: 3
  },
  {
    name: 'spanish',
    displayName: 'Spanish',
    description: 'Spanish language learning',
    icon: '🇪🇸',
    color: '#8B5CF6',
    level: 1,
    path: 'languages/spanish',
    subject: 'Spanish',
    parentCategory: 'languages',
    sortOrder: 1
  },
  {
    name: 'french',
    displayName: 'French',
    description: 'French language learning',
    icon: '🇫🇷',
    color: '#8B5CF6',
    level: 1,
    path: 'languages/french',
    subject: 'French',
    parentCategory: 'languages',
    sortOrder: 2
  },

  // History
  {
    name: 'history',
    displayName: 'History',
    description: 'Historical events and civilizations',
    icon: '📚',
    color: '#F59E0B',
    level: 0,
    path: 'history',
    subject: 'History',
    sortOrder: 4
  },
  {
    name: 'world-history',
    displayName: 'World History',
    description: 'Global historical events and civilizations',
    icon: '🌍',
    color: '#F59E0B',
    level: 1,
    path: 'history/world-history',
    subject: 'World History',
    parentCategory: 'history',
    sortOrder: 1
  },
  {
    name: 'us-history',
    displayName: 'US History',
    description: 'United States historical events',
    icon: '🇺🇸',
    color: '#F59E0B',
    level: 1,
    path: 'history/us-history',
    subject: 'US History',
    parentCategory: 'history',
    sortOrder: 2
  }
];

const flashcardCollections = [
  // Mathematics Collections
  {
    title: 'Basic Algebra Fundamentals',
    description: 'Essential algebraic concepts including variables, expressions, and simple equations.',
    shortDescription: 'Master fundamental algebra concepts',
    subject: 'Mathematics',
    topic: 'Algebra',
    gradeLevel: 'High School',
    difficulty: 'beginner',
    category: 'algebra',
    cardCount: 25,
    estimatedStudyTime: 45,
    collectionType: 'standard',
    hasImages: false,
    tags: ['algebra', 'equations', 'variables', 'mathematics'],
    keywords: ['variable', 'equation', 'expression', 'solve'],
    qualityScore: 4.7,
    rating: 4.5,
    ratingCount: 234,
    cards: [
      {
        front: 'What is a variable in algebra?',
        back: 'A variable is a letter or symbol that represents an unknown number or value.',
        explanation: 'Variables like x, y, or n allow us to write general mathematical relationships.',
        concepts: ['variables', 'algebra basics'],
        cognitiveLevel: 'remember'
      },
      {
        front: 'Solve for x: x + 5 = 12',
        back: 'x = 7',
        explanation: 'Subtract 5 from both sides: x + 5 - 5 = 12 - 5, so x = 7',
        concepts: ['solving equations', 'basic algebra'],
        cognitiveLevel: 'apply'
      },
      {
        front: 'What is an algebraic expression?',
        back: 'A mathematical phrase that contains numbers, variables, and operations.',
        explanation: 'Examples include 3x + 2, 5y - 7, or 2a² + 3b',
        concepts: ['expressions', 'algebra basics'],
        cognitiveLevel: 'understand'
      },
      {
        front: 'Simplify: 3x + 2x',
        back: '5x',
        explanation: 'Combine like terms: 3x + 2x = (3 + 2)x = 5x',
        concepts: ['combining like terms', 'simplification'],
        cognitiveLevel: 'apply'
      },
      {
        front: 'What does it mean to "solve" an equation?',
        back: 'To find the value(s) of the variable that make the equation true.',
        explanation: 'Solving involves using inverse operations to isolate the variable.',
        concepts: ['solving equations', 'algebra basics'],
        cognitiveLevel: 'understand'
      }
    ]
  },

  {
    title: 'Geometry: Angles and Triangles',
    description: 'Comprehensive study of angles, triangle properties, and geometric relationships.',
    shortDescription: 'Master angles and triangle geometry',
    subject: 'Mathematics',
    topic: 'Geometry',
    gradeLevel: 'Middle School',
    difficulty: 'intermediate',
    category: 'geometry',
    cardCount: 30,
    estimatedStudyTime: 60,
    collectionType: 'standard',
    hasImages: true,
    tags: ['geometry', 'angles', 'triangles', 'shapes'],
    keywords: ['angle', 'triangle', 'degree', 'vertex'],
    qualityScore: 4.8,
    rating: 4.6,
    ratingCount: 187,
    cards: [
      {
        front: 'What is an acute angle?',
        back: 'An angle that measures less than 90 degrees.',
        explanation: 'Acute angles are "sharp" angles, smaller than a right angle.',
        concepts: ['angles', 'angle classification'],
        cognitiveLevel: 'remember'
      },
      {
        front: 'What is the sum of angles in any triangle?',
        back: '180 degrees',
        explanation: 'This is a fundamental property of triangles in Euclidean geometry.',
        concepts: ['triangles', 'angle sum'],
        cognitiveLevel: 'remember'
      },
      {
        front: 'What type of triangle has all sides equal?',
        back: 'Equilateral triangle',
        explanation: 'In an equilateral triangle, all three sides are equal and all angles are 60°.',
        concepts: ['triangles', 'triangle classification'],
        cognitiveLevel: 'remember'
      }
    ]
  },

  // Science Collections
  {
    title: 'Cell Biology Basics',
    description: 'Introduction to cell structure, organelles, and basic cellular processes.',
    shortDescription: 'Learn fundamental cell biology concepts',
    subject: 'Biology',
    topic: 'Cell Biology',
    gradeLevel: 'High School',
    difficulty: 'beginner',
    category: 'biology',
    cardCount: 35,
    estimatedStudyTime: 70,
    collectionType: 'standard',
    hasImages: true,
    tags: ['biology', 'cells', 'organelles', 'life science'],
    keywords: ['cell', 'nucleus', 'mitochondria', 'membrane'],
    qualityScore: 4.9,
    rating: 4.7,
    ratingCount: 342,
    cards: [
      {
        front: 'What is the basic unit of life?',
        back: 'The cell',
        explanation: 'All living organisms are composed of one or more cells.',
        concepts: ['cell theory', 'biology basics'],
        cognitiveLevel: 'remember'
      },
      {
        front: 'What is the function of the nucleus?',
        back: 'Controls cell activities and contains the cell\'s DNA.',
        explanation: 'The nucleus is often called the "control center" of the cell.',
        concepts: ['nucleus', 'cell organelles'],
        cognitiveLevel: 'understand'
      },
      {
        front: 'What are mitochondria known as?',
        back: 'The powerhouses of the cell',
        explanation: 'Mitochondria produce ATP, the energy currency of cells.',
        concepts: ['mitochondria', 'cellular respiration'],
        cognitiveLevel: 'remember'
      }
    ]
  },

  {
    title: 'Chemical Elements and Periodic Table',
    description: 'Master the periodic table, element properties, and chemical symbols.',
    shortDescription: 'Learn chemical elements and their properties',
    subject: 'Chemistry',
    topic: 'Periodic Table',
    gradeLevel: 'High School',
    difficulty: 'intermediate',
    category: 'chemistry',
    cardCount: 45,
    estimatedStudyTime: 90,
    collectionType: 'standard',
    hasImages: false,
    tags: ['chemistry', 'elements', 'periodic table', 'symbols'],
    keywords: ['element', 'atom', 'symbol', 'periodic'],
    qualityScore: 4.6,
    rating: 4.4,
    ratingCount: 156,
    cards: [
      {
        front: 'What is the chemical symbol for hydrogen?',
        back: 'H',
        explanation: 'Hydrogen is the first element on the periodic table.',
        concepts: ['chemical symbols', 'elements'],
        cognitiveLevel: 'remember'
      },
      {
        front: 'What is the atomic number of carbon?',
        back: '6',
        explanation: 'Carbon has 6 protons in its nucleus, giving it atomic number 6.',
        concepts: ['atomic number', 'carbon'],
        cognitiveLevel: 'remember'
      },
      {
        front: 'Which group contains the noble gases?',
        back: 'Group 18 (or Group VIII)',
        explanation: 'Noble gases are chemically inert and located in the far right column.',
        concepts: ['noble gases', 'periodic table groups'],
        cognitiveLevel: 'remember'
      }
    ]
  },

  // Language Collections
  {
    title: 'Spanish Vocabulary: Daily Life',
    description: 'Essential Spanish vocabulary for everyday situations and conversations.',
    shortDescription: 'Learn essential Spanish words for daily life',
    subject: 'Spanish',
    topic: 'Vocabulary',
    gradeLevel: 'Beginner',
    difficulty: 'beginner',
    category: 'spanish',
    cardCount: 50,
    estimatedStudyTime: 75,
    collectionType: 'standard',
    hasImages: false,
    tags: ['spanish', 'vocabulary', 'daily life', 'beginner'],
    keywords: ['casa', 'familia', 'comida', 'trabajo'],
    qualityScore: 4.5,
    rating: 4.3,
    ratingCount: 298,
    cards: [
      {
        front: 'House',
        back: 'Casa',
        pronunciation: 'KAH-sah',
        partOfSpeech: 'noun',
        exampleSentences: ['Mi casa es grande.', 'Vivo en una casa azul.'],
        concepts: ['house', 'home', 'dwelling'],
        cognitiveLevel: 'remember'
      },
      {
        front: 'Family',
        back: 'Familia',
        pronunciation: 'fah-MEE-lee-ah',
        partOfSpeech: 'noun',
        exampleSentences: ['Mi familia es muy importante.', 'Tengo una familia grande.'],
        concepts: ['family', 'relatives'],
        cognitiveLevel: 'remember'
      },
      {
        front: 'Water',
        back: 'Agua',
        pronunciation: 'AH-gwah',
        partOfSpeech: 'noun',
        exampleSentences: ['Necesito agua.', 'El agua está fría.'],
        concepts: ['drinks', 'beverages', 'basic needs'],
        cognitiveLevel: 'remember'
      }
    ]
  },

  {
    title: 'French Grammar Essentials',
    description: 'Core French grammar rules including verb conjugations and sentence structure.',
    shortDescription: 'Master essential French grammar rules',
    subject: 'French',
    topic: 'Grammar',
    gradeLevel: 'Beginner',
    difficulty: 'intermediate',
    category: 'french',
    cardCount: 40,
    estimatedStudyTime: 80,
    collectionType: 'standard',
    hasImages: false,
    tags: ['french', 'grammar', 'verbs', 'conjugation'],
    keywords: ['être', 'avoir', 'conjugation', 'tense'],
    qualityScore: 4.7,
    rating: 4.5,
    ratingCount: 178,
    cards: [
      {
        front: 'How do you conjugate "être" (to be) for "I am"?',
        back: 'Je suis',
        pronunciation: 'zhuh SWEE',
        explanation: 'This is the first person singular form of the verb être.',
        concepts: ['être', 'conjugation', 'present tense'],
        cognitiveLevel: 'remember'
      },
      {
        front: 'What is the French word for "and"?',
        back: 'Et',
        pronunciation: 'ay',
        explanation: 'Et is used to connect words, phrases, or clauses.',
        concepts: ['conjunctions', 'connecting words'],
        cognitiveLevel: 'remember'
      }
    ]
  },

  // History Collections
  {
    title: 'World War II Key Events',
    description: 'Major events, dates, and figures from World War II.',
    shortDescription: 'Learn key WWII events and dates',
    subject: 'World History',
    topic: 'World War II',
    gradeLevel: 'High School',
    difficulty: 'intermediate',
    category: 'world-history',
    cardCount: 40,
    estimatedStudyTime: 85,
    collectionType: 'standard',
    hasImages: false,
    tags: ['history', 'wwii', 'world war', 'events'],
    keywords: ['hitler', 'pearl harbor', 'normandy', 'holocaust'],
    qualityScore: 4.8,
    rating: 4.6,
    ratingCount: 267,
    cards: [
      {
        front: 'When did World War II begin?',
        back: 'September 1, 1939',
        explanation: 'Germany invaded Poland, prompting Britain and France to declare war.',
        concepts: ['wwii start', 'invasion of poland'],
        cognitiveLevel: 'remember'
      },
      {
        front: 'What was D-Day?',
        back: 'The Allied invasion of Normandy on June 6, 1944',
        explanation: 'Operation Overlord opened the Western Front in Europe.',
        concepts: ['d-day', 'normandy', 'operation overlord'],
        cognitiveLevel: 'understand'
      },
      {
        front: 'When did the US enter World War II?',
        back: 'December 7, 1941',
        explanation: 'Following the attack on Pearl Harbor by Japan.',
        concepts: ['pearl harbor', 'us entry'],
        cognitiveLevel: 'remember'
      }
    ]
  },

  {
    title: 'US Presidents and Terms',
    description: 'Important US presidents, their terms in office, and major accomplishments.',
    shortDescription: 'Learn about US presidents and their legacy',
    subject: 'US History',
    topic: 'Presidents',
    gradeLevel: 'Middle School',
    difficulty: 'beginner',
    category: 'us-history',
    cardCount: 30,
    estimatedStudyTime: 50,
    collectionType: 'standard',
    hasImages: false,
    tags: ['history', 'presidents', 'us history', 'government'],
    keywords: ['washington', 'lincoln', 'roosevelt', 'kennedy'],
    qualityScore: 4.4,
    rating: 4.2,
    ratingCount: 189,
    cards: [
      {
        front: 'Who was the first President of the United States?',
        back: 'George Washington',
        explanation: 'Washington served from 1789-1797 and set many presidential precedents.',
        concepts: ['first president', 'founding fathers'],
        cognitiveLevel: 'remember'
      },
      {
        front: 'Which president was known as "Honest Abe"?',
        back: 'Abraham Lincoln',
        explanation: 'Lincoln led the country during the Civil War and issued the Emancipation Proclamation.',
        concepts: ['lincoln', 'civil war', 'emancipation'],
        cognitiveLevel: 'remember'
      },
      {
        front: 'Who was president during most of World War II?',
        back: 'Franklin D. Roosevelt',
        explanation: 'FDR served from 1933-1945 and led America through the Great Depression and WWII.',
        concepts: ['fdr', 'wwii', 'great depression'],
        cognitiveLevel: 'remember'
      }
    ]
  },

  // Advanced Collections
  {
    title: 'AP Physics: Mechanics',
    description: 'Advanced physics concepts for AP exam preparation including kinematics and dynamics.',
    shortDescription: 'Master AP Physics mechanics concepts',
    subject: 'Physics',
    topic: 'Mechanics',
    gradeLevel: 'AP/College',
    difficulty: 'advanced',
    category: 'physics',
    cardCount: 60,
    estimatedStudyTime: 120,
    collectionType: 'premium',
    hasImages: true,
    tags: ['physics', 'ap', 'mechanics', 'kinematics', 'dynamics'],
    keywords: ['force', 'acceleration', 'momentum', 'energy'],
    qualityScore: 4.9,
    rating: 4.8,
    ratingCount: 145,
    isPremium: true,
    price: 9.99,
    cards: [
      {
        front: 'State Newton\'s First Law of Motion',
        back: 'An object at rest stays at rest, and an object in motion stays in motion at constant velocity, unless acted upon by a net external force.',
        explanation: 'Also known as the law of inertia.',
        formula: 'ΣF = 0 → a = 0',
        concepts: ['newton\'s laws', 'inertia', 'force'],
        cognitiveLevel: 'understand'
      },
      {
        front: 'What is the formula for kinetic energy?',
        back: 'KE = ½mv²',
        explanation: 'Kinetic energy depends on mass and the square of velocity.',
        formula: 'KE = ½mv²',
        units: 'Joules (J)',
        variables: [
          { symbol: 'm', description: 'mass in kg' },
          { symbol: 'v', description: 'velocity in m/s' }
        ],
        concepts: ['kinetic energy', 'energy', 'motion'],
        cognitiveLevel: 'remember'
      }
    ]
  },

  {
    title: 'Calculus: Derivatives and Applications',
    description: 'Comprehensive coverage of derivatives, rules, and real-world applications.',
    shortDescription: 'Master calculus derivatives and applications',
    subject: 'Mathematics',
    topic: 'Calculus',
    gradeLevel: 'AP/College',
    difficulty: 'advanced',
    category: 'calculus',
    cardCount: 55,
    estimatedStudyTime: 110,
    collectionType: 'premium',
    hasImages: false,
    tags: ['calculus', 'derivatives', 'ap', 'mathematics'],
    keywords: ['derivative', 'limit', 'chain rule', 'product rule'],
    qualityScore: 4.8,
    rating: 4.7,
    ratingCount: 203,
    isPremium: true,
    price: 12.99,
    cards: [
      {
        front: 'What is the derivative of sin(x)?',
        back: 'cos(x)',
        explanation: 'This is a fundamental trigonometric derivative.',
        formula: 'd/dx[sin(x)] = cos(x)',
        concepts: ['trigonometric derivatives', 'derivatives'],
        cognitiveLevel: 'remember'
      },
      {
        front: 'State the Power Rule for derivatives',
        back: 'If f(x) = xⁿ, then f\'(x) = nxⁿ⁻¹',
        explanation: 'The power rule is used to find derivatives of polynomial terms.',
        formula: 'd/dx[xⁿ] = nxⁿ⁻¹',
        concepts: ['power rule', 'derivatives', 'polynomials'],
        cognitiveLevel: 'understand'
      }
    ]
  }
];

async function seedContent() {
  try {
    console.log('🌱 Starting to seed preloaded content...');

    // Clear existing data
    console.log('🧹 Clearing existing content...');
    await db.delete(preloadedFlashcards);
    await db.delete(preloadedFlashcardCollections);
    await db.delete(contentCategories);

    // Insert categories
    console.log('📁 Creating content categories...');
    const categoryMap = new Map();
    
    // First pass: Insert root categories
    for (const category of categories.filter(c => c.level === 0)) {
      const [insertedCategory] = await db.insert(contentCategories).values({
        name: category.name,
        displayName: category.displayName,
        description: category.description,
        icon: category.icon,
        color: category.color,
        level: category.level,
        path: category.path,
        subject: category.subject,
        sortOrder: category.sortOrder,
        contentCount: 0
      }).returning();
      
      categoryMap.set(category.name, insertedCategory);
      console.log(`  ✅ Created category: ${category.displayName}`);
    }

    // Second pass: Insert child categories
    for (const category of categories.filter(c => c.level === 1)) {
      const parentCategory = categoryMap.get(category.parentCategory);
      if (!parentCategory) {
        console.log(`  ⚠️  Parent category not found for: ${category.displayName}`);
        continue;
      }

      const [insertedCategory] = await db.insert(contentCategories).values({
        name: category.name,
        displayName: category.displayName,
        description: category.description,
        icon: category.icon,
        color: category.color,
        level: category.level,
        path: category.path,
        subject: category.subject,
        parentCategoryId: parentCategory.id,
        sortOrder: category.sortOrder,
        contentCount: 0
      }).returning();
      
      categoryMap.set(category.name, insertedCategory);
      console.log(`  ✅ Created subcategory: ${category.displayName}`);
    }

    // Insert flashcard collections
    console.log('📚 Creating flashcard collections...');
    const collectionMap = new Map();

    for (const collectionData of flashcardCollections) {
      const category = categoryMap.get(collectionData.category);
      if (!category) {
        console.log(`  ⚠️  Category not found for collection: ${collectionData.title}`);
        continue;
      }

      const [collection] = await db.insert(preloadedFlashcardCollections).values({
        title: collectionData.title,
        description: collectionData.description,
        shortDescription: collectionData.shortDescription,
        categoryId: category.id,
        subject: collectionData.subject,
        topic: collectionData.topic,
        gradeLevel: collectionData.gradeLevel,
        difficulty: collectionData.difficulty,
        cardCount: collectionData.cardCount,
        estimatedStudyTime: collectionData.estimatedStudyTime,
        collectionType: collectionData.collectionType,
        hasImages: collectionData.hasImages || false,
        hasAudio: collectionData.hasAudio || false,
        hasVideo: collectionData.hasVideo || false,
        qualityScore: collectionData.qualityScore,
        rating: collectionData.rating,
        ratingCount: collectionData.ratingCount,
        downloadCount: Math.floor(Math.random() * 1000) + 50, // Random download count
        usageCount: Math.floor(Math.random() * 500) + 25, // Random usage count
        tags: collectionData.tags,
        keywords: collectionData.keywords,
        isPremium: collectionData.isPremium || false,
        price: collectionData.price || null,
        isFeatured: Math.random() > 0.7, // 30% chance of being featured
        isVerified: true,
        reviewStatus: 'approved',
        publishedAt: new Date()
      }).returning();

      collectionMap.set(collectionData.title, collection);
      console.log(`  ✅ Created collection: ${collectionData.title} (${collectionData.cardCount} cards)`);

      // Insert flashcards for this collection
      if (collectionData.cards && collectionData.cards.length > 0) {
        const cards = collectionData.cards.map((card, index) => ({
          collectionId: collection.id,
          front: card.front,
          back: card.back,
          hint: card.hint,
          explanation: card.explanation,
          frontMedia: card.frontMedia || [],
          backMedia: card.backMedia || [],
          order: index + 1,
          cardType: card.cardType || 'basic',
          difficultyLevel: getDifficultyLevel(collectionData.difficulty),
          complexity: getComplexity(card.cognitiveLevel),
          cognitiveLevel: card.cognitiveLevel || 'remember',
          learningObjectives: card.learningObjectives || [],
          skillsTargeted: card.skillsTargeted || [],
          concepts: card.concepts || [],
          partOfSpeech: card.partOfSpeech,
          pronunciation: card.pronunciation,
          exampleSentences: card.exampleSentences || [],
          formula: card.formula,
          equation: card.equation,
          units: card.units,
          variables: card.variables || [],
          tags: card.tags || [],
          keywords: extractKeywords(card.front + ' ' + card.back),
          relatedConcepts: card.concepts || [],
          qualityScore: collectionData.qualityScore,
          accuracyVerified: true,
          usageCount: Math.floor(Math.random() * 100),
          successRate: Math.random() * 0.3 + 0.7, // 70-100% success rate
          averageResponseTime: Math.random() * 3000 + 2000, // 2-5 seconds
          source: 'StudyGenius Curated Content',
          author: 'StudyGenius Team'
        }));

        await db.insert(preloadedFlashcards).values(cards);
        console.log(`    ➡️  Added ${cards.length} cards to ${collectionData.title}`);
      }

      // Generate additional cards to reach target count
      const additionalCardsNeeded = collectionData.cardCount - (collectionData.cards?.length || 0);
      if (additionalCardsNeeded > 0) {
        const additionalCards = generateAdditionalCards(
          collection,
          collectionData,
          additionalCardsNeeded,
          (collectionData.cards?.length || 0) + 1
        );

        if (additionalCards.length > 0) {
          await db.insert(preloadedFlashcards).values(additionalCards);
          console.log(`    ➡️  Generated ${additionalCards.length} additional cards`);
        }
      }
    }

    // Update category content counts
    console.log('🔢 Updating category content counts...');
    for (const [categoryName, categoryData] of categoryMap) {
      const collectionsInCategory = flashcardCollections.filter(c => c.category === categoryName);
      const totalCards = collectionsInCategory.reduce((sum, c) => sum + c.cardCount, 0);
      
      await db.update(contentCategories)
        .set({ contentCount: totalCards })
        .where(db.eq(contentCategories.id, categoryData.id));
    }

    console.log('✨ Preloaded content seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - ${categories.length} categories created`);
    console.log(`   - ${flashcardCollections.length} collections created`);
    
    const totalCards = flashcardCollections.reduce((sum, c) => sum + c.cardCount, 0);
    console.log(`   - ${totalCards} flashcards created`);
    
    const premiumCollections = flashcardCollections.filter(c => c.isPremium).length;
    console.log(`   - ${premiumCollections} premium collections`);

  } catch (error) {
    console.error('❌ Error seeding preloaded content:', error);
    throw error;
  }
}

function getDifficultyLevel(difficulty) {
  const levelMap = {
    'beginner': 2.0,
    'intermediate': 3.5,
    'advanced': 4.5
  };
  return levelMap[difficulty] || 3.0;
}

function getComplexity(cognitiveLevel) {
  const complexityMap = {
    'remember': 'simple',
    'understand': 'medium',
    'apply': 'medium',
    'analyze': 'complex',
    'evaluate': 'complex',
    'create': 'complex'
  };
  return complexityMap[cognitiveLevel] || 'medium';
}

function extractKeywords(text) {
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3);
  
  return [...new Set(words)].slice(0, 5);
}

function generateAdditionalCards(collection, collectionData, count, startOrder) {
  const cards = [];
  const templates = getCardTemplatesBySubject(collectionData.subject);
  
  for (let i = 0; i < count; i++) {
    const template = templates[i % templates.length];
    const card = {
      collectionId: collection.id,
      front: template.front,
      back: template.back,
      hint: template.hint,
      explanation: template.explanation,
      order: startOrder + i,
      cardType: 'basic',
      difficultyLevel: getDifficultyLevel(collectionData.difficulty),
      complexity: 'medium',
      cognitiveLevel: 'remember',
      concepts: template.concepts || [],
      tags: template.tags || [],
      keywords: extractKeywords(template.front + ' ' + template.back),
      qualityScore: collection.qualityScore * 0.9, // Slightly lower for generated cards
      accuracyVerified: false,
      usageCount: Math.floor(Math.random() * 50),
      successRate: Math.random() * 0.2 + 0.75,
      averageResponseTime: Math.random() * 2000 + 2500,
      source: 'StudyGenius Generated Content',
      author: 'StudyGenius AI'
    };
    
    cards.push(card);
  }
  
  return cards;
}

function getCardTemplatesBySubject(subject) {
  const templates = {
    'Mathematics': [
      {
        front: 'What is the Pythagorean theorem?',
        back: 'a² + b² = c²',
        explanation: 'In a right triangle, the square of the hypotenuse equals the sum of squares of the other two sides.',
        concepts: ['pythagorean theorem', 'right triangles'],
        tags: ['geometry', 'theorems']
      },
      {
        front: 'What is the quadratic formula?',
        back: 'x = (-b ± √(b² - 4ac)) / 2a',
        explanation: 'Used to solve quadratic equations of the form ax² + bx + c = 0',
        concepts: ['quadratic formula', 'equations'],
        tags: ['algebra', 'formulas']
      }
    ],
    'Biology': [
      {
        front: 'What is photosynthesis?',
        back: 'The process by which plants convert sunlight, carbon dioxide, and water into glucose and oxygen.',
        explanation: 'This process occurs in chloroplasts and is essential for plant energy production.',
        concepts: ['photosynthesis', 'plant biology'],
        tags: ['biology', 'plants', 'energy']
      }
    ],
    'Chemistry': [
      {
        front: 'What is an ion?',
        back: 'An atom or molecule with a net electric charge due to loss or gain of electrons.',
        explanation: 'Positive ions (cations) have lost electrons, negative ions (anions) have gained electrons.',
        concepts: ['ions', 'electrons', 'charge'],
        tags: ['chemistry', 'atoms', 'charge']
      }
    ],
    'Spanish': [
      {
        front: 'Good morning',
        back: 'Buenos días',
        pronunciation: 'BWAY-nohs DEE-ahs',
        concepts: ['greetings', 'morning'],
        tags: ['spanish', 'greetings', 'daily']
      }
    ],
    'French': [
      {
        front: 'Thank you',
        back: 'Merci',
        pronunciation: 'mer-SEE',
        concepts: ['politeness', 'gratitude'],
        tags: ['french', 'politeness', 'basic']
      }
    ],
    'World History': [
      {
        front: 'When did the Roman Empire fall?',
        back: '476 AD',
        explanation: 'The Western Roman Empire fell when Odoacer deposed Romulus Augustulus.',
        concepts: ['roman empire', 'fall of rome'],
        tags: ['history', 'rome', 'ancient']
      }
    ],
    'US History': [
      {
        front: 'When was the Declaration of Independence signed?',
        back: 'July 4, 1776',
        explanation: 'This date is celebrated as Independence Day in the United States.',
        concepts: ['declaration of independence', 'american revolution'],
        tags: ['us history', 'independence', 'founding']
      }
    ],
    'Physics': [
      {
        front: 'What is the speed of light in a vacuum?',
        back: '299,792,458 meters per second (c)',
        explanation: 'This is a fundamental constant in physics.',
        concepts: ['speed of light', 'constants'],
        tags: ['physics', 'constants', 'light']
      }
    ]
  };
  
  return templates[subject] || templates['Mathematics'];
}

// Run the seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedContent()
    .then(() => {
      console.log('🎉 Seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    });
}

export { seedContent };