let allResults = [];
let filteredResults = [];
let currentFilter = 'all';
let currentSort = 'relevance';
let isReversed = false;
let searchInput = '';

const knownTypes = ['all', 'resource', 'document', 'link'];

// 计算相关性分数
function calculateRelevance(item, input) {
    let score = 0;
    const inputLower = input.toLowerCase();
    const title = item.title?.toLowerCase() || '';
    const description = item.description?.toLowerCase() || '';
    
    // 计算标题匹配分数
    if (title) {
        // 完全匹配
        if (title === inputLower) {
            score += 100;
        }
        // 标题包含关键词
        if (title.includes(inputLower)) {
            score += 20;
        }
        // 标题开头匹配
        if (title.startsWith(inputLower)) {
            score += 15;
        }
    }
    
    // 计算描述匹配分数
    if (description) {
        // 完全匹配
        if (description === inputLower) {
            score += 50;
        }
        // 描述包含关键词
        if (description.includes(inputLower)) {
            score += 10;
        }
        // 描述开头匹配
        if (description.startsWith(inputLower)) {
            score += 5;
        }
    }
    
    return score;
}

// 搜索函数
function search(data, input, categoryName = null) {
    // 如果传入的是单个类别的数据，包装成对象
    const searchData = categoryName ? { [categoryName]: data } : data;
    
    for (let category in searchData) {
        const categoryItems = searchData[category];
        if (typeof categoryItems === 'object' && categoryItems !== null) {
            for (let key in categoryItems) {
                const item = categoryItems[key];
                if (item.title && item.url) {
                    const relevance = calculateRelevance(item, input);
                    if (relevance > 0) {
                        // 为链接添加创建时间和修改时间，设置为相同且最早
                        const defaultDate = new Date(0).getTime(); // 1970-01-01 00:00:00
                        allResults.push({
                            ...item,
                            relevance: relevance,
                            type: category,
                            created: defaultDate,
                            modified: defaultDate
                        });
                    }
                }
            }
        }
    }
}

// 高亮匹配文本
function highlightMatch(text, input) {
    if (!text || !input) return text;
    
    const regex = new RegExp(`(${input})`, 'gi');
    return text.replace(regex, '<span class="highlight">$1</span>');
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

// 渲染搜索结果
function renderResults(results) {
    const resultDiv = document.querySelector('.result');
    if (!resultDiv) return;
    
    // 创建搜索结果容器
    const searchResultsContainer = document.createElement('div');
    searchResultsContainer.className = 'search-results';
    
    // 创建结果统计和控制区域
    const resultsHeader = document.createElement('div');
    resultsHeader.className = 'results-header';
    
    // 结果统计
    const resultsCount = document.createElement('div');
    resultsCount.className = 'results-count';
    resultsCount.textContent = `找到 ${results.length} 个结果`;
    
    // 结果控制（筛选器和排序器）
    const resultsControls = document.createElement('div');
    resultsControls.className = 'results-controls';
    
    // 筛选器
    const filterContainer = document.createElement('div');
    filterContainer.className = 'filter';
    
    const filterSelect = document.createElement('select');
    filterSelect.innerHTML = `
        <option value="all">全部</option>
        <option value="resource">资源</option>
        <option value="document">文档</option>
        <option value="link">链接</option>
    `;
    filterSelect.value = currentFilter;
    filterSelect.addEventListener('change', (e) => {
        const newFilter = e.target.value;
        currentFilter = newFilter;
        applyFiltersAndSort();
        updateURLAndSubmit(newFilter);
    });
    
    filterContainer.appendChild(filterSelect);
    
    // 排序器
    const sortContainer = document.createElement('div');
    sortContainer.className = 'sort';
    
    const sortSelect = document.createElement('select');
    sortSelect.innerHTML = `
        <option value="relevance">相关顺序</option>
        <option value="alphabet">字母顺序</option>
        <option value="created">创建时间</option>
        <option value="modified">修改时间</option>
    `;
    sortSelect.value = currentSort;
    sortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        applyFiltersAndSort();
    });
    
    sortContainer.appendChild(sortSelect);
    
    // 反转按钮
    const reverseBtn = document.createElement('button');
    reverseBtn.className = 'reverse-btn';
    reverseBtn.innerHTML = '反转<span>↕️</span>';
    reverseBtn.addEventListener('click', () => {
        isReversed = !isReversed;
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
    const resultsList = document.createElement('div');
    resultsList.className = 'results-list';
    
    // 渲染每个搜索结果
    results.forEach(item => {
        const resultItem = document.createElement('a');
        resultItem.className = 'search-result-item';
        resultItem.href = item.url;
        resultItem.target = '_blank';
        
        const resultContent = document.createElement('div');
        
        const resultTitle = document.createElement('h4');
        resultTitle.innerHTML = highlightMatch(item.title, searchInput);
        
        const resultDesc = document.createElement('p');
        const truncatedDesc = truncateText(item.description);
        resultDesc.innerHTML = highlightMatch(truncatedDesc, searchInput);
        
        resultContent.appendChild(resultTitle);
        resultContent.appendChild(resultDesc);
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
    filteredResults = allResults.filter(item => {
        if (currentFilter === 'all') return true;
        return item.type === currentFilter;
    });
    
    // 排序
    filteredResults.sort((a, b) => {
        let comparison = 0;
        
        switch (currentSort) {
            case 'relevance':
                // 先按相关性排序
                comparison = b.relevance - a.relevance;
                // 如果相关性相同，按字母顺序排序
                if (comparison === 0) {
                    comparison = a.title.localeCompare(b.title);
                }
                break;
            case 'alphabet':
                comparison = a.title.localeCompare(b.title);
                break;
            case 'created':
                comparison = (a.created || 0) - (b.created || 0);
                break;
            case 'modified':
                comparison = (a.modified || 0) - (b.modified || 0);
                break;
            default:
                // 默认排序：先按相关性，再按字母
                comparison = b.relevance - a.relevance;
                if (comparison === 0) {
                    comparison = a.title.localeCompare(b.title);
                }
        }
        
        // 反转顺序
        if (isReversed) {
            comparison = -comparison;
        }
        
        return comparison;
    });
    
    // 渲染结果
    renderResults(filteredResults);
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
        
        searchInput = searchTerm.toLowerCase();
        
        // 验证type是否为已知类型
        if (type && !knownTypes.includes(type)) {
            showError('无效的筛选类型');
            return;
        }
        
        // 设置当前筛选器
        currentFilter = type || 'all';
        
        // 显示搜索中状态
        showSearching();
        
        fetch('search.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`错误: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                // 清空之前的结果
                allResults = [];
                
                // 当type为'all'或不存在时，搜索所有类型
                if (!type || type === 'all') {
                    search(data, searchInput);
                } else {
                    // 检查data中是否存在该类型
                    if (data[type]) {
                        search(data[type], searchInput, type);
                    }
                }
                
                // 应用筛选和排序
                applyFiltersAndSort();
            })
            .catch(error => {
                console.error(error);
                // 错误情况下显示错误信息
                showError('搜索失败，请稍后重试');
            });
    }
}

// 页面加载完成后初始化搜索
window.addEventListener('DOMContentLoaded', () => {
    // 从URL获取搜索参数并设置到搜索框
    const urlParams = new URL(window.location.href).searchParams;
    const searchInput = urlParams.get('search');
    const searchBox = document.querySelector('.search input[type="search"]');
    
    if (searchBox && searchInput) {
        searchBox.value = searchInput;
    }
    
    // 初始化搜索
    initSearch();
});