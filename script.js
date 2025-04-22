// script.js - 完整的 SRT 翻译工具 JavaScript 实现

// ==========================================
// 常量和配置
// ==========================================
const CONFIG = {
  // 预定义的模型配置
  PREDEFINED_MODELS: [
    {
      name: "OpenAI - GPT-4",
      baseUrl: "https://api.openai.com/v1/chat/completions",
      model: "gpt-4-turbo",
    },
    {
      name: "OpenAI - GPT-3.5 Turbo",
      baseUrl: "https://api.openai.com/v1/chat/completions",
      model: "gpt-3.5-turbo",
    },
    {
      name: "Anthropic - Claude 3 Opus",
      baseUrl: "https://api.anthropic.com/v1/messages",
      model: "claude-3-opus-20240229",
    },
    {
      name: "Anthropic - Claude 3 Sonnet",
      baseUrl: "https://api.anthropic.com/v1/messages",
      model: "claude-3-sonnet-20240229",
    },
    {
      name: "Anthropic - Claude 3 Haiku",
      baseUrl: "https://api.anthropic.com/v1/messages",
      model: "claude-3-haiku-20240307",
    },
    {
      name: "Zhipu - GLM-4",
      baseUrl: "https://open.bigmodel.cn/api/paas/v4/chat/completions",
      model: "glm-4",
    },
    {
      name: "Deepseek - Deepseek-Chat",
      baseUrl: "https://api.deepseek.com/v1/chat/completions",
      model: "deepseek-chat",
    },
    {
      name: "Deepseek - Deepseek-Reasoner",
      baseUrl: "https://api.deepseek.com/v1/chat/completions",
      model: "deepseek-reasoner",
    },
    {
      name: "Qwen - Qwen-Max",
      baseUrl:
        "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation",
      model: "qwen-max",
    },
    {
      name: "自定义模型",
      baseUrl: "",
      model: "",
    },
  ],

  // API提供商类型
  PROVIDER_TYPES: [
    { id: "openai", name: "OpenAI API" },
    { id: "anthropic", name: "Anthropic API" },
    { id: "azure-openai", name: "Azure OpenAI API" },
    { id: "gemini", name: "Google Gemini API" },
    { id: "zhipu", name: "智谱 API" },
    { id: "deepseek", name: "Deepseek API" },
    { id: "qwen", name: "通义千问 API" },
    { id: "other", name: "其他 API (通用格式)" },
  ],
};

// ==========================================
// 状态管理
// ==========================================
let state = {
  inputText: "",
  outputText: "",
  fileName: "",
  selectedModel: "",
  apiKey: "",
  apiUrl: "",
  customModelName: "",
  customProviderType: "openai",
  showModelOptions: false,
  showProviderOptions: false,
  isModelSelected: false,
  isTranslating: false,
  errorMessage: "",
};

// ==========================================
// DOM 元素引用
// ==========================================
const elements = {
  fileInput: document.getElementById("fileInput"),
  dropZone: document.getElementById("dropZone"),
  fileName: document.getElementById("fileName"),
  fileNameText: document.querySelector("#fileName span"),
  inputText: document.getElementById("inputText"),
  outputText: document.getElementById("outputText"),
  outputPlaceholder: document.getElementById("outputPlaceholder"),
  settingsButton: document.getElementById("settingsButton"),
  translateButton: document.getElementById("translateButton"),
  settingsModal: document.getElementById("settingsModal"),
  downloadModal: document.getElementById("downloadModal"),
  modelIndicator: document.getElementById("modelIndicator"),
  errorMessage: document.getElementById("errorMessage"),
  errorMessageText: document.querySelector("#errorMessage p"),
  translatingIndicator: document.getElementById("translatingIndicator"),
};

// ==========================================
// 工具函数
// ==========================================
const utils = {
  // 显示错误消息
  showError(message) {
    state.errorMessage = message;
    elements.errorMessageText.textContent = message;
    elements.errorMessage.classList.remove("hidden");
    setTimeout(() => {
      elements.errorMessage.classList.add("hidden");
      state.errorMessage = "";
    }, 5000);
  },

  // 清除错误消息
  clearError() {
    elements.errorMessage.classList.add("hidden");
    state.errorMessage = "";
  },

  // 显示加载状态
  setLoading(isLoading) {
    state.isTranslating = isLoading;
    elements.translatingIndicator.classList.toggle("hidden", !isLoading);
    elements.outputPlaceholder.classList.toggle(
      "hidden",
      isLoading || state.outputText
    );
    elements.outputText.classList.toggle("hidden", isLoading);

    elements.translateButton.disabled = isLoading;
    elements.translateButton.textContent = isLoading ? "翻译中..." : "开始翻译";

    if (isLoading) {
      elements.translateButton.classList.add(
        "bg-gray-400",
        "cursor-not-allowed"
      );
      elements.translateButton.classList.remove(
        "bg-blue-600",
        "hover:bg-blue-700"
      );
    } else {
      elements.translateButton.classList.remove(
        "bg-gray-400",
        "cursor-not-allowed"
      );
      elements.translateButton.classList.add(
        "bg-blue-600",
        "hover:bg-blue-700"
      );
    }
  },

  // 更新模型指示器
  updateModelIndicator() {
    const indicator = elements.modelIndicator;
    if (state.selectedModel) {
      indicator.className =
        "inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm";

      let displayText = state.selectedModel;
      if (state.selectedModel === "自定义模型") {
        const providerName =
          CONFIG.PROVIDER_TYPES.find((p) => p.id === state.customProviderType)
            ?.name || "未知供应商";
        displayText = `自定义模型 (${state.customModelName}) - ${providerName}`;
      }

      indicator.innerHTML = `
                <i data-lucide="check" class="mr-1"></i>
                当前模型: ${displayText}
            `;
    } else {
      indicator.className =
        "inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm";
      indicator.innerHTML = `
                <i data-lucide="alert-circle" class="mr-1"></i>
                未设置翻译模型
            `;
    }
    lucide.createIcons();
  },

  // 保存设置到本地存储
  saveSettings() {
    localStorage.setItem("apiKey", state.apiKey);
    localStorage.setItem("apiUrl", state.apiUrl);
    localStorage.setItem("selectedModel", state.selectedModel);
    localStorage.setItem("customModelName", state.customModelName);
    localStorage.setItem("customProviderType", state.customProviderType);
  },

  // 从本地存储加载设置
  loadSettings() {
    state.apiKey = localStorage.getItem("apiKey") || "";
    state.apiUrl = localStorage.getItem("apiUrl") || "";
    state.selectedModel = localStorage.getItem("selectedModel") || "";
    state.customModelName = localStorage.getItem("customModelName") || "";
    state.customProviderType =
      localStorage.getItem("customProviderType") || "openai";

    state.isModelSelected = !!state.selectedModel;

    // 如果有选择预定义模型，自动设置API URL
    if (state.selectedModel && state.selectedModel !== "自定义模型") {
      const predefinedModel = CONFIG.PREDEFINED_MODELS.find(
        (model) => model.name === state.selectedModel
      );
      if (predefinedModel) {
        state.apiUrl = predefinedModel.baseUrl;
      }
    }

    this.updateModelIndicator();
  },

  // 获取当前模型详情
  getCurrentModelDetails() {
    if (!state.selectedModel) return null;

    if (state.selectedModel === "自定义模型") {
      return {
        name: "自定义模型",
        baseUrl: state.apiUrl,
        model: state.customModelName,
        providerType: state.customProviderType,
      };
    }

    const modelDetails = CONFIG.PREDEFINED_MODELS.find(
      (model) => model.name === state.selectedModel
    );
    return {
      ...modelDetails,
      providerType: state.selectedModel.toLowerCase().includes("openai")
        ? "openai"
        : state.selectedModel.toLowerCase().includes("anthropic")
        ? "anthropic"
        : state.selectedModel.toLowerCase().includes("zhipu")
        ? "zhipu"
        : state.selectedModel.toLowerCase().includes("deepseek")
        ? "deepseek"
        : state.selectedModel.toLowerCase().includes("qwen")
        ? "qwen"
        : "other",
    };
  },
};

// ==========================================
// API 相关函数
// ==========================================
const api = {
  // 获取翻译提示模板
  getTranslationPrompt(text) {
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
  },

  // 处理不同模型的 API 调用
  async translate(text) {
    utils.clearError();
    utils.setLoading(true);

    try {
      const modelDetails = utils.getCurrentModelDetails();
      if (!modelDetails) {
        throw new Error("未选择翻译模型");
      }

      let headers = {
        "Content-Type": "application/json",
      };
      let body = {};
      let endpoint = modelDetails.baseUrl;

      // 根据提供商类型配置请求
      switch (modelDetails.providerType) {
        case "openai":
          headers["Authorization"] = `Bearer ${state.apiKey}`;
          body = {
            model: modelDetails.model,
            messages: [
              { role: "user", content: this.getTranslationPrompt(text) },
            ],
            temperature: 0.3,
          };
          break;

        case "anthropic":
          headers["x-api-key"] = state.apiKey;
          headers["anthropic-version"] = "2023-06-01";
          body = {
            model: modelDetails.model,
            messages: [
              { role: "user", content: this.getTranslationPrompt(text) },
            ],
            temperature: 0.3,
          };
          break;

        case "azure-openai":
          headers["api-key"] = state.apiKey;
          body = {
            messages: [
              { role: "user", content: this.getTranslationPrompt(text) },
            ],
            temperature: 0.3,
          };
          break;

        case "gemini":
          headers["Authorization"] = `Bearer ${state.apiKey}`;
          body = {
            contents: [
              {
                role: "user",
                parts: [{ text: this.getTranslationPrompt(text) }],
              },
            ],
            generationConfig: {
              temperature: 0.3,
            },
          };
          break;

        case "zhipu":
          headers["Authorization"] = `Bearer ${state.apiKey}`;
          body = {
            model: modelDetails.model,
            messages: [
              { role: "user", content: this.getTranslationPrompt(text) },
            ],
            temperature: 0.3,
          };
          break;

        case "deepseek":
          headers["Authorization"] = `Bearer ${state.apiKey}`;
          body = {
            model: modelDetails.model,
            messages: [
              { role: "user", content: this.getTranslationPrompt(text) },
            ],
            temperature: 0.3,
          };
          break;

        case "qwen":
          headers["Authorization"] = `Bearer ${state.apiKey}`;
          body = {
            model: modelDetails.model,
            input: {
              messages: [
                { role: "user", content: this.getTranslationPrompt(text) },
              ],
            },
            parameters: {
              temperature: 0.3,
            },
          };
          break;

        case "other":
        default:
          headers["Authorization"] = `Bearer ${state.apiKey}`;
          body = {
            model: modelDetails.model,
            messages: [
              { role: "user", content: this.getTranslationPrompt(text) },
            ],
            temperature: 0.3,
          };
          break;
      }

      console.log("Sending request to:", endpoint);
      const response = await fetch(endpoint, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `API Error: ${response.status} - ${
            errorData.error?.message || response.statusText
          }`
        );
      }

      const data = await response.json();
      console.log("API response:", data);

      // 根据不同模型处理响应
      let translatedText = "";

      switch (modelDetails.providerType) {
        case "openai":
        case "azure-openai":
          translatedText = data.choices[0].message.content;
          break;

        case "anthropic":
          translatedText = data.content[0].text;
          break;

        case "gemini":
          translatedText = data.candidates[0].content.parts[0].text;
          break;

        case "zhipu":
        case "deepseek":
          translatedText = data.choices[0].message.content;
          break;

        case "qwen":
          translatedText = data.output.text;
          break;

        case "other":
        default:
          // 尝试常见响应格式
          translatedText =
            data.choices?.[0]?.message?.content ||
            data.content?.[0]?.text ||
            data.response ||
            data.output?.text ||
            data.generated_text ||
            data.candidates?.[0]?.content?.parts?.[0]?.text ||
            JSON.stringify(data);
          break;
      }

      state.outputText = translatedText;
      elements.outputText.textContent = translatedText;
      elements.outputText.classList.remove("hidden");
      elements.outputPlaceholder.classList.add("hidden");

      ui.showDownloadModal();

      return translatedText;
    } catch (error) {
      console.error("Translation error:", error);
      utils.showError(`翻译失败: ${error.message}`);
      return null;
    } finally {
      utils.setLoading(false);
    }
  },
};

// ==========================================
// UI 事件处理
// ==========================================
const ui = {
  // 初始化事件监听器
  init() {
    // 文件上传处理 - 修复 this 指向问题
    elements.fileInput.addEventListener("change", (event) => this.handleFileUpload(event));
    elements.dropZone.addEventListener("click", () => elements.fileInput.click());
    elements.dropZone.addEventListener("dragover", (event) => this.handleDragOver(event));
    elements.dropZone.addEventListener("dragleave", (event) => this.handleDragLeave(event));
    elements.dropZone.addEventListener("drop", (event) => this.handleDrop(event));
    // 按钮点击处理 - 修复 this 指向问题
    elements.settingsButton.addEventListener("click", () => this.showSettingsModal());
    elements.translateButton.addEventListener("click", () => this.handleTranslate());
    // 初始化设置
    utils.loadSettings();
    lucide.createIcons();
  },

  // 文件上传处理
  handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
      state.fileName = file.name;
      elements.fileName.classList.remove("hidden");
      elements.fileNameText.textContent = file.name;

      const reader = new FileReader();
      reader.onload = (e) => {
        state.inputText = e.target.result;
        elements.inputText.value = state.inputText;
      };
      reader.readAsText(file);
    }
  },

  // 拖放处理
  handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    elements.dropZone.classList.add("upload-zone", "drag-over");
  },

  handleDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();
    elements.dropZone.classList.remove("drag-over");
  },

  handleDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    elements.dropZone.classList.remove("drag-over");

    const file = event.dataTransfer.files[0];
    if (file && file.name.endsWith(".srt")) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      elements.fileInput.files = dataTransfer.files;
      elements.fileInput.dispatchEvent(new Event("change"));
    } else {
      utils.showError("只支持 .srt 格式的文件");
    }
  },

  // 翻译处理
  handleTranslate() {
    state.inputText = elements.inputText.value.trim();

    if (!state.inputText) {
      utils.showError("请输入需要翻译的文本");
      return;
    }

    if (!state.selectedModel) {
      utils.showError("请先设置翻译模型");
      return;
    }

    api.translate(state.inputText);
  },

  // 设置模态框
  showSettingsModal() {
    const modalContent = `
                <div class="bg-white rounded-xl shadow-xl p-6 max-w-md w-full modal-content-enter">
                    <h3 class="text-xl font-semibold mb-4">翻译模型设置</h3>
                    
                    <div class="mb-4">
                        <label class="block text-gray-700 mb-2">选择翻译模型</label>
                        <div class="relative">
                            <div 
                                id="modelSelector"
                                class="flex items-center justify-between p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                                <span>${
                                  state.selectedModel || "请选择模型"
                                }</span>
                                <i data-lucide="chevron-down"></i>
                            </div>
                            <div id="modelOptions" class="hidden absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto dropdown-content">
                                ${CONFIG.PREDEFINED_MODELS.map(
                                  (model) => `
                                    <div
                                        class="model-option p-3 hover:bg-gray-100 cursor-pointer flex items-center justify-between model-card ${
                                          state.selectedModel === model.name
                                            ? "selected"
                                            : ""
                                        }"
                                        data-model="${model.name}">
                                        <span>${model.name}</span>
                                        ${
                                          state.selectedModel === model.name
                                            ? '<i data-lucide="check" class="text-blue-500"></i>'
                                            : ""
                                        }
                                    </div>
                                `
                                ).join("")}
                            </div>
                        </div>
                    </div>
    
                    <div class="mb-4">
                        <label class="block text-gray-700 mb-2">API密钥</label>
                        <input
                            type="password"
                            id="apiKeyInput"
                            class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent custom-input"
                            placeholder="输入API密钥"
                            value="${state.apiKey}">
                        <p class="text-xs text-gray-500 mt-1" id="apiKeyHelp">
                            ${
                              state.selectedModel.includes("OpenAI")
                                ? "OpenAI API密钥，可在 platform.openai.com 获取"
                                : state.selectedModel.includes("Anthropic")
                                ? "Anthropic API密钥，可在 console.anthropic.com 获取"
                                : state.selectedModel.includes("Zhipu")
                                ? "智谱API密钥，可在 open.bigmodel.cn 获取"
                                : state.selectedModel.includes("Deepseek")
                                ? "Deepseek API密钥，可在 platform.deepseek.com 获取"
                                : state.selectedModel.includes("Qwen")
                                ? "通义千问API密钥，可在 dashscope.aliyun.com 获取"
                                : "请输入适用于所选模型的API密钥"
                            }
                        </p>
                    </div>
    
                    ${
                      state.selectedModel === "自定义模型"
                        ? `
                        <div class="mb-4">
                            <label class="block text-gray-700 mb-2">API供应商类型</label>
                            <div class="relative">
                                <div 
                                    id="providerSelector"
                                    class="flex items-center justify-between p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                                    <span>${
                                      CONFIG.PROVIDER_TYPES.find(
                                        (p) => p.id === state.customProviderType
                                      )?.name || "请选择供应商"
                                    }</span>
                                    <i data-lucide="chevron-down"></i>
                                </div>
                                <div id="providerOptions" class="hidden absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto dropdown-content">
                                    ${CONFIG.PROVIDER_TYPES.map(
                                      (provider) => `
                                        <div
                                            class="provider-option p-3 hover:bg-gray-100 cursor-pointer flex items-center justify-between"
                                            data-provider="${provider.id}">
                                            <span>${provider.name}</span>
                                            ${
                                              state.customProviderType ===
                                              provider.id
                                                ? '<i data-lucide="check" class="text-blue-500"></i>'
                                                : ""
                                            }
                                        </div>
                                    `
                                    ).join("")}
                                </div>
                            </div>
                            <p class="text-xs text-gray-500 mt-1">
                                选择API供应商类型以确保正确处理响应格式
                            </p>
                        </div>
                        
                        <div class="mb-4">
                            <label class="block text-gray-700 mb-2">API地址</label>
                            <input
                                type="text"
                                id="apiUrlInput"
                                class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent custom-input"
                                placeholder="输入API地址"
                                value="${state.apiUrl}">
                            <p class="text-xs text-gray-500 mt-1">
                                完整的API端点地址，根据选择的供应商类型会有默认建议值
                            </p>
                        </div>
                        
                        <div class="mb-4">
                            <label class="block text-gray-700 mb-2">模型名称</label>
                            <input
                                type="text"
                                id="modelNameInput"
                                class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent custom-input"
                                placeholder="输入模型名称"
                                value="${state.customModelName}">
                            <p class="text-xs text-gray-500 mt-1" id="modelNameHelp">
                                ${
                                  state.customProviderType === "openai"
                                    ? "例如: gpt-4o, gpt-4-turbo, gpt-4-0125-preview"
                                    : state.customProviderType === "anthropic"
                                    ? "例如: claude-3-opus-20240229, claude-3-sonnet-20240229"
                                    : state.customProviderType ===
                                      "azure-openai"
                                    ? "不需要填写，已在部署ID中配置"
                                    : state.customProviderType === "gemini"
                                    ? "例如: gemini-pro, gemini-1.5-pro"
                                    : state.customProviderType === "zhipu"
                                    ? "例如: glm-4, glm-3-turbo"
                                    : state.customProviderType === "deepseek"
                                    ? "例如: deepseek-chat, deepseek-coder"
                                    : state.customProviderType === "qwen"
                                    ? "例如: qwen-max, qwen-turbo"
                                    : "请输入模型名称"
                                }
                            </p>
                        </div>
                    `
                        : ""
                    }
    
                    <div class="mt-6 flex justify-end space-x-3">
                        <button
                            id="cancelSettingsBtn"
                            class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
                            取消
                        </button>
                        <button
                            id="saveSettingsBtn"
                            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            保存设置
                        </button>
                    </div>
                </div>
            `;

    elements.settingsModal.innerHTML = modalContent;
    elements.settingsModal.classList.remove("hidden");
    elements.settingsModal.classList.add("modal-enter");

    // 更新图标
    lucide.createIcons();

    // 绑定模态框事件
    this.bindSettingsModalEvents();
  },

  // 绑定设置模态框的事件
  bindSettingsModalEvents() {
    const modelSelector = document.getElementById("modelSelector");
    const modelOptions = document.getElementById("modelOptions");
    const apiKeyInput = document.getElementById("apiKeyInput");
    const cancelSettingsBtn = document.getElementById("cancelSettingsBtn");
    const saveSettingsBtn = document.getElementById("saveSettingsBtn");

    // 模型选择器
    if (modelSelector) {
      modelSelector.addEventListener("click", () => {
        modelOptions.classList.toggle("hidden");
      });
    }

    // 模型选项点击
    document.querySelectorAll(".model-option").forEach((option) => {
      option.addEventListener("click", () => {
        const modelName = option.getAttribute("data-model");
        state.selectedModel = modelName;

        // 更新显示的选中模型
        modelSelector.querySelector("span").textContent = modelName;

        // 更新选中样式
        document.querySelectorAll(".model-option").forEach((opt) => {
          opt.classList.remove("selected");
          opt.innerHTML = `<span>${opt.getAttribute("data-model")}</span>`;
        });

        option.classList.add("selected");
        option.innerHTML = `<span>${modelName}</span><i data-lucide="check" class="text-blue-500"></i>`;
        lucide.createIcons();

        // 如果不是自定义模型，自动设置API地址
        if (modelName !== "自定义模型") {
          const predefinedModel = CONFIG.PREDEFINED_MODELS.find(
            (model) => model.name === modelName
          );
          if (predefinedModel) {
            state.apiUrl = predefinedModel.baseUrl;
          }

          // 更新API密钥帮助文本
          const apiKeyHelp = document.getElementById("apiKeyHelp");
          if (apiKeyHelp) {
            apiKeyHelp.textContent = modelName.includes("OpenAI")
              ? "OpenAI API密钥，可在 platform.openai.com 获取"
              : modelName.includes("Anthropic")
              ? "Anthropic API密钥，可在 console.anthropic.com 获取"
              : modelName.includes("Zhipu")
              ? "智谱API密钥，可在 open.bigmodel.cn 获取"
              : modelName.includes("Deepseek")
              ? "Deepseek API密钥，可在 platform.deepseek.com 获取"
              : modelName.includes("Qwen")
              ? "通义千问API密钥，可在 dashscope.aliyun.com 获取"
              : "请输入适用于所选模型的API密钥";
          }
        }

        // 重新渲染模态框以显示/隐藏自定义模型的额外字段
        this.showSettingsModal();

        // 隐藏模型选项
        modelOptions.classList.add("hidden");
      });
    });

    // 如果选择了自定义模型，绑定供应商选择器事件
    if (state.selectedModel === "自定义模型") {
      const providerSelector = document.getElementById("providerSelector");
      const providerOptions = document.getElementById("providerOptions");
      const apiUrlInput = document.getElementById("apiUrlInput");
      const modelNameInput = document.getElementById("modelNameInput");
      const modelNameHelp = document.getElementById("modelNameHelp");

      if (providerSelector) {
        providerSelector.addEventListener("click", () => {
          providerOptions.classList.toggle("hidden");
        });
      }

      // 供应商选项点击
      document.querySelectorAll(".provider-option").forEach((option) => {
        option.addEventListener("click", () => {
          const providerId = option.getAttribute("data-provider");
          state.customProviderType = providerId;

          // 更新显示的选中供应商
          const providerName =
            CONFIG.PROVIDER_TYPES.find((p) => p.id === providerId)?.name ||
            "未知供应商";
          providerSelector.querySelector("span").textContent = providerName;

          // 更新选中样式
          document.querySelectorAll(".provider-option").forEach((opt) => {
            opt.innerHTML = `<span>${
              CONFIG.PROVIDER_TYPES.find(
                (p) => p.id === opt.getAttribute("data-provider")
              )?.name
            }</span>`;
          });

          option.innerHTML = `<span>${providerName}</span><i data-lucide="check" class="text-blue-500"></i>`;
          lucide.createIcons();

          // 根据供应商类型设置默认API URL
          let defaultApiUrl = "";
          switch (providerId) {
            case "openai":
              defaultApiUrl = "https://api.openai.com/v1/chat/completions";
              break;
            case "anthropic":
              defaultApiUrl = "https://api.anthropic.com/v1/messages";
              break;
            case "azure-openai":
              defaultApiUrl =
                "https://{your-resource-name}.openai.azure.com/openai/deployments/{deployment-id}/chat/completions?api-version=2023-05-15";
              break;
            case "gemini":
              defaultApiUrl =
                "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";
              break;
            case "zhipu":
              defaultApiUrl =
                "https://open.bigmodel.cn/api/paas/v4/chat/completions";
              break;
            case "deepseek":
              defaultApiUrl = "https://api.deepseek.com/v1/chat/completions";
              break;
            case "qwen":
              defaultApiUrl =
                "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation";
              break;
          }

          if (apiUrlInput.value === "" || apiUrlInput.value === "https://") {
            apiUrlInput.value = defaultApiUrl;
            state.apiUrl = defaultApiUrl;
          }

          // 更新模型名称帮助文本
          if (modelNameHelp) {
            modelNameHelp.textContent =
              providerId === "openai"
                ? "例如: gpt-4o, gpt-4-turbo, gpt-4-0125-preview"
                : providerId === "anthropic"
                ? "例如: claude-3-opus-20240229, claude-3-sonnet-20240229"
                : providerId === "azure-openai"
                ? "不需要填写，已在部署ID中配置"
                : providerId === "gemini"
                ? "例如: gemini-pro, gemini-1.5-pro"
                : providerId === "zhipu"
                ? "例如: glm-4, glm-3-turbo"
                : providerId === "deepseek"
                ? "例如: deepseek-chat, deepseek-coder"
                : providerId === "qwen"
                ? "例如: qwen-max, qwen-turbo"
                : "请输入模型名称";
          }

          // 隐藏供应商选项
          providerOptions.classList.add("hidden");
        });
      });

      // 监听自定义模型输入
      if (apiUrlInput) {
        apiUrlInput.addEventListener("input", (e) => {
          state.apiUrl = e.target.value;
        });
      }

      if (modelNameInput) {
        modelNameInput.addEventListener("input", (e) => {
          state.customModelName = e.target.value;
        });
      }
    }

    // API密钥输入
    if (apiKeyInput) {
      apiKeyInput.addEventListener("input", (e) => {
        state.apiKey = e.target.value;
      });
    }

    // 取消按钮
    if (cancelSettingsBtn) {
      cancelSettingsBtn.addEventListener("click", () => {
        // 还原之前的状态
        utils.loadSettings();
        elements.settingsModal.classList.add("hidden");
      });
    }

    // 保存按钮
    if (saveSettingsBtn) {
      saveSettingsBtn.addEventListener("click", () => {
        // 检查必要的设置
        if (!state.selectedModel) {
          utils.showError("请选择翻译模型");
          return;
        }

        if (!state.apiKey) {
          utils.showError("请输入API密钥");
          return;
        }

        if (state.selectedModel === "自定义模型") {
          if (!state.apiUrl) {
            utils.showError("请输入API地址");
            return;
          }

          if (!state.customModelName) {
            utils.showError("请输入模型名称");
            return;
          }
        }

        // 保存设置
        utils.saveSettings();

        // 更新模型指示器
        utils.updateModelIndicator();

        // 关闭模态框
        elements.settingsModal.classList.add("hidden");

        // 显示成功提示
        this.showToast("设置已保存");
      });
    }

    // 点击外部区域关闭下拉框
    document.addEventListener("click", (event) => {
      if (
        modelSelector &&
        !modelSelector.contains(event.target) &&
        !modelOptions.contains(event.target)
      ) {
        modelOptions.classList.add("hidden");
      }

      const providerSelector = document.getElementById("providerSelector");
      const providerOptions = document.getElementById("providerOptions");
      if (
        providerSelector &&
        providerOptions &&
        !providerSelector.contains(event.target) &&
        !providerOptions.contains(event.target)
      ) {
        providerOptions.classList.add("hidden");
      }
    });
  },

  // 显示下载模态框
  showDownloadModal() {
    const fileName = state.fileName.replace(/\.[^/.]+$/, "") || "translated";

    const modalContent = `
            <div class="bg-white rounded-xl shadow-xl p-6 max-w-md w-full modal-content-enter">
                <h3 class="text-xl font-semibold mb-4">翻译完成</h3>
                <p class="text-gray-600 mb-4">
                    翻译已完成，请选择下一步操作：
                </p>
                
                <div class="flex flex-col space-y-3">
                    <button id="copyTextBtn" class="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full">
                        <i data-lucide="copy" class="mr-2"></i>
                        复制翻译结果
                    </button>
                    
                    <button id="downloadSrtBtn" class="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors w-full">
                        <i data-lucide="download" class="mr-2"></i>
                        下载翻译文件 (${fileName}_zh.srt)
                    </button>
                    
                    <button id="cancelDownloadBtn" class="flex items-center justify-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors w-full">
                        <i data-lucide="x" class="mr-2"></i>
                        关闭
                    </button>
                </div>
            </div>
        `;

    elements.downloadModal.innerHTML = modalContent;
    elements.downloadModal.classList.remove("hidden");
    elements.downloadModal.classList.add("modal-enter");

    // 更新图标
    lucide.createIcons();

    // 绑定复制文本事件
    document.getElementById("copyTextBtn").addEventListener("click", () => {
      navigator.clipboard
        .writeText(state.outputText)
        .then(() => {
          this.showToast("文本已复制到剪贴板");
        })
        .catch((err) => {
          utils.showError("复制失败: " + err.message);
        });
    });

    // 绑定下载SRT事件
    document.getElementById("downloadSrtBtn").addEventListener("click", () => {
      const blob = new Blob([state.outputText], {
        type: "text/plain;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const downloadFileName = `${fileName}_zh.srt`;

      const a = document.createElement("a");
      a.href = url;
      a.download = downloadFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      this.showToast(`已下载: ${downloadFileName}`);
    });

    // 绑定取消按钮事件
    document
      .getElementById("cancelDownloadBtn")
      .addEventListener("click", () => {
        elements.downloadModal.classList.add("hidden");
      });

    // 点击模态框外部区域关闭模态框
    elements.downloadModal.addEventListener("click", (event) => {
      if (event.target === elements.downloadModal) {
        elements.downloadModal.classList.add("hidden");
      }
    });
  },

  // 显示提示消息
  showToast(message) {
    // 移除现有的toast
    const existingToast = document.querySelector(".toast");
    if (existingToast) {
      document.body.removeChild(existingToast);
    }

    // 创建新的toast
    const toast = document.createElement("div");
    toast.className =
      "toast flex items-center bg-gray-800 text-white py-2 px-4 rounded-lg shadow-lg";
    toast.innerHTML = `
            <i data-lucide="check-circle" class="mr-2"></i>
            <span>${message}</span>
        `;

    document.body.appendChild(toast);
    lucide.createIcons();

    // 3秒后自动消失
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(10px)";
      toast.style.transition = "opacity 0.3s ease, transform 0.3s ease";

      setTimeout(() => {
        if (toast.parentNode) {
          document.body.removeChild(toast);
        }
      }, 300);
    }, 3000);
  },
};

// ==========================================
// 模态框全局处理
// ==========================================
window.addEventListener("click", (event) => {
  if (event.target === elements.settingsModal) {
    elements.settingsModal.classList.add("hidden");
  }

  if (event.target === elements.downloadModal) {
    elements.downloadModal.classList.add("hidden");
  }
});

// 按下ESC键关闭模态框
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    elements.settingsModal.classList.add("hidden");
    elements.downloadModal.classList.add("hidden");
  }
});

// ==========================================
// 初始化应用
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  ui.init();
});
