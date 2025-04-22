import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, Download, Languages, Settings, ChevronDown, ChevronUp, Check, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SrtTranslator = () => {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [fileName, setFileName] = useState('');
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [customModelName, setCustomModelName] = useState('');
  const [customProviderType, setCustomProviderType] = useState('openai');
  const [showProviderOptions, setShowProviderOptions] = useState(false);
  const [isModelSelected, setIsModelSelected] = useState(false);
  const [showModelOptions, setShowModelOptions] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const fileInputRef = useRef(null);
  
  // 定义API供应商类型
  const providerTypes = [
    { id: 'openai', name: 'OpenAI API' },
    { id: 'anthropic', name: 'Anthropic API' },
    { id: 'azure-openai', name: 'Azure OpenAI API' },
    { id: 'gemini', name: 'Google Gemini API' },
    { id: 'zhipu', name: '智谱 API' },
    { id: 'deepseek', name: 'Deepseek API' },
    { id: 'qwen', name: '通义千问 API' },
    { id: 'other', name: '其他 API (通用格式)' }
  ];
  
  // Define available AI models with their configurations
  const predefinedModels = [
    {
      name: 'OpenAI - GPT-4',
      baseUrl: 'https://api.openai.com/v1/chat/completions',
      model: 'gpt-4-turbo'
    },
    {
      name: 'OpenAI - GPT-3.5 Turbo',
      baseUrl: 'https://api.openai.com/v1/chat/completions',
      model: 'gpt-3.5-turbo'
    },
    {
      name: 'Anthropic - Claude 3 Opus',
      baseUrl: 'https://api.anthropic.com/v1/messages',
      model: 'claude-3-opus-20240229'
    },
    {
      name: 'Anthropic - Claude 3 Sonnet',
      baseUrl: 'https://api.anthropic.com/v1/messages',
      model: 'claude-3-sonnet-20240229'
    },
    {
      name: 'Anthropic - Claude 3 Haiku',
      baseUrl: 'https://api.anthropic.com/v1/messages',
      model: 'claude-3-haiku-20240307'
    },
    {
      name: 'Zhipu - GLM-4',
      baseUrl: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
      model: 'glm-4'
    },
    {
      name: 'Deepseek - Deepseek-Chat',
      baseUrl: 'https://api.deepseek.com/v1/chat/completions',
      model: 'deepseek-chat'
    },
    {
      name: 'Deepseek - Deepseek-Reasoner',
      baseUrl: 'https://api.deepseek.com/v1/chat/completions',
      model: 'deepseek-reasoner'
    },
    {
      name: 'Qwen - Qwen-Max',
      baseUrl: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
      model: 'qwen-max'
    },
    {
      name: '自定义模型',
      baseUrl: '',
      model: ''
    }
  ];

  // Load saved settings from localStorage on component mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem('apiKey');
    const savedApiUrl = localStorage.getItem('apiUrl');
    const savedModel = localStorage.getItem('selectedModel');
    const savedBaseUrl = localStorage.getItem('apiBaseUrl');
    const savedCustomModelName = localStorage.getItem('customModelName');
    const savedCustomProviderType = localStorage.getItem('customProviderType');
    
    if (savedApiKey) setApiKey(savedApiKey);
    if (savedApiUrl) setApiUrl(savedApiUrl);
    if (savedCustomModelName) setCustomModelName(savedCustomModelName);
    if (savedCustomProviderType) setCustomProviderType(savedCustomProviderType);
    
    if (savedModel) {
      setSelectedModel(savedModel);
      setIsModelSelected(true);
      
      // If it's a predefined model, we should set the API URL accordingly
      const predefinedModel = predefinedModels.find(model => model.name === savedModel);
      if (predefinedModel && predefinedModel.name !== '自定义模型' && !savedBaseUrl) {
        setApiUrl(predefinedModel.baseUrl);
      } else if (savedBaseUrl) {
        setApiUrl(savedBaseUrl);
      }
    }
  }, []);

  const handleFileUpload = (e) => {
    const file = e?.target?.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        setInputText(event?.target?.result ?? '');
      };
      reader.readAsText(file);
    }
  };

  // Translation prompt template
  const getTranslationPrompt = (text) => {
    return `# 角色 你是一位翻译专家，任务目标是将接收到日文文本翻译成中文。

## 任务要求
1、逐行对应：严格按照原文行数翻译，不得拆分或合并行。
2、字符保留：原文中的空白符、转义符、英文代码等控制字符必须在译文中原样保留，数量也必须保持一致。不过如果某句话的句尾是"、"的话，请把他改成"..."。
3、完整翻译：除控制字符外，所有内容均需翻译，包括拟声词、语气词和专有名词（如角色名）。
4、翻译风格：确保译文准确传达原文含义，语句流畅自然，符合目标语言习惯。即使原文包含直白或粗俗的措辞，也须忠实再现，不得回避或淡化。另外，为了确保翻译后台词的语气足够生动鲜活，你会先提前确认好台本的故事背景和台词主人的人设，再参照着翻译。比如主人公是生动活泼的女孩，台词就要翻译的阳光一些，阴暗低沉的女孩，台词就要适当的冷漠自闭一些。如果是严肃的故事背景，台词就要严肃一些，如果是日常喜剧的故事背景，整体翻译节奏可以轻快一些。
5、特殊要求：翻译中会遇到类似"(占位符)"这种特殊的内容，这些内容一般指代了一些气息或者呢喃声，并不会影响理解，如果括号中是中文，请在译文中保留并原样输出它，如果是日文，则翻译成中文并保留括号。如果原文中的某些句子(或者这个句子的某部分)本身就是翻译过的内容，则不需要处理，输出原文即可。

## 限制
- 只进行翻译工作，不回答与翻译无关的问题。
- 严格按照用户要求的目标语言进行翻译，不得擅自更改。

以下是需要翻译的内容：

${text}

请直接输出翻译结果，不要添加额外的解释。`;
  };

  // Handle API call for different models
  const callTranslationAPI = async (text) => {
    setIsTranslating(true);
    setErrorMessage('');
    
    try {
      // Find the selected model configuration
      const selectedModelConfig = predefinedModels.find(model => model.name === selectedModel);
      let modelIdentifier = '';
      let headers = {
        'Content-Type': 'application/json'
      };
      let body = {};
      let endpoint = apiUrl;
      
      // Configure API request based on model provider
      if (selectedModel.includes('OpenAI')) {
        headers['Authorization'] = `Bearer ${apiKey}`;
        modelIdentifier = selectedModelConfig.model;
        body = {
          model: modelIdentifier,
          messages: [{ role: "user", content: getTranslationPrompt(text) }],
          temperature: 0.3
        };
      } else if (selectedModel.includes('Anthropic')) {
        headers['x-api-key'] = apiKey;
        headers['anthropic-version'] = '2023-06-01';
        modelIdentifier = selectedModelConfig.model;
        body = {
          model: modelIdentifier,
          messages: [{ role: "user", content: getTranslationPrompt(text) }],
          temperature: 0.3
        };
      } else if (selectedModel.includes('Zhipu')) {
        headers['Authorization'] = `Bearer ${apiKey}`;
        modelIdentifier = selectedModelConfig.model;
        body = {
          model: modelIdentifier,
          messages: [{ role: "user", content: getTranslationPrompt(text) }],
          temperature: 0.3
        };
      } else if (selectedModel.includes('Deepseek')) {
        headers['Authorization'] = `Bearer ${apiKey}`;
        modelIdentifier = selectedModelConfig.model;
        body = {
          model: modelIdentifier,
          messages: [{ role: "user", content: getTranslationPrompt(text) }],
          temperature: 0.3
        };
      } else if (selectedModel.includes('Qwen')) {
        headers['Authorization'] = `Bearer ${apiKey}`;
        modelIdentifier = selectedModelConfig.model;
        body = {
          model: modelIdentifier,
          input: {
            messages: [{ role: "user", content: getTranslationPrompt(text) }]
          },
          parameters: {
            temperature: 0.3
          }
        };
      } else if (selectedModel === '自定义模型') {
        // 为自定义模型根据选择的提供商配置请求
        switch (customProviderType) {
          case 'openai':
            headers['Authorization'] = `Bearer ${apiKey}`;
            body = {
              model: customModelName,
              messages: [{ role: "user", content: getTranslationPrompt(text) }],
              temperature: 0.3
            };
            break;
          case 'anthropic':
            headers['x-api-key'] = apiKey;
            headers['anthropic-version'] = '2023-06-01';
            body = {
              model: customModelName,
              messages: [{ role: "user", content: getTranslationPrompt(text) }],
              temperature: 0.3
            };
            break;
          case 'azure-openai':
            headers['api-key'] = apiKey;
            body = {
              messages: [{ role: "user", content: getTranslationPrompt(text) }],
              temperature: 0.3
            };
            break;
          case 'gemini':
            headers['Authorization'] = `Bearer ${apiKey}`;
            body = {
              contents: [{ role: "user", parts: [{ text: getTranslationPrompt(text) }] }],
              generationConfig: {
                temperature: 0.3
              }
            };
            break;
          case 'zhipu':
            headers['Authorization'] = `Bearer ${apiKey}`;
            body = {
              model: customModelName,
              messages: [{ role: "user", content: getTranslationPrompt(text) }],
              temperature: 0.3
            };
            break;
          case 'deepseek':
            headers['Authorization'] = `Bearer ${apiKey}`;
            body = {
              model: customModelName,
              messages: [{ role: "user", content: getTranslationPrompt(text) }],
              temperature: 0.3
            };
            break;
          case 'qwen':
            headers['Authorization'] = `Bearer ${apiKey}`;
            body = {
              model: customModelName,
              input: {
                messages: [{ role: "user", content: getTranslationPrompt(text) }]
              },
              parameters: {
                temperature: 0.3
              }
            };
            break;
          case 'other':
          default:
            headers['Authorization'] = `Bearer ${apiKey}`;
            body = {
              model: customModelName,
              messages: [{ role: "user", content: getTranslationPrompt(text) }],
              temperature: 0.3
            };
            break;
        }
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API Error: ${response.status} - ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      
      // Extract response text based on model provider
      let translatedText = '';
      if (selectedModel.includes('OpenAI') || (selectedModel === '自定义模型' && customProviderType === 'openai')) {
        translatedText = data.choices[0].message.content;
      } else if (selectedModel.includes('Anthropic') || (selectedModel === '自定义模型' && customProviderType === 'anthropic')) {
        translatedText = data.content[0].text;
      } else if (selectedModel === '自定义模型' && customProviderType === 'azure-openai') {
        translatedText = data.choices[0].message.content;
      } else if (selectedModel === '自定义模型' && customProviderType === 'gemini') {
        translatedText = data.candidates[0].content.parts[0].text;
      } else if (selectedModel.includes('Zhipu') || (selectedModel === '自定义模型' && customProviderType === 'zhipu')) {
        translatedText = data.choices[0].message.content;
      } else if (selectedModel.includes('Deepseek') || (selectedModel === '自定义模型' && customProviderType === 'deepseek')) {
        translatedText = data.choices[0].message.content;
      } else if (selectedModel.includes('Qwen') || (selectedModel === '自定义模型' && customProviderType === 'qwen')) {
        translatedText = data.output.text;
      } else {
        // For other custom models, try common response formats
        translatedText = data.choices?.[0]?.message?.content || 
                       data.content?.[0]?.text || 
                       data.response || 
                       data.output?.text ||
                       data.generated_text ||
                       data.candidates?.[0]?.content?.parts?.[0]?.text ||
                       JSON.stringify(data);
      }

      setOutputText(translatedText);
      setShowDownloadModal(true);
    } catch (error) {
      console.error('Translation error:', error);
      setErrorMessage(`翻译失败: ${error.message}`);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleTranslate = () => {
    if (!isModelSelected) {
      setErrorMessage('请先设置翻译模型');
      return;
    }
    
    if (!inputText.trim()) {
      setErrorMessage('请输入需要翻译的文本');
      return;
    }
    
    callTranslationAPI(inputText);
  };

  const handleDownload = () => {
    const blob = new Blob([outputText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName.replace('.srt', '') || 'translated'}_trans.srt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowDownloadModal(false);
  };

  const handleModelSelect = (model) => {
    setSelectedModel(model);
    setIsModelSelected(true);
    setShowModelOptions(false);
    
    // If predefined model, set the API URL automatically
    const selectedModelConfig = predefinedModels.find(m => m.name === model);
    if (selectedModelConfig && model !== '自定义模型') {
      setApiUrl(selectedModelConfig.baseUrl);
    }
  };

  const handleProviderSelect = (providerId) => {
    setCustomProviderType(providerId);
    setShowProviderOptions(false);
    
    // 根据供应商类型设置API URL的默认值
    switch (providerId) {
      case 'openai':
        setApiUrl('https://api.openai.com/v1/chat/completions');
        break;
      case 'anthropic':
        setApiUrl('https://api.anthropic.com/v1/messages');
        break;
      case 'azure-openai':
        setApiUrl('https://{your-resource-name}.openai.azure.com/openai/deployments/{deployment-id}/chat/completions?api-version=2023-05-15');
        break;
      case 'gemini':
        setApiUrl('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent');
        break;
      case 'zhipu':
        setApiUrl('https://open.bigmodel.cn/api/paas/v4/chat/completions');
        break;
      case 'deepseek':
        setApiUrl('https://api.deepseek.com/v1/chat/completions');
        break;
      case 'qwen':
        setApiUrl('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation');
        break;
      default:
        // 保持当前URL
        break;
    }
  };

  const handleSaveSettings = () => {
    if (!selectedModel) {
      setErrorMessage('请选择翻译模型');
      return;
    }
    
    if (selectedModel !== '自定义模型' && !apiKey) {
      setErrorMessage('请输入API密钥');
      return;
    }
    
    if (selectedModel === '自定义模型' && (!apiKey || !apiUrl)) {
      setErrorMessage('请输入API密钥和API地址');
      return;
    }
    
    if (selectedModel === '自定义模型' && !customModelName) {
      setErrorMessage('请输入模型名称');
      return;
    }
    
    // Save settings to localStorage
    localStorage.setItem('apiKey', apiKey);
    if (selectedModel === '自定义模型') {
      localStorage.setItem('apiBaseUrl', apiUrl);
      localStorage.setItem('customModelName', customModelName);
      localStorage.setItem('customProviderType', customProviderType);
    }
    localStorage.setItem('selectedModel', selectedModel);
    
    setShowSettingsModal(false);
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 flex items-center">
          <Languages className="mr-2" /> SRT 字幕翻译工具
        </h1>

        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 flex flex-col gap-6">
            <motion.div 
              whileHover={{ y: -2 }}
              className="bg-white rounded-xl shadow-md p-6"
            >
              <h2 className="text-xl font-semibold mb-4 text-gray-700">文本输入</h2>
              <textarea 
                className="w-full h-64 p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="在此粘贴日语SRT字幕内容..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
            </motion.div>

            <motion.div 
              whileHover={{ y: -2 }}
              className="bg-white rounded-xl shadow-md p-6"
            >
              <h2 className="text-xl font-semibold mb-4 text-gray-700">文件上传</h2>
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mx-auto text-gray-400 mb-2" size={48} />
                <p className="text-gray-500 mb-2">点击或拖拽SRT文件到此处</p>
                <p className="text-sm text-gray-400">支持.srt格式文件</p>
                <input 
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".srt"
                  onChange={handleFileUpload}
                />
              </div>
              {fileName && (
                <div className="mt-4 flex items-center text-blue-600">
                  <FileText className="mr-2" />
                  <span className="truncate">{fileName}</span>
                </div>
              )}
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 bg-white rounded-xl shadow-md p-6"
          >
            <h2 className="text-xl font-semibold mb-4 text-gray-700">翻译结果</h2>
            <div className="w-full h-96 p-4 border border-gray-200 rounded-lg bg-gray-50 overflow-auto relative">
              {isTranslating ? (
                <div className="h-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                  <p className="ml-4 text-gray-600">正在翻译中...</p>
                </div>
              ) : outputText ? (
                <pre className="whitespace-pre-wrap font-sans">{outputText}</pre>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">
                  <p>翻译结果将显示在这里...</p>
                </div>
              )}
            </div>
            
            {errorMessage && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 flex items-start">
                <AlertCircle className="mr-2 flex-shrink-0 mt-0.5" size={16} />
                <p>{errorMessage}</p>
              </div>
            )}
          </motion.div>
        </div>

        <div className="mt-8 flex justify-center space-x-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors text-lg font-medium flex items-center"
            onClick={() => setShowSettingsModal(true)}
          >
            <Settings className="mr-2" size={20} />
            翻译模型设置
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`px-8 py-3 rounded-lg shadow-md text-lg font-medium flex items-center ${
              isTranslating ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
            onClick={handleTranslate}
            disabled={!inputText || isTranslating}
          >
            {isTranslating ? '翻译中...' : '开始翻译'}
          </motion.button>
        </div>

        <div className="mt-6 flex justify-center">
          {isModelSelected ? (
            <div className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
              <Check size={16} className="mr-1" />
              当前模型: {selectedModel === '自定义模型' ? `自定义模型 (${customModelName}) - ${providerTypes.find(p => p.id === customProviderType)?.name || '未知供应商'}` : selectedModel}
            </div>
          ) : (
            <div className="inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
              <AlertCircle size={16} className="mr-1" />
              未设置翻译模型
            </div>
          )}
        </div>
      </div>

      {/* 翻译模型设置模态框 */}
      <AnimatePresence>
        {showSettingsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full"
            >
              <h3 className="text-xl font-semibold mb-4">翻译模型设置</h3>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">选择翻译模型</label>
                <div className="relative">
                  <div 
                    className="flex items-center justify-between p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
                    onClick={() => setShowModelOptions(!showModelOptions)}
                  >
                    <span>{selectedModel || '请选择模型'}</span>
                    {showModelOptions ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                  <AnimatePresence>
                    {showModelOptions && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto"
                      >
                        {predefinedModels.map((model) => (
                          <div
                            key={model.name}
                            className="p-3 hover:bg-gray-100 cursor-pointer flex items-center justify-between"
                            onClick={() => handleModelSelect(model.name)}
                          >
                            <span>{model.name}</span>
                            {selectedModel === model.name && <Check size={16} className="text-blue-500" />}
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-2">API密钥</label>
                <input
                  type="password"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="输入API密钥"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {selectedModel.includes('OpenAI') && 'OpenAI API密钥，可在 platform.openai.com 获取'}
                  {selectedModel.includes('Anthropic') && 'Anthropic API密钥，可在 console.anthropic.com 获取'}
                  {selectedModel.includes('Zhipu') && '智谱API密钥，可在 open.bigmodel.cn 获取'}
                  {selectedModel.includes('Deepseek') && 'Deepseek API密钥，可在 platform.deepseek.com 获取'}
                  {selectedModel.includes('Qwen') && '通义千问API密钥，可在 dashscope.aliyun.com 获取'}
                </p>
              </div>

              {selectedModel === '自定义模型' && (
                <>
                  <div className="mb-4">
                    <label className="block text-gray-700 mb-2">API供应商类型</label>
                    <div className="relative">
                      <div 
                        className="flex items-center justify-between p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
                        onClick={() => setShowProviderOptions(!showProviderOptions)}
                      >
                        <span>{providerTypes.find(p => p.id === customProviderType)?.name || '请选择供应商'}</span>
                        {showProviderOptions ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>
                      <AnimatePresence>
                        {showProviderOptions && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto"
                          >
                            {providerTypes.map((provider) => (
                              <div
                                key={provider.id}
                                className="p-3 hover:bg-gray-100 cursor-pointer flex items-center justify-between"
                                onClick={() => handleProviderSelect(provider.id)}
                              >
                                <span>{provider.name}</span>
                                {customProviderType === provider.id && <Check size={16} className="text-blue-500" />}
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      选择API供应商类型以确保正确处理响应格式
                    </p>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-gray-700 mb-2">API地址</label>
                    <input
                      type="text"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="输入API地址"
                      value={apiUrl}
                      onChange={(e) => setApiUrl(e.target.value)}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      完整的API端点地址，根据选择的供应商类型会有默认建议值
                    </p>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-gray-700 mb-2">模型名称</label>
                    <input
                      type="text"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="输入模型名称"
                      value={customModelName}
                      onChange={(e) => setCustomModelName(e.target.value)}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {customProviderType === 'openai' && '例如: gpt-4o, gpt-4-turbo, gpt-4-0125-preview'}
                      {customProviderType === 'anthropic' && '例如: claude-3-opus-20240229, claude-3-sonnet-20240229'}
                      {customProviderType === 'azure-openai' && '不需要填写，已在部署ID中配置'}
                      {customProviderType === 'gemini' && '例如: gemini-pro, gemini-1.5-pro'}
                      {customProviderType === 'zhipu' && '例如: glm-4, glm-4v'}
                      {customProviderType === 'deepseek' && '例如: deepseek-chat, deepseek-coder'}
                      {customProviderType === 'qwen' && '例如: qwen-max, qwen-turbo'}
                      {customProviderType === 'other' && '请输入模型标识符'}
                    </p>
                  </div>

                  {customProviderType === 'azure-openai' && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                      <p className="text-sm text-blue-700">
                        <strong>Azure OpenAI API格式说明：</strong><br/>
                        API地址应使用格式：<br/>
                        <code className="bg-blue-100 px-1 rounded">https://{'{your-resource-name}'}.openai.azure.com/openai/deployments/{'{deployment-id}'}/chat/completions?api-version=2023-05-15</code><br/>
                        请将 {'{your-resource-name}'} 替换为您的资源名称，将 {'{deployment-id}'} 替换为您的部署ID。
                      </p>
                    </div>
                  )}
                </>
              )}

              {errorMessage && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 flex items-start">
                  <AlertCircle className="mr-2 flex-shrink-0 mt-0.5" size={16} />
                  <p>{errorMessage}</p>
                </div>
              )}

              <div className="flex justify-end space-x-4 mt-6">
                <button 
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  onClick={() => {
                    setShowSettingsModal(false);
                    setErrorMessage('');
                  }}
                >
                  取消
                </button>
                <button 
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  onClick={handleSaveSettings}
                >
                  保存设置
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 下载模态框 */}
      <AnimatePresence>
        {showDownloadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full"
            >
              <h3 className="text-xl font-semibold mb-4">翻译完成</h3>
              <p className="text-gray-600 mb-6">是否要下载翻译后的SRT文件？</p>
              <div className="flex justify-end space-x-4">
                <button 
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  onClick={() => setShowDownloadModal(false)}
                >
                  关闭
                </button>
                <button 
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                  onClick={handleDownload}
                >
                  <Download className="mr-2" size={16} />
                  下载文件
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className="mt-12 text-center text-gray-500 text-sm">
        <p>created by <a href="https://space.coze.cn" className="text-blue-600 hover:underline">coze space</a> | 页面内容均由 AI 生成，仅供参考</p>
      </footer>
    </div>
  );
};

export default SrtTranslator;