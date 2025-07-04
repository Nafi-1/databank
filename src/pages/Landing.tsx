import React from 'react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import AuthModal from '../components/AuthModal';
import { 
  Brain, 
  Database, 
  Shield, 
  Zap, 
  BarChart3, 
  Users, 
  ArrowRight,
  Play,
  CheckCircle
} from 'lucide-react';

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user } = useStore();

  const features = [
    {
      icon: Brain,
      title: 'Multi-Agent Architecture',
      description: 'Specialized AI agents work together to generate contextually aware synthetic data'
    },
    {
      icon: Shield,
      title: 'Privacy-Preserving',
      description: 'Advanced techniques ensure synthetic data maintains utility while protecting sensitive information'
    },
    {
      icon: Database,
      title: 'Multi-Modal Generation',
      description: 'Generate tabular, time-series, text, and image data with preserved relationships'
    },
    {
      icon: BarChart3,
      title: 'Real-time Analytics',
      description: 'Monitor data quality, bias detection, and model performance in real-time'
    },
    {
      icon: Zap,
      title: 'Adaptive Learning',
      description: 'Continuously improves synthetic data quality based on model training feedback'
    },
    {
      icon: Users,
      title: 'Cross-Domain Transfer',
      description: 'Learn patterns from one industry to enhance synthetic data generation in others'
    }
  ];

  const industries = [
    { name: 'Healthcare', icon: '🏥', color: 'from-green-500 to-emerald-500' },
    { name: 'Finance', icon: '💰', color: 'from-blue-500 to-cyan-500' },
    { name: 'Retail', icon: '🛍️', color: 'from-purple-500 to-pink-500' },
    { name: 'Manufacturing', icon: '🏭', color: 'from-orange-500 to-red-500' },
    { name: 'Education', icon: '🎓', color: 'from-yellow-500 to-amber-500' },
    { name: 'Technology', icon: '💻', color: 'from-indigo-500 to-blue-500' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10"></div>
        <div className="relative max-w-7xl mx-auto px-6 py-20">
          <motion.div 
            className="text-center"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                <Brain className="w-12 h-12 text-white" />
              </div>
            </div>
            
            <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              DataGenesis AI
            </h1>
            
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Revolutionary multi-agent synthetic data generation platform that intelligently creates 
              high-quality datasets across healthcare, finance, retail, and beyond
            </p>
            
            <div className="flex gap-4 justify-center">
              <motion.button
                onClick={() => {
                  if (user) {
                    navigate('/dashboard');
                  } else {
                    setShowAuthModal(true);
                  }
                }}
                className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold text-white hover:from-purple-600 hover:to-pink-600 transition-all duration-300 flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {user ? 'Go to Dashboard' : 'Get Started'}
                <ArrowRight className="w-5 h-5" />
              </motion.button>
              
              <motion.button
                className="px-8 py-3 bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-lg font-semibold text-white hover:bg-gray-700/50 transition-all duration-300 flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Play className="w-5 h-5" />
                Watch Demo
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <motion.div 
          className="text-center mb-16"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <h2 className="text-4xl font-bold mb-4">Intelligent AI-Powered Features</h2>
          <p className="text-xl text-gray-400">
            Advanced capabilities that set DataGenesis apart from traditional synthetic data solutions
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="p-6 bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-xl hover:border-purple-500/50 transition-all duration-300"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -5 }}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-400">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Industries Section */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <motion.div 
          className="text-center mb-16"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <h2 className="text-4xl font-bold mb-4">Domain-Agnostic Solution</h2>
          <p className="text-xl text-gray-400">
            Automatically adapts to generate synthetic data across any industry or domain
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {industries.map((industry, index) => (
            <motion.div
              key={index}
              className={`p-6 bg-gradient-to-br ${industry.color} rounded-xl text-center hover:scale-105 transition-transform duration-300`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="text-4xl mb-3">{industry.icon}</div>
              <h3 className="font-semibold text-white">{industry.name}</h3>
            </motion.div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <motion.div 
          className="text-center p-12 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl border border-purple-500/20"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <h2 className="text-4xl font-bold mb-6">Ready to Transform Your Data Strategy?</h2>
          <p className="text-xl text-gray-300 mb-8">
            Join the future of synthetic data generation with DataGenesis AI
          </p>
          <motion.button
            onClick={() => {
              if (user) {
                navigate('/dashboard');
              } else {
                setShowAuthModal(true);
              }
            }}
            className="px-12 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold text-white hover:from-purple-600 hover:to-pink-600 transition-all duration-300 text-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {user ? 'Continue Journey' : 'Start Your Journey'}
          </motion.button>
        </motion.div>
      </div>
      
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </div>
  );
};

export default Landing;