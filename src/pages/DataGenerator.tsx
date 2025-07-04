import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DataGeneratorService } from '../lib/dataGenerator';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabase';
import { ApiService } from '../lib/api';
import { useWebSocket } from '../hooks/useWebSocket';
import { 
  Database, 
  Upload, 
  Settings, 
  Play, 
  Download,
  FileText,
  Image,
  BarChart3,
  Calendar,
  Brain,
  Shield,
  Zap,
  CheckCircle
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';

const DataGenerator: React.FC = () => {
  const [selectedDataType, setSelectedDataType] = useState('tabular');
  const [selectedDomain, setSelectedDomain] = useState('');
  const [generationStep, setGenerationStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadedData, setUploadedData] = useState<any>(null);
  const [generatedData, setGeneratedData] = useState<any>(null);
  const [generationConfig, setGenerationConfig] = useState({
    rowCount: 10000,
    quality_level: 'high',
    privacy_level: 'maximum'
  });
  
  const { user, currentProject } = useStore();
  const dataService = new DataGeneratorService();
  const { isConnected, lastMessage } = useWebSocket();
  
  // Listen for WebSocket updates
  useEffect(() => {
    if (lastMessage?.type === 'job_update') {
      const { job_id, data } = lastMessage;
      if (data.progress !== undefined) {
        setGenerationProgress(data.progress);
      }
      if (data.status === 'completed') {
        setGeneratedData(data.result);
        setIsGenerating(false);
        setGenerationStep(4);
        toast.success('Synthetic data generated successfully!');
      } else if (data.status === 'failed') {
        setIsGenerating(false);
        toast.error('Generation failed: ' + data.error_message);
      }
    }
  }, [lastMessage]);

  const dataTypes = [
    { id: 'tabular', label: 'Tabular Data', icon: Database, description: 'CSV, Excel, structured data' },
    { id: 'timeseries', label: 'Time Series', icon: BarChart3, description: 'Sequential data with timestamps' },
    { id: 'text', label: 'Text Data', icon: FileText, description: 'Natural language, documents' },
    { id: 'image', label: 'Image Data', icon: Image, description: 'Synthetic images and visual data' },
  ];

  const domains = [
    { id: 'healthcare', label: 'Healthcare', icon: '🏥' },
    { id: 'finance', label: 'Finance', icon: '💰' },
    { id: 'retail', label: 'Retail', icon: '🛍️' },
    { id: 'manufacturing', label: 'Manufacturing', icon: '🏭' },
    { id: 'education', label: 'Education', icon: '🎓' },
    { id: 'custom', label: 'Custom', icon: '⚙️' },
  ];

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/json': ['.json'],
    },
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length === 0) return;
      
      const file = acceptedFiles[0];
      toast.loading('Processing uploaded file...');
      
      try {
        const processedData = await dataService.processUploadedData(file);
        setUploadedData(processedData);
        setGenerationStep(2);
        toast.dismiss();
        toast.success('File processed successfully!');
      } catch (error) {
        toast.dismiss();
        toast.error('Failed to process file. Please check the format.');
        console.error('File processing error:', error);
      }
    },
  });

  const handleGenerate = async () => {
    if (!user) {
      toast.error('Please sign in to generate data');
      return;
    }
    
    setIsGenerating(true);
    setGenerationStep(3);
    
    const loadingToast = toast.loading('Starting AI agent orchestration...');
    
    try {
      // Start generation job via API
      const jobResponse = await ApiService.startGeneration({
        domain: selectedDomain,
        data_type: selectedDataType,
        source_data: uploadedData?.data || [],
        ...generationConfig,
        schema: uploadedData?.schema || {},
        project_id: currentProject?.id
      });
      
      toast.dismiss();
      toast.success(`Generation job started! Job ID: ${jobResponse.job_id}`);
      
      // Store job ID for tracking
      setCurrentJobId(jobResponse.job_id);
      
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to start generation job');
      console.error('Generation error:', error);
      setIsGenerating(false);
    }
  };
  
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [generationProgress, setGenerationProgress] = useState(0);
  
  const handleExportData = async (format: 'csv' | 'json' | 'excel') => {
    if (!generatedData) return;
    
    try {
      const exportedData = await dataService.exportData(generatedData.data, format);
      
      // Create and download file
      const blob = new Blob([exportedData], { 
        type: format === 'json' ? 'application/json' : 'text/csv' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `synthetic-data-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success(`Data exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Failed to export data');
      console.error('Export error:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        className="flex items-center justify-between"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Data Generator</h1>
          <p className="text-gray-400">Create high-quality synthetic data with AI-powered agents</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full border border-purple-500/30">
            <Brain className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-purple-300">AI Agents Active</span>
          </div>
        </div>
      </motion.div>

      {/* Generation Steps */}
      <div className="flex items-center gap-4 p-4 bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-xl">
        {['Data Input', 'Configuration', 'Generation', 'Review'].map((step, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              index + 1 <= generationStep 
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                : 'bg-gray-700 text-gray-400'
            }`}>
              {index + 1 <= generationStep ? <CheckCircle className="w-4 h-4" /> : index + 1}
            </div>
            <span className={`text-sm ${
              index + 1 <= generationStep ? 'text-white' : 'text-gray-400'
            }`}>
              {step}
            </span>
            {index < 3 && <div className="w-8 h-0.5 bg-gray-700"></div>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Data Type Selection */}
          <motion.div
            className="p-6 bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-xl"
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h3 className="text-xl font-semibold text-white mb-4">Select Data Type</h3>
            <div className="grid grid-cols-2 gap-4">
              {dataTypes.map((type) => (
                <div
                  key={type.id}
                  onClick={() => setSelectedDataType(type.id)}
                  className={`p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                    selectedDataType === type.id
                      ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-2 border-purple-500/50'
                      : 'bg-gray-700/30 border-2 border-transparent hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <type.icon className="w-6 h-6 text-purple-400" />
                    <span className="font-medium text-white">{type.label}</span>
                  </div>
                  <p className="text-sm text-gray-400">{type.description}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Domain Selection */}
          <motion.div
            className="p-6 bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-xl"
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h3 className="text-xl font-semibold text-white mb-4">Select Domain</h3>
            <div className="grid grid-cols-3 gap-4">
              {domains.map((domain) => (
                <div
                  key={domain.id}
                  onClick={() => setSelectedDomain(domain.id)}
                  className={`p-4 rounded-lg cursor-pointer transition-all duration-200 text-center ${
                    selectedDomain === domain.id
                      ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-2 border-purple-500/50'
                      : 'bg-gray-700/30 hover:bg-gray-600/30 border-2 border-transparent'
                  }`}
                >
                  <div className="text-2xl mb-2">{domain.icon}</div>
                  <span className="text-sm text-white">{domain.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Data Upload */}
          <motion.div
            className="p-6 bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-xl"
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h3 className="text-xl font-semibold text-white mb-4">Upload Reference Data (Optional)</h3>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 ${
                isDragActive
                  ? 'border-purple-500 bg-purple-500/10'
                  : 'border-gray-600 hover:border-gray-500'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-white mb-2">
                {isDragActive
                  ? 'Drop your files here...'
                  : 'Drag & drop files here, or click to select'}
              </p>
              <p className="text-gray-400 text-sm">
                Supports CSV, Excel, JSON files
              </p>
            </div>
          </motion.div>

          {/* Generation Controls */}
          <motion.div
            className="p-6 bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-xl"
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <h3 className="text-xl font-semibold text-white mb-4">Generation Parameters</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Number of Records
                </label>
                <input
                  type="number"
                  value={generationConfig.rowCount}
                  onChange={(e) => setGenerationConfig(prev => ({ 
                    ...prev, 
                    rowCount: parseInt(e.target.value) || 10000 
                  }))}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Quality Level
                </label>
                <select 
                  value={generationConfig.quality_level}
                  onChange={(e) => setGenerationConfig(prev => ({ 
                    ...prev, 
                    quality_level: e.target.value 
                  }))}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="high">High Quality (Slower)</option>
                  <option value="balanced">Balanced</option>
                  <option value="fast">Fast Generation</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Privacy Level
                </label>
                <select 
                  value={generationConfig.privacy_level}
                  onChange={(e) => setGenerationConfig(prev => ({ 
                    ...prev, 
                    privacy_level: e.target.value 
                  }))}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="maximum">Maximum Privacy</option>
                  <option value="high">High Privacy</option>
                  <option value="balanced">Balanced</option>
                </select>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* AI Agents Status */}
          <motion.div
            className="p-6 bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-xl"
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h3 className="text-lg font-semibold text-white mb-4">AI Agents</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <span className="text-xs text-gray-400">
                  {isConnected ? 'Real-time Connected' : 'Disconnected'}
                </span>
              </div>
              {[
                { name: 'Privacy Agent', status: 'Ready', icon: Shield },
                { name: 'Quality Agent', status: 'Ready', icon: CheckCircle },
                { name: 'Domain Expert', status: 'Ready', icon: Brain },
                { name: 'Bias Detector', status: 'Ready', icon: Zap },
              ].map((agent, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-lg">
                  <agent.icon className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-white text-sm font-medium">{agent.name}</p>
                    <p className="text-green-400 text-xs">{agent.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Generate Button */}
          <motion.div
            className="p-6 bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-xl"
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !selectedDomain || !selectedDataType}
              className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-300 ${
                isGenerating || !selectedDomain || !selectedDataType
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
              } text-white flex items-center justify-center gap-2`}
            >
              {isGenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Generating... {generationProgress}%
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Generate Data
                </>
              )}
            </button>
          </motion.div>

          {/* Generation Progress */}
          {isGenerating && (
            <div className="p-4 bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-xl">
              <h3 className="text-lg font-semibold text-white mb-2">Generation Progress</h3>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300" style={{ width: `${generationProgress}%` }}></div>
              </div>
              <p className="text-sm text-gray-400 mt-2">{generationProgress}% Complete</p>
            </div>
          )}

          {/* Results */}
          {generatedData && (
            <motion.div
              className="p-6 bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-xl"
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <h3 className="text-lg font-semibold text-white mb-4">Generation Results</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Records Generated:</span>
                  <span className="text-white font-medium">
                    {generatedData.metadata?.rowsGenerated?.toLocaleString() || 0}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Columns:</span>
                  <span className="text-white font-medium">
                    {generatedData.metadata?.columnsGenerated || 0}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Quality Score:</span>
                  <span className="text-green-400 font-medium">{generatedData.qualityScore}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Privacy Score:</span>
                  <span className="text-green-400 font-medium">{generatedData.privacyScore}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Bias Score:</span>
                  <span className="text-green-400 font-medium">{generatedData.biasScore}%</span>
                </div>
              </div>
              <div className="space-y-2 mt-4">
                <button 
                  onClick={() => handleExportData('csv')}
                  className="w-full py-2 px-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download CSV
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => handleExportData('json')}
                    className="py-2 px-4 bg-gray-700/50 text-white rounded-lg hover:bg-gray-600/50 transition-all duration-300 text-sm"
                  >
                    JSON
                  </button>
                  <button 
                    onClick={() => handleExportData('excel')}
                    className="py-2 px-4 bg-gray-700/50 text-white rounded-lg hover:bg-gray-600/50 transition-all duration-300 text-sm"
                  >
                    Excel
                  </button>
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Uploaded Data Info */}
          {uploadedData && (
            <motion.div
              className="p-6 bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-xl"
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <h3 className="text-lg font-semibold text-white mb-4">Source Data Analysis</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Rows:</span>
                  <span className="text-white font-medium">
                    {uploadedData.statistics?.rowCount?.toLocaleString() || 0}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Columns:</span>
                  <span className="text-white font-medium">
                    {uploadedData.statistics?.columnCount || 0}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Domain:</span>
                  <span className="text-purple-400 font-medium">
                    {uploadedData.analysis?.domain || 'Analyzing...'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Quality:</span>
                  <span className="text-green-400 font-medium">
                    {uploadedData.analysis?.quality?.score ? `${uploadedData.analysis.quality.score}%` : 'Good'}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataGenerator;