// 搜索配置
const searchConfig = {
    // 搜索类型
    knownTypes: ['all', 'software', 'tools', 'document', 'link'],
    // 防抖延迟时间（毫秒）
    debounceDelay: 300,
    // 相似度阈值
    similarityThreshold: 0.7,
    // 相关性权重配置
    weights: {
        title: {
            exact: 100,
            includes: 20,
            startsWith: 15,
            similarity: 10
        },
        description: {
            exact: 50,
            includes: 10,
            startsWith: 5,
            similarity: 3
        }
    }
};

// 搜索状态
let searchState = {
    allResults: [],
    filteredResults: [],
    currentFilter: 'all',
    currentSort: 'relevance',
    isReversed: false,
    searchInput: ''
};

// 防抖函数
function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

// 处理时间字段，支持字符串和数字格式
function processDateField(dateValue) {
    if (!dateValue) return 0;
    if (typeof dateValue === 'string') {
        return new Date(dateValue).getTime() || 0;
    }
    return typeof dateValue === 'number' ? dateValue : 0;
}

// 分词函数，将输入文本分割为关键词数组
function tokenize(input) {
    // 分割关键词，支持空格、逗号等分隔符
    return input.toLowerCase().trim().split(/[\s,，]+/).filter(token => token.length > 0);
}

// 计算两个字符串的编辑距离（Levenshtein距离）
function calculateEditDistance(str1, str2) {
    const matrix = [];
    
    // 初始化矩阵
    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
    }
    
    // 计算编辑距离
    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // 替换
                    matrix[i][j - 1] + 1,     // 插入
                    matrix[i - 1][j] + 1      // 删除
                );
            }
        }
    }
    
    return matrix[str2.length][str1.length];
}

// 计算相似度（0-1之间）
function calculateSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;
    
    const distance = calculateEditDistance(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);
    return 1 - (distance / maxLength);
}

// 计算相关性分数
function calculateRelevance(item, input) {
    let score = 0;
    const tokens = tokenize(input);
    const title = item.title?.toLowerCase() || '';
    const description = item.description?.toLowerCase() || '';
    
    // 对每个关键词计算分数
    tokens.forEach(token => {
        // 计算标题匹配分数
        if (title) {
            // 完全匹配
            if (title === token) {
                score += searchConfig.weights.title.exact;
            }
            // 标题包含关键词
            if (title.includes(token)) {
                score += searchConfig.weights.title.includes;
            }
            // 标题开头匹配
            if (title.startsWith(token)) {
                score += searchConfig.weights.title.startsWith;
            }
            // 模糊匹配（相似度）
            const titleSimilarity = calculateSimilarity(title, token);
            if (titleSimilarity > searchConfig.similarityThreshold) {
                score += Math.round(searchConfig.weights.title.similarity * titleSimilarity);
            }
        }
        
        // 计算描述匹配分数
        if (description) {
            // 完全匹配
            if (description === token) {
                score += searchConfig.weights.description.exact;
            }
            // 描述包含关键词
            if (description.includes(token)) {
                score += searchConfig.weights.description.includes;
            }
            // 描述开头匹配
            if (description.startsWith(token)) {
                score += searchConfig.weights.description.startsWith;
            }
            // 模糊匹配（相似度）
            const descSimilarity = calculateSimilarity(description, token);
            if (descSimilarity > searchConfig.similarityThreshold) {
                score += Math.round(searchConfig.weights.description.similarity * descSimilarity);
            }
        }
    });
    
    return score;
}

// 搜索函数
function search(data, input, categoryName = null) {
    // 数据验证
    if (!data || typeof data !== 'object' || !input || typeof input !== 'string') {
        console.warn('搜索数据或输入无效:', { data, input });
        return;
    }
    
    // 如果传入的是单个类别的数据，包装成对象
    const searchData = categoryName ? { [categoryName]: data } : data;
    
    // 确保 searchData 是对象
    if (typeof searchData !== 'object' || searchData === null) {
        console.warn('搜索数据结构无效:', searchData);
        return;
    }
    
    // 默认日期（1970-01-01）
    const defaultDate = new Date(0).getTime();
    
    // 遍历搜索数据
    Object.entries(searchData).forEach(([category, categoryItems]) => {
        if (typeof categoryItems === 'object' && categoryItems !== null) {
            Object.entries(categoryItems).forEach(([key, item]) => {
                // 验证项目结构
                if (item && typeof item === 'object' && item.title && item.url) {
                    try {
                        const relevance = calculateRelevance(item, input);
                        if (relevance > 0) {
                            searchState.allResults.push({
                                ...item,
                                relevance: relevance,
                                type: category,
                                created: item.created || defaultDate,
                                modified: item.modified || defaultDate
                            });
                        }
                    } catch (error) {
                        console.error('计算相关性时出错:', error, item);
                    }
                }
            });
        }
    });
}

// 高亮匹配文本
function highlightMatch(text, input) {
    if (!text || !input) return text;
    
    const tokens = tokenize(input);
    let result = text;
    
    // 对每个关键词进行高亮处理
    tokens.forEach(token => {
        const regex = new RegExp(`(${token})`, 'gi');
        result = result.replace(regex, '<span class="highlight">$1</span>');
    });
    
    return result;
}

// 长文本省略处理
function truncateText(text, maxLength = 100) {
    if (!text || text.length <= maxLength) return text;
    
    const truncated = text.substring(0, maxLength);
    return truncated + '...';
}

// 显示错误信息
function showError(message) {
    const resultDiv = document.querySelector('.result');
    if (resultDiv) {
        resultDiv.innerHTML = `<div class="error">${message}</div>`;
    }
}

// 更新URL参数并提交表单
function updateURLAndSubmit(type) {
    const form = document.querySelector('.search form');
    if (!form) return;
    
    // 获取当前搜索词
    const currentSearch = new URL(window.location.href).searchParams.get('search') || '';
    
    const url = new URL(window.location.href);
    url.searchParams.set('search', currentSearch);
    url.searchParams.set('type', type);
    
    // 重新加载页面
    window.location.href = url.href;
}

// 格式化日期函数
function formatDate(timestamp) {
    if (!timestamp) return '未知';
    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

// 创建DOM元素的辅助函数
function createElement(tag, className, content = '') {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (content) {
        if (tag === 'select') {
            element.innerHTML = content;
        } else {
            element.textContent = content;
        }
    }
    return element;
}

// 渲染搜索结果
function renderResults(results) {
    const resultDiv = document.querySelector('.result');
    if (!resultDiv) return;
    
    // 创建搜索结果容器
    const searchResultsContainer = createElement('div', 'search-results');
    
    // 创建结果统计和控制区域
    const resultsHeader = createElement('div', 'results-header');
    
    // 结果统计
    const resultsCount = createElement('div', 'results-count', `找到 ${results.length} 个结果`);
    
    // 结果控制（筛选器和排序器）
    const resultsControls = createElement('div', 'results-controls');
    
    // 筛选器
    const filterContainer = createElement('div', 'filter');
    const filterSelect = createElement('select', '', `
        <option value="all">全部</option>
        <option value="software">软件</option>
        <option value="tools">工具</option>
        <option value="document">文档</option>
        <option value="link">链接</option>
    `);
    filterSelect.value = searchState.currentFilter;
    filterSelect.addEventListener('change', (e) => {
        const newFilter = e.target.value;
        searchState.currentFilter = newFilter;
        applyFiltersAndSort();
        updateURLAndSubmit(newFilter);
    });
    filterContainer.appendChild(filterSelect);
    
    // 排序器
    const sortContainer = createElement('div', 'sort');
    const sortSelect = createElement('select', '', `
        <option value="relevance">相关顺序</option>
        <option value="alphabet">字母顺序</option>
        <option value="created">创建时间</option>
        <option value="modified">修改时间</option>
    `);
    sortSelect.value = searchState.currentSort;
    sortSelect.addEventListener('change', (e) => {
        searchState.currentSort = e.target.value;
        applyFiltersAndSort();
    });
    sortContainer.appendChild(sortSelect);
    
    // 反转按钮
    const reverseBtn = createElement('button', 'reverse-btn', '反转<span>↕️</span>');
    reverseBtn.innerHTML = '反转<span>↕️</span>';
    reverseBtn.addEventListener('click', () => {
        searchState.isReversed = !searchState.isReversed;
        applyFiltersAndSort();
    });
    
    // 组装结果控制区域
    resultsControls.appendChild(filterContainer);
    resultsControls.appendChild(sortContainer);
    resultsControls.appendChild(reverseBtn);
    
    // 组装结果统计和控制区域
    resultsHeader.appendChild(resultsCount);
    resultsHeader.appendChild(resultsControls);
    
    // 创建结果列表
    const resultsList = createElement('div', 'results-list');
    
    // 渲染每个搜索结果
    results.forEach(item => {
        const resultItem = createElement('a', 'search-result-item');
        resultItem.href = item.url;
        resultItem.target = '_blank';
        
        const resultContent = createElement('div');
        
        const resultTitle = createElement('h4');
        resultTitle.innerHTML = highlightMatch(item.title, searchState.searchInput);
        
        const resultDesc = createElement('p');
        const truncatedDesc = truncateText(item.description);
        resultDesc.innerHTML = highlightMatch(truncatedDesc, searchState.searchInput);
        
        // 创建日期信息容器
        const resultMeta = createElement('div', 'result-meta');
        
        // 创建日期信息
        const resultCreated = createElement('span', 'result-created', `创建时间: ${formatDate(item.created)}`);
        const resultModified = createElement('span', 'result-modified', `修改时间: ${formatDate(item.modified)}`);
        
        // 组装日期信息
        resultMeta.appendChild(resultCreated);
        resultMeta.appendChild(resultModified);
        
        // 组装搜索结果内容
        resultContent.appendChild(resultTitle);
        resultContent.appendChild(resultDesc);
        resultContent.appendChild(resultMeta);
        resultItem.appendChild(resultContent);
        
        resultsList.appendChild(resultItem);
    });
    
    // 组装搜索结果容器
    searchResultsContainer.appendChild(resultsHeader);
    searchResultsContainer.appendChild(resultsList);
    
    // 更新DOM
    resultDiv.innerHTML = '';
    resultDiv.appendChild(searchResultsContainer);
}

// 应用筛选和排序
function applyFiltersAndSort() {
    // 筛选
    searchState.filteredResults = searchState.allResults.filter(item => {
        if (searchState.currentFilter === 'all') return true;
        return item.type === searchState.currentFilter;
    });
    
    // 排序
    searchState.filteredResults.sort((a, b) => {
        let comparison = 0;
        
        // 基础排序
        switch (searchState.currentSort) {
            case 'relevance':
                comparison = b.relevance - a.relevance;
                break;
            case 'alphabet':
                comparison = a.title.localeCompare(b.title);
                break;
            case 'created':
                // 创建时间：最旧的排在最前（升序）
                comparison = processDateField(b.created) - processDateField(a.created);
                break;
            case 'modified':
                // 修改时间：最新的排在最前（降序）
                comparison = processDateField(b.modified) - processDateField(a.modified);
                break;
            default:
                comparison = b.relevance - a.relevance;
        }
        
        // 当相关性排序且相关性相同时，按字母顺序排序
        if ((searchState.currentSort === 'relevance' || searchState.currentSort === 'default') && comparison === 0) {
            comparison = a.title.localeCompare(b.title);
        }
        
        // 反转顺序
        if (searchState.isReversed) {
            comparison = -comparison;
        }
        
        return comparison;
    });
    
    // 渲染结果
    renderResults(searchState.filteredResults);
}

// 显示搜索中状态
function showSearching() {
    const resultDiv = document.querySelector('.result');
    if (resultDiv) {
        resultDiv.innerHTML = '<div class="searching">搜索中</div>';
    }
}

// 初始化搜索
function initSearch() {
    const form = (new URL(window.location.href)).searchParams;
    if (form.size > 0) {
        let type = form.get('type');
        let searchTerm = form.get('search');
        
        // 检查搜索词是否为空或只包含空格
        if (!searchTerm || searchTerm.trim() === '') {
            showError('请输入有效的搜索关键词');
            return;
        }
        
        searchState.searchInput = searchTerm.toLowerCase();
        
        // 验证type是否为已知类型
        if (type && !searchConfig.knownTypes.includes(type)) {
            showError('无效的筛选类型');
            return;
        }
        
        // 设置当前筛选器
        searchState.currentFilter = type || 'all';
        
        // 显示搜索中状态
        showSearching();
        
        fetch('search.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP错误: ${response.status} ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                // 验证返回的数据结构
                if (!data || typeof data !== 'object') {
                    throw new Error('搜索数据格式无效');
                }
                
                // 清空之前的结果
                searchState.allResults = [];
                
                // 当type为'all'或不存在时，搜索所有类型
                if (!type || type === 'all') {
                    search(data, searchState.searchInput);
                } else {
                    // 检查data中是否存在该类型
                    if (data[type]) {
                        search(data[type], searchState.searchInput, type);
                    } else {
                        console.warn(`类型 ${type} 在数据中不存在`);
                    }
                }
                
                // 应用筛选和排序
                applyFiltersAndSort();
            })
            .catch(error => {
                console.error('搜索过程中出错:', error);
                // 错误情况下显示错误信息
                let errorMessage = '搜索失败，请稍后重试';
                if (error.message.includes('HTTP错误')) {
                    errorMessage = `网络错误: ${error.message}`;
                } else if (error.message.includes('JSON')) {
                    errorMessage = '数据解析错误，请检查搜索数据文件';
                }
                showError(errorMessage);
            });
    }
}

// 页面加载完成后初始化搜索
window.addEventListener('DOMContentLoaded', () => {
    // 从URL获取搜索参数并设置到搜索框
    const urlParams = new URL(window.location.href).searchParams;
    const searchInput = urlParams.get('search');
    const searchBox = document.querySelector('.search input[type="search"]');
    const searchForm = document.querySelector('.search form');
    
    if (searchBox && searchInput) {
        searchBox.value = searchInput;
    }
    
    // 为搜索表单添加防抖处理
    if (searchForm) {
        const debouncedSearch = debounce((e) => {
            e.preventDefault();
            const formData = new FormData(searchForm);
            const searchValue = formData.get('search');
            
            if (searchValue && searchValue.trim() !== '') {
                const url = new URL(window.location.href);
                url.searchParams.set('search', searchValue.trim());
                url.searchParams.set('type', 'all');
                window.location.href = url.href;
            }
        }, 300);
        
        searchForm.addEventListener('submit', debouncedSearch);
    }
    
    // 初始化搜索
    initSearch();
});