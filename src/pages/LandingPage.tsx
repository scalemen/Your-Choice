import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useInView, useAnimation } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useThemeStore } from '@/store/themeStore';
import { cn } from '@/utils/cn';
import {
  BookOpenIcon,
  AcademicCapIcon,
  ChartBarIcon,
  CpuChipIcon,
  GlobeAltIcon,
  SparklesIcon,
  PlayIcon,
  CheckIcon,
  StarIcon,
  ArrowRightIcon,
  UserGroupIcon,
  DevicePhoneMobileIcon,
  CloudIcon,
  ShieldCheckIcon,
  RocketLaunchIcon,
  LightBulbIcon,
  BeakerIcon,
  PresentationChartBarIcon,
  CogIcon,
  HeartIcon,
  TrophyIcon,
  ChatBubbleLeftRightIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  PuzzlePieceIcon,
  BoltIcon,
  FireIcon,
  SunIcon,
  MoonIcon,
  EyeIcon,
  HandRaisedIcon,
  MegaphoneIcon,
  BuildingLibraryIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  CubeTransparentIcon,
  FingerPrintIcon,
  WifiIcon,
  ServerIcon,
  KeyIcon,
  MagnifyingGlassIcon,
  ComputerDesktopIcon,
  DeviceTabletIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  ClockIcon,
  TagIcon,
  CurrencyDollarIcon,
  ScaleIcon,
  QrCodeIcon,
  CommandLineIcon
} from '@heroicons/react/24/outline';

const LandingPage: React.FC = () => {
  const { theme, setTheme } = useThemeStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [stats, setStats] = useState({
    students: 0,
    courses: 0,
    institutions: 0,
    satisfaction: 0
  });
  
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const testimonialsRef = useRef<HTMLDivElement>(null);
  const pricingRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 300], [1, 0.8]);
  
  const isHeroInView = useInView(heroRef);
  const isFeaturesInView = useInView(featuresRef);
  const isTestimonialsInView = useInView(testimonialsRef);
  const isPricingInView = useInView(pricingRef);
  const isCtaInView = useInView(ctaRef);
  
  const heroAnimation = useAnimation();
  const featuresAnimation = useAnimation();
  const testimonialsAnimation = useAnimation();
  const pricingAnimation = useAnimation();
  const ctaAnimation = useAnimation();

  // Animate stats counter
  useEffect(() => {
    const timer = setInterval(() => {
      setStats(prev => ({
        students: Math.min(prev.students + Math.floor(Math.random() * 1000), 2500000),
        courses: Math.min(prev.courses + Math.floor(Math.random() * 100), 150000),
        institutions: Math.min(prev.institutions + Math.floor(Math.random() * 10), 5000),
        satisfaction: Math.min(prev.satisfaction + 0.1, 98.7)
      }));
    }, 50);

    setTimeout(() => clearInterval(timer), 3000);
    return () => clearInterval(timer);
  }, []);

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial(prev => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Animate sections on scroll
  useEffect(() => {
    if (isHeroInView) {
      heroAnimation.start('visible');
    }
  }, [isHeroInView, heroAnimation]);

  useEffect(() => {
    if (isFeaturesInView) {
      featuresAnimation.start('visible');
    }
  }, [isFeaturesInView, featuresAnimation]);

  useEffect(() => {
    if (isTestimonialsInView) {
      testimonialsAnimation.start('visible');
    }
  }, [isTestimonialsInView, testimonialsAnimation]);

  useEffect(() => {
    if (isPricingInView) {
      pricingAnimation.start('visible');
    }
  }, [isPricingInView, pricingAnimation]);

  useEffect(() => {
    if (isCtaInView) {
      ctaAnimation.start('visible');
    }
  }, [isCtaInView, ctaAnimation]);

  const features = [
    {
      icon: BookOpenIcon,
      title: 'Smart Learning Paths',
      description: 'AI-powered personalized learning journeys that adapt to your pace and style.',
      color: 'from-blue-500 to-cyan-500',
      stats: '95% faster learning'
    },
    {
      icon: CpuChipIcon,
      title: 'AI Tutoring',
      description: 'Advanced AI tutors with emotional intelligence and natural conversation.',
      color: 'from-purple-500 to-pink-500',
      stats: '24/7 availability'
    },
    {
      icon: ChartBarIcon,
      title: 'Advanced Analytics',
      description: 'Comprehensive learning analytics with predictive insights.',
      color: 'from-green-500 to-emerald-500',
      stats: '200+ metrics tracked'
    },
    {
      icon: GlobeAltIcon,
      title: 'Global Collaboration',
      description: 'Connect and learn with students and educators worldwide.',
      color: 'from-orange-500 to-red-500',
      stats: '190+ countries'
    },
    {
      icon: SparklesIcon,
      title: 'Immersive Experiences',
      description: 'VR/AR learning environments for hands-on education.',
      color: 'from-indigo-500 to-purple-500',
      stats: '1000+ simulations'
    },
    {
      icon: ShieldCheckIcon,
      title: 'Enterprise Security',
      description: 'Bank-level security with comprehensive compliance frameworks.',
      color: 'from-teal-500 to-blue-500',
      stats: '99.99% uptime'
    }
  ];

  const capabilities = [
    {
      category: 'Learning Management',
      items: [
        { name: 'Adaptive Learning Paths', icon: BookOpenIcon },
        { name: 'Smart Flashcards', icon: DocumentTextIcon },
        { name: 'Interactive Notes', icon: PencilIcon },
        { name: 'Study Planning', icon: CalendarDaysIcon },
        { name: 'Progress Tracking', icon: ChartBarIcon },
        { name: 'Gamification', icon: TrophyIcon }
      ]
    },
    {
      category: 'AI & Technology',
      items: [
        { name: 'AI Tutoring', icon: CpuChipIcon },
        { name: 'Natural Language Processing', icon: ChatBubbleLeftRightIcon },
        { name: 'Computer Vision', icon: EyeIcon },
        { name: 'Machine Learning', icon: BeakerIcon },
        { name: 'Predictive Analytics', icon: PresentationChartBarIcon },
        { name: 'Automated Grading', icon: CogIcon }
      ]
    },
    {
      category: 'Collaboration',
      items: [
        { name: 'Video Conferencing', icon: VideoCameraIcon },
        { name: 'Study Groups', icon: UserGroupIcon },
        { name: 'Peer Learning', icon: HandRaisedIcon },
        { name: 'Discussion Forums', icon: ChatBubbleLeftRightIcon },
        { name: 'Social Learning', icon: HeartIcon },
        { name: 'Global Classrooms', icon: GlobeAltIcon }
      ]
    },
    {
      category: 'Content & Assessment',
      items: [
        { name: 'Interactive Content', icon: PuzzlePieceIcon },
        { name: 'Multimedia Library', icon: PlayIcon },
        { name: 'Assessment Tools', icon: DocumentTextIcon },
        { name: 'Rubric Builder', icon: ScaleIcon },
        { name: 'Portfolio Management', icon: BuildingLibraryIcon },
        { name: 'Certification System', icon: AcademicCapIcon }
      ]
    },
    {
      category: 'Platform Features',
      items: [
        { name: 'Mobile Apps', icon: DevicePhoneMobileIcon },
        { name: 'Cloud Infrastructure', icon: CloudIcon },
        { name: 'API Integration', icon: CommandLineIcon },
        { name: 'Single Sign-On', icon: KeyIcon },
        { name: 'Multi-language Support', icon: GlobeAltIcon },
        { name: 'Accessibility Features', icon: EyeIcon }
      ]
    },
    {
      category: 'Analytics & Insights',
      items: [
        { name: 'Learning Analytics', icon: ChartBarIcon },
        { name: 'Performance Dashboards', icon: PresentationChartBarIcon },
        { name: 'Behavioral Analysis', icon: MagnifyingGlassIcon },
        { name: 'Engagement Metrics', icon: HeartIcon },
        { name: 'Custom Reports', icon: DocumentTextIcon },
        { name: 'Data Visualization', icon: ChartBarIcon }
      ]
    }
  ];

  const testimonials = [
    {
      name: 'Dr. Sarah Johnson',
      role: 'Professor of Computer Science',
      institution: 'Stanford University',
      image: '/api/placeholder/64/64',
      content: 'StudyGenius has revolutionized how my students learn. The AI tutoring system is incredibly sophisticated and the analytics help me understand each student\'s progress in real-time.',
      rating: 5,
      stats: '40% improvement in test scores'
    },
    {
      name: 'Marcus Chen',
      role: 'High School Student',
      institution: 'Lincoln High School',
      image: '/api/placeholder/64/64',
      content: 'I used to struggle with math, but StudyGenius made it fun and easy to understand. The personalized learning path helped me go from failing to getting A\'s!',
      rating: 5,
      stats: 'F to A in 3 months'
    },
    {
      name: 'Elena Rodriguez',
      role: 'Corporate Training Manager',
      institution: 'Tech Solutions Inc.',
      image: '/api/placeholder/64/64',
      content: 'We\'ve trained over 500 employees using StudyGenius. The platform\'s scalability and comprehensive analytics have made our training programs incredibly effective.',
      rating: 5,
      stats: '85% completion rate'
    },
    {
      name: 'Dr. Ahmed Hassan',
      role: 'Dean of Engineering',
      institution: 'Cairo University',
      image: '/api/placeholder/64/64',
      content: 'StudyGenius has enabled us to provide world-class education to students across Egypt. The multilingual support and cultural adaptability are outstanding.',
      rating: 5,
      stats: '12,000+ students served'
    },
    {
      name: 'Jessica Williams',
      role: 'K-12 Principal',
      institution: 'Riverside Elementary',
      image: '/api/placeholder/64/64',
      content: 'The gamification features keep our young students engaged while the parent dashboard gives families insight into their child\'s learning journey.',
      rating: 5,
      stats: '95% parent satisfaction'
    },
    {
      name: 'Prof. Liu Wei',
      role: 'Research Director',
      institution: 'Beijing Institute of Technology',
      image: '/api/placeholder/64/64',
      content: 'The research collaboration tools and data analytics capabilities have accelerated our academic research projects significantly.',
      rating: 5,
      stats: '3x faster research cycles'
    }
  ];

  const pricingPlans = [
    {
      name: 'Student',
      description: 'Perfect for individual learners',
      price: 'Free',
      period: 'forever',
      color: 'from-blue-500 to-cyan-500',
      popular: false,
      features: [
        'Personal learning dashboard',
        'Basic AI tutoring',
        'Smart flashcards',
        'Progress tracking',
        'Mobile app access',
        'Community forums',
        '5GB cloud storage',
        'Basic analytics'
      ],
      limitations: [
        'Up to 5 courses',
        'Basic support'
      ],
      cta: 'Start Learning Free',
      href: '/register'
    },
    {
      name: 'Educator',
      description: 'For teachers and instructors',
      price: '$29',
      period: 'per month',
      color: 'from-purple-500 to-pink-500',
      popular: true,
      features: [
        'Everything in Student',
        'Advanced AI tutoring',
        'Classroom management',
        'Assignment creation',
        'Grading automation',
        'Parent communications',
        'Advanced analytics',
        'Custom content creation',
        '100GB cloud storage',
        'Priority support'
      ],
      limitations: [
        'Up to 200 students'
      ],
      cta: 'Start Teaching Today',
      href: '/register?plan=educator'
    },
    {
      name: 'Institution',
      description: 'For schools and universities',
      price: '$199',
      period: 'per month',
      color: 'from-green-500 to-emerald-500',
      popular: false,
      features: [
        'Everything in Educator',
        'Unlimited students',
        'LMS integration',
        'SSO authentication',
        'Custom branding',
        'API access',
        'Advanced security',
        'Compliance reporting',
        'Unlimited storage',
        'Dedicated support',
        'Training & onboarding'
      ],
      limitations: [],
      cta: 'Contact Sales',
      href: '/contact'
    },
    {
      name: 'Enterprise',
      description: 'For large organizations',
      price: 'Custom',
      period: 'pricing',
      color: 'from-orange-500 to-red-500',
      popular: false,
      features: [
        'Everything in Institution',
        'Multi-tenant architecture',
        'Global deployment',
        'Custom integrations',
        'White-label solution',
        'SLA guarantees',
        'Premium support',
        '24/7 monitoring',
        'Disaster recovery',
        'Custom development'
      ],
      limitations: [],
      cta: 'Get Quote',
      href: '/enterprise'
    }
  ];

  const stats_data = [
    { label: 'Active Students', value: stats.students.toLocaleString(), suffix: '+' },
    { label: 'Courses Available', value: stats.courses.toLocaleString(), suffix: '+' },
    { label: 'Partner Institutions', value: stats.institutions.toLocaleString(), suffix: '+' },
    { label: 'Satisfaction Rate', value: stats.satisfaction.toFixed(1), suffix: '%' }
  ];

  const integrations = [
    { name: 'Google Classroom', logo: '/api/placeholder/48/48' },
    { name: 'Microsoft Teams', logo: '/api/placeholder/48/48' },
    { name: 'Canvas LMS', logo: '/api/placeholder/48/48' },
    { name: 'Blackboard', logo: '/api/placeholder/48/48' },
    { name: 'Moodle', logo: '/api/placeholder/48/48' },
    { name: 'Zoom', logo: '/api/placeholder/48/48' },
    { name: 'Slack', logo: '/api/placeholder/48/48' },
    { name: 'Salesforce', logo: '/api/placeholder/48/48' }
  ];

  const newsItems = [
    {
      title: 'StudyGenius Raises $100M Series C',
      description: 'Funding to accelerate AI development and global expansion',
      date: '2024-01-15',
      category: 'Funding'
    },
    {
      title: 'New VR Learning Environments',
      description: 'Immersive virtual reality classrooms now available',
      date: '2024-01-10',
      category: 'Product'
    },
    {
      title: 'Partnership with UNESCO',
      description: 'Global initiative to improve education accessibility',
      date: '2024-01-05',
      category: 'Partnership'
    }
  ];

  return (
    <>
      <Helmet>
        <title>StudyGenius - Transform Your Learning Journey</title>
        <meta name="description" content="Revolutionary AI-powered educational platform with personalized learning paths, smart tutoring, and comprehensive analytics. Join millions of learners worldwide." />
        <meta name="keywords" content="education, AI tutoring, online learning, LMS, educational technology, personalized learning" />
        <meta property="og:title" content="StudyGenius - Transform Your Learning Journey" />
        <meta property="og:description" content="Revolutionary AI-powered educational platform with personalized learning paths, smart tutoring, and comprehensive analytics." />
        <meta property="og:image" content="/og-image.jpg" />
        <meta property="og:url" content="https://studygenius.com" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="StudyGenius - Transform Your Learning Journey" />
        <meta name="twitter:description" content="Revolutionary AI-powered educational platform with personalized learning paths, smart tutoring, and comprehensive analytics." />
        <meta name="twitter:image" content="/twitter-image.jpg" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200/20 dark:border-gray-700/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <Link to="/" className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">SG</span>
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">StudyGenius</span>
              </Link>

              {/* Navigation Links */}
              <div className="hidden md:flex items-center space-x-8">
                <a href="#features" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Features
                </a>
                <a href="#testimonials" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Testimonials
                </a>
                <a href="#pricing" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Pricing
                </a>
                <Link to="/about" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  About
                </Link>
                <Link to="/contact" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Contact
                </Link>
              </div>

              {/* Theme Toggle & CTA */}
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
                </button>
                <Link
                  to="/login"
                  className="px-4 py-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors shadow-lg"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <motion.section
          ref={heroRef}
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="relative pt-20 pb-32 overflow-hidden"
        >
          {/* Background Elements */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900" />
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
          
          {/* Floating Elements */}
          <div className="absolute top-20 left-10 w-20 h-20 bg-blue-500/10 dark:bg-blue-400/10 rounded-full blur-xl animate-float" />
          <div className="absolute top-40 right-10 w-32 h-32 bg-purple-500/10 dark:bg-purple-400/10 rounded-full blur-xl animate-float-delayed" />
          <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-cyan-500/10 dark:bg-cyan-400/10 rounded-full blur-xl animate-float" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              {/* Hero Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-sm font-medium mb-8"
              >
                <SparklesIcon className="w-4 h-4 mr-2" />
                Now with Advanced AI Tutoring
                <ArrowRightIcon className="w-4 h-4 ml-2" />
              </motion.div>

              {/* Hero Title */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-6"
              >
                Transform Your
                <span className="block text-gradient bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
                  Learning Journey
                </span>
              </motion.h1>

              {/* Hero Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed"
              >
                Experience the future of education with our AI-powered platform featuring 
                personalized learning paths, intelligent tutoring, and immersive experiences.
              </motion.p>

              {/* Hero CTA */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-12"
              >
                <Link
                  to="/register"
                  className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                >
                  Start Learning Free
                  <ArrowRightIcon className="w-5 h-5 ml-2 inline-block group-hover:translate-x-1 transition-transform" />
                </Link>
                <button
                  onClick={() => setIsVideoPlaying(true)}
                  className="group flex items-center px-8 py-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <PlayIcon className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                  Watch Demo
                </button>
              </motion.div>

              {/* Hero Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
              >
                {stats_data.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7 + index * 0.1, duration: 0.6 }}
                    className="text-center"
                  >
                    <div className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                      {stat.value}{stat.suffix}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {stat.label}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </motion.section>

        {/* Features Section */}
        <motion.section
          ref={featuresRef}
          id="features"
          animate={featuresAnimation}
          initial="hidden"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1
              }
            }
          }}
          className="py-24 bg-white dark:bg-gray-900"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section Header */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Powerful Features for Modern Learning
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Discover the comprehensive suite of tools designed to enhance every aspect of your educational journey.
              </p>
            </motion.div>

            {/* Feature Tabs */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
              className="flex flex-wrap justify-center mb-12"
            >
              {['overview', 'ai', 'collaboration', 'analytics'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'px-6 py-3 mx-2 mb-2 rounded-lg font-medium transition-all',
                    activeTab === tab
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  )}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </motion.div>

            {/* Feature Grid */}
            <motion.div
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.1
                  }
                }
              }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0 }
                  }}
                  className="group relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
                >
                  {/* Feature Icon */}
                  <div className={cn(
                    "w-14 h-14 rounded-xl mb-6 flex items-center justify-center bg-gradient-to-r shadow-lg",
                    feature.color
                  )}>
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>

                  {/* Feature Content */}
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {feature.description}
                  </p>

                  {/* Feature Stats */}
                  <div className="flex items-center text-sm font-medium text-blue-600 dark:text-blue-400">
                    <TrophyIcon className="w-4 h-4 mr-2" />
                    {feature.stats}
                  </div>

                  {/* Hover Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </motion.div>
              ))}
            </motion.div>

            {/* Capabilities Grid */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
              className="mt-24"
            >
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-12">
                Complete Learning Ecosystem
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                {capabilities.map((category, index) => (
                  <motion.div
                    key={category.category}
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0 }
                    }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
                  >
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      {category.category}
                    </h4>
                    <div className="space-y-3">
                      {category.items.map((item, itemIndex) => (
                        <div key={itemIndex} className="flex items-center space-x-3">
                          <item.icon className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                          <span className="text-gray-600 dark:text-gray-300">{item.name}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.section>

        {/* Testimonials Section */}
        <motion.section
          ref={testimonialsRef}
          id="testimonials"
          animate={testimonialsAnimation}
          initial="hidden"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1
              }
            }
          }}
          className="py-24 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section Header */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Trusted by Educators Worldwide
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Join millions of students, teachers, and institutions who have transformed their learning experience with StudyGenius.
              </p>
            </motion.div>

            {/* Testimonial Carousel */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
              className="relative"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {testimonials.map((testimonial, index) => (
                  <motion.div
                    key={index}
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0 }
                    }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      "bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg transition-all duration-300",
                      index === currentTestimonial
                        ? "scale-105 shadow-2xl ring-2 ring-blue-500"
                        : "hover:shadow-xl hover:scale-102"
                    )}
                  >
                    {/* Rating */}
                    <div className="flex items-center mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <StarIcon key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                      ))}
                    </div>

                    {/* Content */}
                    <blockquote className="text-gray-600 dark:text-gray-300 mb-6 text-lg leading-relaxed">
                      "{testimonial.content}"
                    </blockquote>

                    {/* Author */}
                    <div className="flex items-center">
                      <img
                        src={testimonial.image}
                        alt={testimonial.name}
                        className="w-12 h-12 rounded-full mr-4"
                      />
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {testimonial.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {testimonial.role}
                        </div>
                        <div className="text-sm text-blue-600 dark:text-blue-400">
                          {testimonial.institution}
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="text-sm font-medium text-green-600 dark:text-green-400">
                        📈 {testimonial.stats}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Testimonial Navigation */}
              <div className="flex justify-center mt-8 space-x-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentTestimonial(index)}
                    className={cn(
                      "w-3 h-3 rounded-full transition-all",
                      index === currentTestimonial
                        ? "bg-blue-600"
                        : "bg-gray-300 dark:bg-gray-600"
                    )}
                  />
                ))}
              </div>
            </motion.div>
          </div>
        </motion.section>

        {/* Pricing Section */}
        <motion.section
          ref={pricingRef}
          id="pricing"
          animate={pricingAnimation}
          initial="hidden"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1
              }
            }
          }}
          className="py-24 bg-white dark:bg-gray-900"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section Header */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Choose Your Learning Path
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Flexible pricing plans designed for learners, educators, and institutions of all sizes.
              </p>
            </motion.div>

            {/* Pricing Grid */}
            <motion.div
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.1
                  }
                }
              }}
              className="grid grid-cols-1 lg:grid-cols-4 gap-8"
            >
              {pricingPlans.map((plan, index) => (
                <motion.div
                  key={plan.name}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0 }
                  }}
                  className={cn(
                    "relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg transition-all duration-300 transform hover:scale-105",
                    plan.popular
                      ? "ring-2 ring-blue-500 shadow-2xl scale-105"
                      : "hover:shadow-xl"
                  )}
                >
                  {/* Popular Badge */}
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium">
                        Most Popular
                      </div>
                    </div>
                  )}

                  <div className="p-8">
                    {/* Plan Header */}
                    <div className="text-center mb-8">
                      <div className={cn(
                        "w-16 h-16 mx-auto mb-4 rounded-xl flex items-center justify-center bg-gradient-to-r",
                        plan.color
                      )}>
                        <CubeTransparentIcon className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        {plan.name}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-4">
                        {plan.description}
                      </p>
                      <div className="flex items-baseline justify-center">
                        <span className="text-4xl font-bold text-gray-900 dark:text-white">
                          {plan.price}
                        </span>
                        {plan.period && (
                          <span className="text-gray-500 dark:text-gray-400 ml-2">
                            /{plan.period}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Features */}
                    <div className="space-y-3 mb-8">
                      {plan.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-start">
                          <CheckIcon className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-600 dark:text-gray-300">{feature}</span>
                        </div>
                      ))}
                      {plan.limitations.map((limitation, limitationIndex) => (
                        <div key={limitationIndex} className="flex items-start opacity-75">
                          <TagIcon className="w-5 h-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-500 dark:text-gray-400">{limitation}</span>
                        </div>
                      ))}
                    </div>

                    {/* CTA */}
                    <Link
                      to={plan.href}
                      className={cn(
                        "block w-full text-center py-3 px-6 rounded-lg font-semibold transition-all",
                        plan.popular
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg"
                          : "border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                      )}
                    >
                      {plan.cta}
                    </Link>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Pricing Footer */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
              className="text-center mt-12"
            >
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                All plans include 30-day free trial • No setup fees • Cancel anytime
              </p>
              <div className="flex flex-wrap justify-center items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center">
                  <ShieldCheckIcon className="w-4 h-4 mr-2" />
                  Enterprise Security
                </div>
                <div className="flex items-center">
                  <CloudIcon className="w-4 h-4 mr-2" />
                  99.9% Uptime SLA
                </div>
                <div className="flex items-center">
                  <HeartIcon className="w-4 h-4 mr-2" />
                  24/7 Support
                </div>
              </div>
            </motion.div>
          </div>
        </motion.section>

        {/* Integrations Section */}
        <section className="py-16 bg-gray-50 dark:bg-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Seamless Integrations
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Connect with your favorite tools and platforms
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-8 items-center opacity-60">
              {integrations.map((integration, index) => (
                <div
                  key={index}
                  className="flex items-center justify-center p-4 bg-white dark:bg-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                >
                  <img
                    src={integration.logo}
                    alt={integration.name}
                    className="h-8 w-auto grayscale hover:grayscale-0 transition-all"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* News Section */}
        <section className="py-16 bg-white dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Latest News & Updates
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Stay updated with our latest developments and announcements
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {newsItems.map((item, index) => (
                <div
                  key={index}
                  className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs font-medium rounded-full">
                      {item.category}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(item.date).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {item.title}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-300">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <motion.section
          ref={ctaRef}
          animate={ctaAnimation}
          initial="hidden"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1 }
          }}
          className="py-24 bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600"
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Ready to Transform Your Learning?
              </h2>
              <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                Join millions of learners who are already experiencing the future of education. 
                Start your journey today with our free trial.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                <Link
                  to="/register"
                  className="px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                >
                  Start Free Trial
                </Link>
                <Link
                  to="/contact"
                  className="px-8 py-4 border border-white text-white rounded-xl font-semibold hover:bg-white hover:text-blue-600 transition-all"
                >
                  Schedule Demo
                </Link>
              </div>
            </motion.div>
          </div>
        </motion.section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {/* Company Info */}
              <div className="col-span-1 md:col-span-2">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-lg">SG</span>
                  </div>
                  <span className="text-xl font-bold">StudyGenius</span>
                </div>
                <p className="text-gray-300 mb-6 max-w-md">
                  Transforming education through AI-powered learning experiences. 
                  Join millions of learners worldwide on their journey to success.
                </p>
                <div className="flex space-x-4">
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                    </svg>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                    </svg>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.758-1.378l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001.12.017.001z"/>
                    </svg>
                  </a>
                </div>
              </div>

              {/* Quick Links */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Platform</h3>
                <div className="space-y-2">
                  <Link to="/features" className="block text-gray-300 hover:text-white transition-colors">Features</Link>
                  <Link to="/pricing" className="block text-gray-300 hover:text-white transition-colors">Pricing</Link>
                  <Link to="/integrations" className="block text-gray-300 hover:text-white transition-colors">Integrations</Link>
                  <Link to="/api" className="block text-gray-300 hover:text-white transition-colors">API</Link>
                  <Link to="/security" className="block text-gray-300 hover:text-white transition-colors">Security</Link>
                </div>
              </div>

              {/* Support */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Support</h3>
                <div className="space-y-2">
                  <Link to="/help" className="block text-gray-300 hover:text-white transition-colors">Help Center</Link>
                  <Link to="/contact" className="block text-gray-300 hover:text-white transition-colors">Contact Us</Link>
                  <Link to="/community" className="block text-gray-300 hover:text-white transition-colors">Community</Link>
                  <Link to="/blog" className="block text-gray-300 hover:text-white transition-colors">Blog</Link>
                  <Link to="/status" className="block text-gray-300 hover:text-white transition-colors">System Status</Link>
                </div>
              </div>
            </div>

            {/* Footer Bottom */}
            <div className="mt-12 pt-8 border-t border-gray-800">
              <div className="flex flex-col md:flex-row items-center justify-between">
                <div className="text-gray-400 text-sm">
                  © 2024 StudyGenius. All rights reserved.
                </div>
                <div className="flex space-x-6 mt-4 md:mt-0">
                  <Link to="/privacy" className="text-gray-400 hover:text-white text-sm transition-colors">Privacy Policy</Link>
                  <Link to="/terms" className="text-gray-400 hover:text-white text-sm transition-colors">Terms of Service</Link>
                  <Link to="/cookies" className="text-gray-400 hover:text-white text-sm transition-colors">Cookie Policy</Link>
                </div>
              </div>
            </div>
          </div>
        </footer>

        {/* Video Modal */}
        {isVideoPlaying && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
            <div className="relative w-full max-w-4xl mx-4">
              <button
                onClick={() => setIsVideoPlaying(false)}
                className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="bg-black rounded-lg overflow-hidden">
                <video
                  className="w-full h-auto"
                  controls
                  autoPlay
                  src="/demo-video.mp4"
                  poster="/video-poster.jpg"
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default LandingPage;